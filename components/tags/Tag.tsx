import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TagProps {
  text: string;
  onPress?: () => void;
  onRemove?: () => void;
  selected?: boolean;
  removable?: boolean;
  color?: string;
}

const Tag = ({ 
  text, 
  onPress, 
  onRemove, 
  selected = false, 
  removable = false,
  color = '#222' 
}: TagProps) => {
  // Truncate tag text if longer than 15 characters
  const displayText = text.length > 15 ? `${text.substring(0, 12)}...` : text;
  
  return (
    <TouchableOpacity
      style={[
        styles.tag,
        selected && styles.selectedTag,
        { backgroundColor: color }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[
        styles.tagText, 
        selected && styles.selectedTagText,
        // Use white text for dark colors, black text for light colors
        { color: isLightColor(color) ? '#000' : '#fff' }
      ]}>
        {displayText}
      </Text>
      
      {removable && onRemove && (
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={onRemove}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons 
            name="close-circle" 
            size={16} 
            color={isLightColor(color) ? '#333' : '#eee'} 
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// Helper to determine if we should use dark text on this background color
const isLightColor = (color: string): boolean => {
  // Default to assuming dark colors if not a hex color
  if (!color.startsWith('#')) return false;
  
  // Extract RGB components
  const hex = color.replace('#', '');
  let r, g, b;
  
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  
  // Determine brightness (YIQ formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
};

const styles = StyleSheet.create({
  tag: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTag: {
    borderColor: '#fff',
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'PTMono',
  },
  selectedTagText: {
    fontWeight: '500',
  },
  removeButton: {
    marginLeft: 4,
  },
});

export default Tag;
