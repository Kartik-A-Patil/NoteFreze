import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import Tag from './Tag';

interface TagCirclesProps {
  tags: Array<{name: string, color: string}>;
  maxDisplay?: number;
}

const TagCircles = ({ tags, maxDisplay = 3 }: TagCirclesProps) => {
  const [showPopup, setShowPopup] = useState(false);
  
  if (!tags || tags.length === 0) return null;
  
  // Take only up to maxDisplay tags for showing circles
  const displayTags = tags.slice(0, maxDisplay);
  const hasMoreTags = tags.length > maxDisplay;
  
  return (
    <>
      <TouchableOpacity 
        style={styles.container}
        onPress={() => setShowPopup(true)}
      >
        {displayTags.map((tag, index) => (
          <View
            key={index}
            style={[
              styles.circle,
              { backgroundColor: tag.color, marginLeft: index > 0 ? -8 : 0 }
            ]}
          />
        ))}
        
        {hasMoreTags && (
          <View style={styles.moreIndicator}>
            <ThemedText style={styles.moreText}>+{tags.length - maxDisplay}</ThemedText>
          </View>
        )}
      </TouchableOpacity>
      
      <Modal
        transparent
        visible={showPopup}
        animationType="fade"
        onRequestClose={() => setShowPopup(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPopup(false)}
        >
          <View style={styles.popup}>
            <ThemedText style={styles.popupTitle}>Tags</ThemedText>
            <View style={styles.tagContainer}>
              {tags.map((tag, index) => (
                <Tag
                  key={index}
                  text={tag.name}
                  color={tag.color}
                />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  moreIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  moreText: {
    fontSize: 10,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#333',
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#fff',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default TagCircles;
