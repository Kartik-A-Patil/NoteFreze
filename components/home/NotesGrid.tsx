import React from 'react';
import { View, StyleSheet } from 'react-native';
import NoteItem from './NoteItem';

interface Note {
  id: number;
  title: string;
  content: string;
  isInBin: number;
  reminder?: number | null;
  isLocked?: number;
  tags?: string[]; // Add tags to interface
}

interface NotesGridProps {
  notes: Note[];
  selectedNotes: Set<number>;
  isSelectionMode: boolean;
  onNotePress: (note: Note) => void;
  onNoteLongPress: (id: number) => void;
}

const NotesGrid = ({ 
  notes, 
  selectedNotes, 
  isSelectionMode, 
  onNotePress, 
  onNoteLongPress 
}: NotesGridProps) => {
  // Split notes into left and right columns for masonry layout
  const leftColumn: Note[] = [];
  const rightColumn: Note[] = [];
  
  notes.forEach((note, index) => {
    if (index % 2 === 0) {
      leftColumn.push(note);
    } else {
      rightColumn.push(note);
    }
  });

  return (
    <View style={[styles.notesGrid ,isSelectionMode && { paddingTop: 40}]}>
      <View style={styles.notesColumn}>
        {leftColumn.map(note => (
          <NoteItem 
            key={note.id}
            item={note} 
            isSelected={selectedNotes.has(note.id)}
            isSelectionMode={isSelectionMode}
            onPress={() => onNotePress(note)}
            onLongPress={() => onNoteLongPress(note.id)}
          />
        ))}
      </View>
      <View style={styles.notesColumn}>
        {rightColumn.map(note => (
          <NoteItem 
            key={note.id}
            item={note} 
            isSelected={selectedNotes.has(note.id)}
            isSelectionMode={isSelectionMode}
            onPress={() => onNotePress(note)}
            onLongPress={() => onNoteLongPress(note.id)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  notesGrid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  notesColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
});

export default NotesGrid;
