import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Searchbar, IconButton, Dialog, Portal, Button } from 'react-native-paper';
import Context from '@/context/createContext';
import { moveMultipleToBin, deleteMultipleNotes, initDatabase, getAllTags } from '@/utils/db';
import { cancelPushNotification } from '@/components/Notification';
import NoteSkeleton from '@/components/NoteSkeleton';
import NotesGrid from '@/components/home/NotesGrid';
import SelectionHeader from '@/components/home/SelectionHeader';
import EmptyState from '@/components/home/EmptyState';
import TagList from '@/components/tags/TagList';

interface Note {
  id: number;
  title: string;
  content: string;
  isInBin: number;
  reminder?: number | null;
  isLocked?: number;
  tags?: Array<{name: string, color: string}>;
}

export default function Index() {
  const context = useContext(Context);
  const { fetchNotes, notes, loading, setLoading, removeNoteFromState } = context;
  const [dialogVisible, setDialogVisible] = useState(false);

  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const router = useRouter();
  const selectionAnimation = useRef(new Animated.Value(0)).current;

  // Animate the selection mode header
  useEffect(() => {
    Animated.timing(selectionAnimation, {
      toValue: isSelectionMode ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isSelectionMode]);

  // Fetch notes on initial load only, not on every navigation
  useEffect(() => {
    const initialize = async () => {
      await initDatabase();
      if (notes.length === 0) {
        setLoading(true);
        await fetchNotes();
      }
    };
    initialize();
  }, []); // No dependencies to prevent re-runs on navigation

  // Load all tags on initial render
  useEffect(() => {
    const loadTags = async () => {
      const tags = await getAllTags();
      setAllTags(tags);
    };
    loadTags();
  }, [notes]);

  // Filter notes based on the search query and selected tags
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let filtered = [...notes];

      // Apply search filter - only search in unlocked notes
      if (searchQuery) {
        filtered = filtered.filter((note: any) => {
          // Don't search in locked notes
          if (note.isLocked) return false;
          
          return (note.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                 (note.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        });
      }

      // Apply tag filter if any tags are selected
      if (selectedTags.length > 0) {
        filtered = filtered.filter((note: Note) => {
          // If note is locked, filter it out when tags are selected
          if (note.isLocked) return false;
          
          // If note has no tags, filter it out when tags are selected
          if (!note.tags || note.tags.length === 0) return false;

          // Check if note has at least one of the selected tags by comparing tag names
          return selectedTags.some(selectedTag => 
            note.tags!.some(noteTag => noteTag.name === selectedTag)
          );
        });
      }

      setFilteredNotes(filtered);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, notes, selectedTags]);

  const toggleDialogSwitch = () => setDialogVisible(!dialogVisible);

  // Handle note press with selection mode logic
  const handleNotePress = async (note: Note) => {
    if (isSelectionMode) {
      setSelectedNotes(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(note.id)) {
          newSelection.delete(note.id);
        } else {
          newSelection.add(note.id);
        }
        return newSelection;
      });
    } else {
      router.push(`/note/${note.id}`);
    }
  };

  // Handle long press to enable selection mode
  const handleLongPress = (id: number) => {
    setIsSelectionMode(true);
    setSelectedNotes(prev => new Set(prev).add(id));
  };

  // Handle delete action
  const handleDeleteSelectedNotes = async () => {
    const noteIds = Array.from(selectedNotes);
    const notificationIds = await moveMultipleToBin(noteIds);
    
    if (Array.isArray(notificationIds)) {
      for (const notificationId of notificationIds) {
        await cancelPushNotification(notificationId);
      }
    }
    
    // Update state without fetching all notes
    noteIds.forEach(id => removeNoteFromState(id));
    
    setSelectedNotes(new Set());
    setIsSelectionMode(false);
  };

  // Handle delete permanently
  const handleDeleteNotePermanently = async () => {
    try {
      const noteIds = Array.from(selectedNotes);
      const notificationIds = await deleteMultipleNotes(noteIds);
      
      if (Array.isArray(notificationIds)) {
        for (const notificationId of notificationIds) {
          await cancelPushNotification(notificationId);
        }
      }
      
      // Update state without fetching all notes
      noteIds.forEach(id => removeNoteFromState(id));
      
      toggleDialogSwitch();
      setSelectedNotes(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Exit selection mode
  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedNotes(new Set());
  };

  // Automatically exit selection mode if no notes are selected
  useEffect(() => {
    if (isSelectionMode && selectedNotes.size === 0) {
      handleExitSelectionMode();
    }
  }, [selectedNotes]);

  // Add tag selection handler
  const handleTagSelection = (tag: string) => {
    setSelectedTags(prevTags => {
      if (prevTags.includes(tag)) {
        return prevTags.filter(t => t !== tag);
      } else {
        return [...prevTags, tag];
      }
    });
  };

  // Header animation transforms - Using standard interpolation
  const headerTranslateY = selectionAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 10], // Adjust this to position the header below the search bar
  });

  const searchBarTranslateY = selectionAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0], // Keep search bar in place
  });

  const searchBarOpacity = selectionAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.3], // Fade the search bar when selection mode is active
  });

  // Add refresh handler for tag list
  const refreshTagsAndNotes = async () => {
    setLoading(true);
    try {
      await fetchNotes();
      const tags = await getAllTags();
      setAllTags(tags);
    } catch (error) {
      console.error('Error refreshing tags and notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use refreshTagsAndNotes instead of fetchNotes in places where we want to update both
  return (
    <View style={styles.container}>
      {/* Modern search bar */}
      <Animated.View 
        style={[
          styles.searchBarContainer, 
          { 
            transform: [{ translateY: searchBarTranslateY }],
            opacity: searchBarOpacity
          }
        ]}
      >
        <Searchbar
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholder="Search notes"
          placeholderTextColor="#777"
          value={searchQuery}
          inputStyle={{ color: '#ccc' }}
          iconColor="#fff"
        />
      </Animated.View>
      
      {/* Tag list */}
      {!isSelectionMode && allTags.length > 0 && (
        <TagList 
          tags={allTags}
          selectedTags={selectedTags}
          onTagPress={handleTagSelection}
        />
      )}

      {/* Selection mode header */}
      <SelectionHeader 
        count={selectedNotes.size}
        onDelete={handleDeleteSelectedNotes}
        onPermanentDelete={toggleDialogSwitch}
        onCancel={handleExitSelectionMode}
        style={{ 
          transform: [{ translateY: headerTranslateY }],
          opacity: selectionAnimation,
        }}
      />

      {/* Notes grid or empty state */}
      {filteredNotes.length === 0 && !loading ? (
        <EmptyState searchQuery={searchQuery} />
      ) : loading ? (
        <NoteSkeleton count={6} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refreshTagsAndNotes} />
          }
        >
          <NotesGrid 
            notes={filteredNotes}
            selectedNotes={selectedNotes}
            isSelectionMode={isSelectionMode}
            onNotePress={handleNotePress}
            onNoteLongPress={handleLongPress}
          />
        </ScrollView>
      )}

      {/* Add new note button */}
      {!isSelectionMode && (
        <IconButton
          icon="plus"
          mode="contained"
          onPress={() => router.push('/note/new')}
          style={styles.addButton}
          containerColor="#ededed"
          iconColor="#000"
          size={30}
        />
      )}

      {/* Delete confirmation dialog */}
      <Portal>
        <Dialog 
          visible={dialogVisible} 
          onDismiss={toggleDialogSwitch} 
          style={styles.dialog}
        >
          <Dialog.Icon icon="alert" color="#f44336" />
          <Dialog.Title style={styles.dialogTitle}>
            Delete permanently?
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogContent}>
              This action cannot be undone. These notes will be permanently deleted.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#999" onPress={toggleDialogSwitch}>Cancel</Button>
            <Button textColor="#fff" onPress={handleDeleteNotePermanently}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  searchBarContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 5,
    position: 'relative',
    zIndex: 5, // Lower than selection header
  },
  searchInput: {
    backgroundColor: '#111',
    borderRadius: 12,
    elevation: 0,
    height: 50,
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 5,
  },
  dialog: {
    backgroundColor: '#171717',
    borderRadius: 12,
    borderColor: '#333',
    borderWidth: 1,
  },
  dialogTitle: {
    color: '#fff',
    fontFamily: 'RobotoMono',
    fontSize: 18,
  },
  dialogContent: {
    color: '#aaa',
    fontFamily: 'PTMono',
    fontSize: 14,
  },
  selectionHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  dialogActionBtn: {
    color: '#fff',
  },
  dialogCancelBtn: {
    color: '#999',
  },
});
