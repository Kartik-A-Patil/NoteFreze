import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Tag from './Tag';
import ColorPicker from './ColorPicker';

interface TagInputProps {
  tags: Array<{name: string, color: string}>;
  onAddTag: (tag: string, color: string) => void;
  onRemoveTag: (tag: string) => void;
  placeholder?: string;
}

const TagInput = ({ tags, onAddTag, onRemoveTag, placeholder = "Add tag..." }: TagInputProps) => {
  const [tagText, setTagText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#3498db'); // Default blue
  const [inputHeight] = useState(new Animated.Value(0));

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(inputHeight, {
      toValue: isExpanded ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleAddTag = () => {
    if (tagText.trim() !== '') {
      onAddTag(tagText.trim(), selectedColor);
      setTagText('');
    }
  };

  const maxHeight = inputHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tagsHeader}>Tags</Text>
        <TouchableOpacity onPress={toggleExpand} style={styles.addButton}>
          <Ionicons 
            name={isExpanded ? "chevron-up-outline" : "add-outline"} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.inputWrapper, { maxHeight }]}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={tagText}
            onChangeText={setTagText}
            placeholder={placeholder}
            placeholderTextColor="#777"
            returnKeyType="done"
            onSubmitEditing={handleAddTag}
            blurOnSubmit={false}
          />
          <TouchableOpacity onPress={handleAddTag} style={styles.addTagButton}>
            <Ionicons name="add-circle-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ColorPicker 
          selectedColor={selectedColor} 
          onSelectColor={setSelectedColor} 
        />
      </Animated.View>
      
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <Tag
              key={index}
              text={tag.name}
              color={tag.color}
              removable
              onRemove={() => onRemoveTag(tag.name)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tagsHeader: {
    fontSize: 15,
    fontFamily: 'RobotoMono',
    color: '#999',
  },
  addButton: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#222',
  },
  inputWrapper: {
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  input: {
    flex: 1,
    color: '#fff',
    height: 40,
    fontFamily: 'PTMono',
  },
  addTagButton: {
    padding: 5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
});

export default TagInput;
