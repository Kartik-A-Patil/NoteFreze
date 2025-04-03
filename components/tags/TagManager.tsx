import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getAllTags, deleteTag } from '@/utils/db';
import Tag from './Tag';
import TagInput from './TagInput';

interface TagManagerProps {
  onTagsUpdated?: () => void;
}

const TagManager = ({ onTagsUpdated }: TagManagerProps) => {
  const [tags, setTags] = useState<Array<{name: string, color: string}>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    try {
      const fetchedTags = await getAllTags();
      setTags(fetchedTags);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (tagName: string, color: string) => {
    if (!tags.some(tag => tag.name === tagName)) {
      const newTags = [...tags, { name: tagName, color }];
      setTags(newTags);
      if (onTagsUpdated) onTagsUpdated();
    }
  };

  const handleRemoveTag = async (tagNameToRemove: string) => {
    try {
      await deleteTag(tagNameToRemove);
      setTags(tags.filter(tag => tag.name !== tagNameToRemove));
      if (onTagsUpdated) onTagsUpdated();
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Tags</Text>
      
      <TagInput 
        tags={tags} 
        onAddTag={handleAddTag} 
        onRemoveTag={(name) => handleRemoveTag(name)}
        placeholder="Add a new tag" 
      />
      
      {tags.length === 0 ? (
        <Text style={styles.emptyText}>No tags yet. Add one above.</Text>
      ) : (
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <Tag 
              key={index} 
              text={tag.name} 
              color={tag.color}
              removable 
              onRemove={() => handleRemoveTag(tag.name)} 
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'RobotoMono',
    color: '#fff',
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  emptyText: {
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'PTMono',
  },
});

export default TagManager;
