import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

interface TagBadgeProps {
  tags?: { name: string; color: string; }[] | string[];
  maxDisplay?: number;
  compact?: boolean;
}

const TagBadges: React.FC<TagBadgeProps> = ({ 
  tags = [], 
  maxDisplay = 3, 
  compact = false
}) => {
  const theme = useTheme();
  
  if (!tags || tags.length === 0) return null;
  
  const displayTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - maxDisplay;

  return (
    <View style={styles.container}>
      {displayTags.map((tag, index) => {
        const tagName = typeof tag === 'string' ? tag : tag.name;
        const tagColor = typeof tag === 'string' ? theme.colors.primary : tag.color;
        
        return (
          <View 
            key={index} 
            style={[
              styles.badge, 
              { backgroundColor: tagColor + '20' },
              compact && styles.compactBadge
            ]}
          >
            <Text 
              style={[
                styles.text, 
                { color: tagColor },
                compact && styles.compactText
              ]}
              numberOfLines={1}
            >
              {tagName}
            </Text>
          </View>
        );
      })}
      
      {remainingCount > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.colors.backdrop }]}>
          <Text style={styles.text}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 4,
  },
  compactBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  compactText: {
    fontSize: 10,
  }
});

export default TagBadges;
