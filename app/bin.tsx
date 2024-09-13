import React, { useState, useEffect, useRef, useCallback,useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { loadBinNotes, restoreMultipleFromBin, deleteMultipleNotes, restoreAllFromBin, deleteAllInBin } from '@/utils/db'; // Make sure this path is correct
import { RichEditor } from 'react-native-pell-rich-editor';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation } from 'expo-router';
import Context from '@/context/createContext';
const { width: screenWidth } = Dimensions.get('window');
const NoteWidth = screenWidth / 2 - 20;
const RICH_EDITOR_MAX_HEIGHT = 200;

export default function Bin() {
  const context = useContext(Context);
  const {fetchNotes} = context;
  const [deletedNotes, setDeletedNotes] = useState<any[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const richText = useRef<RichEditor>(null);
  const navigation = useNavigation();

  const renderHeaderRight = useCallback(() => (
    selectedNotes.size > 0 ? (
      <View style={styles.header}>
        <TouchableOpacity onPress={handleRestore} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
        
      </View>
    ) : (
      <View style={styles.header}>
        <TouchableOpacity onPress={restoreAllFromBin} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={deleteAllInBin} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Empty Bin</Text>
        </TouchableOpacity>

      </View>
    )
  ), [selectedNotes]);

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
      setDeletedNotes(fetchedNotes);
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
    setSelectedNotes(prevSelected => {
      const newSelected = new Set(prevSelected);
      newSelected.add(id);
      return newSelected;
    });
  }, []);

  const handleRestore = async () => {
    if (selectedNotes.size === 0) return;
    setIsLoading(true);
    try {
      const ids = Array.from(selectedNotes);
      await restoreMultipleFromBin(ids);
      setDeletedNotes(prevNotes => prevNotes.filter(note => !selectedNotes.has(note.id)));
      setSelectedNotes(new Set());
      loadDeletedNotes()
      fetchNotes()
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
      await deleteMultipleNotes(ids);
      setDeletedNotes(prevNotes => prevNotes.filter(note => !selectedNotes.has(note.id)));
      setSelectedNotes(new Set());
      loadDeletedNotes()
      fetchNotes()
    } catch (error) {
      console.error('Error deleting notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderNote = ({ item }: { item: any }) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.noteContainer,
        selectedNotes.has(item.id) && styles.selectedNote
      ]}
      onPress={() => handleSelectNote(item.id)}
      onLongPress={() => handleLongPress(item.id)}
    >
      {item.title && (
        <ThemedText style={styles.noteTitle}>{item.title}</ThemedText>
      )}
      <RichEditor
        ref={richText}
        style={styles.editor}
        initialContentHTML={item.content}
        editorStyle={{ backgroundColor: '#000', color: '#ccc' }}
        disabled={true}
        forceDarkOn
      />
    </TouchableOpacity>
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
            onRefresh={loadBinNotes}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 5, backgroundColor: '#000' },
  title: {
    fontSize: 30,
    fontFamily: 'ndot',
    paddingTop: 20,
    marginBottom: 30,
    marginLeft: 40,
    color:'#fff'
  },
  columnsContainer: { justifyContent: 'space-between', marginHorizontal: 10 },
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
  noteTitle: { fontSize: 18, color: '#fff' },
  editor: { marginVertical: 2, maxHeight: RICH_EDITOR_MAX_HEIGHT, minHeight: 100, overflow: 'hidden' },
  noNotesText: { textAlign: 'center', fontSize: 18, color: '#aaa', marginTop: 20 },
  selectedNote: { borderWidth: 1, borderColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',

  },
  actionButton: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  actionButtonText: { color: '#fff',fontFamily:'RobotoMono' },
});
