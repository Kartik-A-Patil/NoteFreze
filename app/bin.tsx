import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert, Dimensions, BackHandler } from 'react-native';
import { loadBinNotes, restoreMultipleFromBin, deleteMultipleNotes, restoreAllFromBin, deleteAllInBin, getNoteTagsById } from '@/utils/db';
import { useNavigation, useRouter } from 'expo-router';
import Context from '@/context/createContext';
import { cancelPushNotification } from '@/components/Notification';
import { ThemedText } from '@/components/ThemedText';
import BinNoteItem from '@/components/bin/BinNoteItem';
import BinHeader from '@/components/bin/BinHeader';

const { width: screenWidth } = Dimensions.get('window');
const NoteWidth = screenWidth / 2 - 20;

interface Note {
  id: number;
  title: string;
  content: string;
  isInBin: number;
  reminder?: number | null;
  isLocked?: number;
  tags?: Array<{name: string, color: string}>; // Update tags type 
}

export default function Bin() {
  const context = useContext(Context);
  const { fetchNotes } = context;
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const router = useRouter();

  const renderHeaderRight = useCallback(() => (
    <BinHeader
      selectedCount={selectedNotes.size}
      onRestore={handleRestore}
      onDelete={handleDelete}
      onRestoreAll={handleRestoreAll}
      onEmptyBin={emptyBin}
    />
  ), [selectedNotes.size]);

  useEffect(() => {
    navigation.setOptions({ headerRight: renderHeaderRight });
  }, [renderHeaderRight]);

  // Load deleted notes when the component mounts
  useEffect(() => {
    loadDeletedNotes();
  }, []);

  const loadDeletedNotes = async () => {
    setIsLoading(true);
    try {
      const fetchedNotes = await loadBinNotes();
      
      // Load tags for each note
      const notesWithTags = await Promise.all(
        fetchedNotes.map(async (note) => {
          const tags = await getNoteTagsById(note.id);
          return {...note, tags};
        })
      );
      
      setDeletedNotes(notesWithTags);
    } catch (error) {
      console.error('Error loading deleted notes:', error);
      Alert.alert('Error', 'Could not fetch deleted notes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectNote = (id: number) => {
    setSelectedNotes(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const handleLongPress = useCallback((id: number) => {
    setSelectedNotes(prevSelected => new Set(prevSelected).add(id));
  }, []);

  const handleRestore = async () => {
    if (selectedNotes.size === 0) return;
    setIsLoading(true);
    try {
      const ids = Array.from(selectedNotes);
      await restoreMultipleFromBin(ids);
      setDeletedNotes(prevNotes => prevNotes.filter(note => !selectedNotes.has(note.id)));
      setSelectedNotes(new Set());
      await loadDeletedNotes(); // Reload bin notes
      // Just fetch notes once instead of for each note
      await fetchNotes(); // Refresh home screen notes
    } catch (error) {
      console.error('Error restoring notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedNotes.size === 0) return;
    setIsLoading(true);
    try {
      const ids = Array.from(selectedNotes);
      const notificationIds = await deleteMultipleNotes(ids);
      
      // Cancel any associated notifications
      if (Array.isArray(notificationIds)) {
        for (const notificationId of notificationIds) {
          await cancelPushNotification(notificationId);
        }
      }
      
      setDeletedNotes(prevNotes => prevNotes.filter(note => !selectedNotes.has(note.id)));
      setSelectedNotes(new Set());
      // No need to refresh home screen since these notes are already in bin
    } catch (error) {
      console.error('Error deleting notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreAll = async () => {
    setIsLoading(true);
    try {
      await restoreAllFromBin();
      await loadDeletedNotes();
      await fetchNotes();
    } catch (error) {
      console.error('Error restoring all notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const emptyBin = async () => {
    setIsLoading(true);
    try {
      await deleteAllInBin();
      await loadDeletedNotes();
    } catch (error) {
      console.error('Error emptying bin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add back button handler
  useEffect(() => {
    const handleBackPress = () => {
      router.navigate('/');
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [router]);

  const renderNote = ({ item }: { item: Note }) => (
    <BinNoteItem
      item={item}
      isSelected={selectedNotes.has(item.id)}
      onPress={() => handleSelectNote(item.id)}
      onLongPress={() => handleLongPress(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Bin</ThemedText>
      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        deletedNotes.length === 0 ? (
          <ThemedText style={styles.noNotesText}>No notes in the bin</ThemedText>
        ) : (
          <FlatList
            data={deletedNotes}
            renderItem={renderNote}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.columnsContainer}
            refreshing={isLoading}
            onRefresh={loadDeletedNotes}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 5, 
    backgroundColor: '#000' 
  },
  title: {
    fontSize: 30,
    fontFamily: 'ndot',
    paddingTop: 20,
    marginBottom: 30,
    marginLeft: 40,
    color:'#fff'
  },
  columnsContainer: { 
    justifyContent: 'space-between', 
    marginHorizontal: 10 
  },
  noNotesText: { 
    textAlign: 'center', 
    fontSize: 18, 
    color: '#aaa', 
    marginTop: 20 
  },
});
