import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { RichEditor } from 'react-native-pell-rich-editor';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import TagBadges from '@/components/tags/TagBadges';

interface Note {
  id: number;
  title: string;
  content: string;
  isInBin: number;
  reminder?: number | null;
  isLocked?: number;
  tags?: Array<{name: string, color: string}>; // Update tags type
}

interface BinNoteItemProps {
  item: Note;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const BinNoteItem = ({ item, isSelected, onPress, onLongPress }: BinNoteItemProps) => {
  const richText = useRef<RichEditor>(null);

  return (
    <TouchableOpacity
      style={[
        styles.noteContainer,
        isSelected && styles.selectedNote,
        item.isLocked === 1 && styles.lockedNoteContainer
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.noteTitleContainer}>
        {item.title && (
          <ThemedText style={styles.noteTitle}>
            {item.isLocked === 1 ? 'Locked Note' : item.title}
          </ThemedText>
        )}
        {item.isLocked === 1 && (
          <Ionicons name="lock-closed" size={18} color="#fff" />
        )}
      </View>
      
      {item.isLocked === 1 ? (
        <View style={styles.lockedNoteContent}>
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, { width: '60%' }]} />
          <View style={[styles.skeletonLine, { width: '75%' }]} />
          <Ionicons 
            name="lock-closed" 
            size={36} 
            color="#333" 
            style={styles.lockedNoteIcon} 
          />
        </View>
      ) : (
        <RichEditor
          ref={richText}
          style={styles.editor}
          initialContentHTML={item.content}
          editorStyle={{ backgroundColor: '#000', color: '#ccc' }}
          disabled={true}
          forceDarkOn
        />
      )}
      
      {/* Only show tags if the note is not locked */}
      {item.isLocked !== 1 && item.tags && item.tags.length > 0 && (
        <TagBadges tags={item.tags} small={true} maxDisplay={2} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  noteContainer: {
    padding: 10,
    marginVertical: 5,
    borderColor: '#777',
    borderWidth: 0.4,
    borderRadius: 10,
    maxHeight: 250,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  noteTitle: { 
    fontSize: 18, 
    color: '#fff' 
  },
  editor: { 
    marginVertical: 2, 
    maxHeight: 200, 
    minHeight: 100, 
    overflow: 'hidden' 
  },
  selectedNote: { 
    borderWidth: 1, 
    borderColor: '#fff' 
  },
  noteTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  lockedNoteContainer: {
    backgroundColor: '#111',
  },
  lockedNoteContent: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: 15,
  },
  skeletonLine: {
    height: 10,
    width: '90%',
    backgroundColor: '#222',
    marginVertical: 8,
    borderRadius: 4,
  },
  lockedNoteIcon: {
    position: 'absolute',
    opacity: 0.3,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleWithIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderIcon: {
    marginLeft: 8,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 12,
    color: '#FFC107',
    marginLeft: 4,
    fontFamily: 'PTMono',
  },
});

export default BinNoteItem;
