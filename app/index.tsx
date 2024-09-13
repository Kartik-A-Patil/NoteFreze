import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, RefreshControlBase } from 'react-native';
import { useRouter } from 'expo-router';
import { RichEditor } from 'react-native-pell-rich-editor';
import { ThemedText } from '@/components/ThemedText';
import { Searchbar, IconButton, Tooltip } from 'react-native-paper';
import Context from '@/context/createContext';
import { moveMultipleToBin, deleteMultipleNotes, initDatabase } from '@/utils/db'; // Import the function
import { Button, Dialog, Portal } from 'react-native-paper';

const { width: screenWidth } = Dimensions.get('window');
const NoteWidth = screenWidth / 2 - 15;
const RICH_EDITOR_MAX_HEIGHT = 200;

interface Note {
  id: number;
  title: string;
  content: string;
  isInBin: number;
  reminder?: number | null;
}

export default function Index() {
  const context = useContext(Context);
  const { fetchNotes, notes, loading, setLoading,onToggleSnackBar } = context;
  const [dialogVisible, setDialogVisible] = useState(false);

  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());
  const router = useRouter();
  const richText = useRef<RichEditor>(null);

  // Fetch notes on initial load
  useEffect(() => {
    initDatabase();
    const fetch = async () => {
      setLoading(true);
      await fetchNotes();
    };
    fetch();
  }, [fetchNotes]);

  // Filter notes based on the search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        const filtered = notes.filter((note: any) =>
          (note.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (note.content?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        );
        setFilteredNotes(filtered);
      } else {
        setFilteredNotes(notes);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, notes]);




  const toggleDialogSwitch = () => setDialogVisible(!dialogVisible);

  // Handle note press (tap)
  const handleNotePress = (id: number) => {
    if (isSelectionMode) {
      setSelectedNotes(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
        }
        return newSelection;
      });
    } else {
      router.push(`/note/${id}`);
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
    await moveMultipleToBin(noteIds)
    setSelectedNotes(new Set());
    setIsSelectionMode(false);
    await fetchNotes(); // Refresh notes after deletion
  };

  // Handle archive action
  const handleDeleteNotePermanently = async () => {
    try {
      const noteIds = Array.from(selectedNotes);
      await deleteMultipleNotes(noteIds);
      // if (notificationId) {
      //   await cancelPushNotification(notificationId);
      // }
      // router.navigate('/');
      toggleDialogSwitch()
    } catch (error) {
      console.error('Error deleting note:', error);
      Alert.alert('Error', 'Failed to delete note.');
    }
    setSelectedNotes(new Set());
    setIsSelectionMode(false);
  };

  // Handle exiting selection mode
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

  // Render each note
  const renderNote = (item: Note) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.noteContainer,
        selectedNotes.has(item.id) && styles.selectedNote
      ]}
      onPress={() => handleNotePress(item.id)}
      onLongPress={() => handleLongPress(item.id)}
    >

      {item.title && (
        <ThemedText style={styles.noteTitle}>{item.title}</ThemedText>
      )}
      {item.content ? (
        <RichEditor
          ref={richText}
          style={styles.editor}
          initialContentHTML={item.content}
          editorStyle={{ backgroundColor: '#000', color: '#ccc' }}
          disabled={true}
          forceDarkOn
        />
      ) : (
        <Text style={styles.noContentText}>No content available</Text>
      )}
    </TouchableOpacity>
  );

  // Split notes into two columns for layout
  const splitNotes = () => {
    const leftColumn: Note[] = [];
    const rightColumn: Note[] = [];
    filteredNotes.forEach((note, index) => {
      if (index % 2 === 0) {
        leftColumn.push(note);
      } else {
        rightColumn.push(note);
      }
    });
    return { leftColumn, rightColumn };
  };

  const { leftColumn, rightColumn } = splitNotes();

  return (
    <View style={styles.container}>
      {isSelectionMode ? (
        <View style={styles.header}>
          <Tooltip title="Move to Bin">
            <IconButton
              icon="delete-clock"
              mode="contained"
              onPress={handleDeleteSelectedNotes}
              style={styles.headerButton}
              containerColor="#111"
              iconColor="#fff"
              size={27}
            />
          </Tooltip>
          <Tooltip title="Delete Permanently">

            <IconButton
              icon="delete-forever-outline"
              mode="contained"
              onPress={toggleDialogSwitch}
              style={styles.headerButton}
              containerColor="#111"
              iconColor="#fff"
              size={27}

            />
          </Tooltip>
          <Tooltip title="close">
            <IconButton
              icon="window-close"
              mode="contained"
              onPress={handleExitSelectionMode}
              style={styles.exitSelectionButton}
              containerColor="#111"
              iconColor="#fff"
              size={27}
            />
          </Tooltip>
        </View>
      ) : (
        <Searchbar
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          placeholder="Search notes"
          placeholderTextColor={'#777'}
          value={searchQuery}
          inputStyle={{ color: '#ccc'}}
          iconColor='#fff'
        />
      )}

      {filteredNotes.length === 0 ? (
        <Text style={styles.noNotesText}>No notes found</Text>
      ) : (
        !loading ?
          <ScrollView
            contentContainerStyle={styles.notesContainer}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={fetchNotes} />
            }
          >
            <View style={styles.column}>
              {leftColumn.map((note: Note) => renderNote(note))}
            </View>
            <View style={styles.column}>
              {rightColumn.map((note: Note) => renderNote(note))}
            </View>
          </ScrollView>
          :
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 25 }} />
      )}
      {!isSelectionMode && (
        <IconButton
          icon="plus"
          mode="contained"
          onPress={() => 
            router.push('/note/new')
            // onToggleSnackBar()
          }
          style={styles.btn}
          containerColor="#ededed"
          iconColor="#000"
          size={30}
        />
      )}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={toggleDialogSwitch} style={{borderColor:'#ccc',borderWidth:0.4, backgroundColor: '#222'}}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title style={{ fontSize: 18 }}>Do you want to delete this note permanently?</Dialog.Title>
          <Dialog.Actions>
            <Button onPress={toggleDialogSwitch}>Cancel</Button>
            <Button onPress={handleDeleteNotePermanently}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 5, backgroundColor: '#000' },
  searchInput: {
    backgroundColor: '#000',
    borderColor: '#fff',
    borderBottomWidth: 0.4,
    borderRadius: 50,
    marginBottom: 20,
    marginTop: 8,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  notesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    paddingHorizontal: 4,
  },
  noteContainer: {
    padding: 10,
    marginVertical: 5,
    borderColor: '#777',
    borderWidth: 0.4,
    borderRadius: 10,
    width: NoteWidth,
    maxHeight: 250,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  noteTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 5, userSelect: 'none' },
  editor: { marginVertical: 2, maxHeight: RICH_EDITOR_MAX_HEIGHT, overflow: 'hidden', userSelect: 'none' },
  noNotesText: { textAlign: 'center', fontSize: 18, color: '#aaa', marginTop: 20 },
  noContentText: { fontSize: 14, color: '#ccc', marginTop: 10, textAlign: 'center' },
  btn: { height: 80, width: 80, borderRadius: 50, position: 'absolute', bottom: 25, right: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#111',
    marginBottom: 11,
    borderRadius: 50
  },
  headerButton: {
    margin: 5,

  },
  exitSelectionButton: {
    margin: 5,
  },
  checkbox: {
    fontSize: 24,
    marginRight: 10,
  },
  selectedNote: {
    borderColor: "#fff",
    borderWidth: 1
  },
  NotesSkeleton: {
    width: '90%',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  skeleton: {
    backgroundColor: '#fff',
    width: NoteWidth,
    height: 100,
  }
});
