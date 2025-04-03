import React from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Tag from './Tag';

interface TagListProps {
  tags: Array<{name: string, color: string}>;
  selectedTags: string[];
  onTagPress: (tag: string) => void;
}

const TagList = ({ tags, selectedTags, onTagPress }: TagListProps) => {
  if (tags.length === 0) return null;
  
  // Function to clear all selected tags
  const handleAllTagsPress = () => {
    selectedTags.forEach(tag => onTagPress(tag));
  };
  
  const isAllSelected = selectedTags.length === 0;
  const isReminderSelected = selectedTags.includes('__reminders__');
  
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All Tags button */}
        <TouchableOpacity
          style={[
            styles.allTagsButton,
            isAllSelected && styles.allTagsButtonActive
          ]}
          onPress={handleAllTagsPress}
        >
          <Ionicons 
            name="pricetags-outline" 
            size={14} 
            color={isAllSelected ? "#fff" : "#aaa"} 
          />
          <Text style={[
            styles.allTagsText,
            isAllSelected && styles.allTagsTextActive
          ]}>
            All Tags
          </Text>
        </TouchableOpacity>
        
        {/* Reminders filter */}
        <TouchableOpacity 
          style={[
            styles.reminderButton,
            isReminderSelected && styles.reminderButtonActive
          ]}
          onPress={() => onTagPress('__reminders__')}
        >
          <Ionicons
            name="alarm-outline"
            size={14}
            color={isReminderSelected ? "#FFC107" : "#aaa"} 
          />
          <Text style={[
            styles.reminderText,
            isReminderSelected && styles.reminderTextActive
          ]}>
            Reminders
          </Text>
        </TouchableOpacity>
        
        {/* Regular tags */}
        {tags.map((tag, index) => (
          <Tag
            key={index}
            text={tag.name}
            color={tag.color}
            selected={selectedTags.includes(tag.name)}
            onPress={() => onTagPress(tag.name)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  allTagsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  allTagsButtonActive: {
    backgroundColor: '#444',
    borderColor: '#666',
    borderWidth: 1,
    paddingHorizontal: 11,
  },
  allTagsText: {
    color: '#aaa',
    fontSize: 12,
    fontFamily: 'PTMono',
    marginLeft: 4,
  },
  allTagsTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  reminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  reminderButtonActive: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderColor: '#FFC107',
    borderWidth: 1,
    paddingHorizontal: 11,
  },
  reminderText: {
    color: '#aaa',
    fontSize: 12,
    fontFamily: 'PTMono',
    marginLeft: 4,
  },
  reminderTextActive: {
    color: '#FFC107',
    fontWeight: '500',
  }
});

export default TagList;
