import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { IconButton, Tooltip } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

interface SelectionHeaderProps {
  count: number;
  onDelete: () => void;
  onPermanentDelete: () => void;
  onCancel: () => void;
  style?: any;
}

const SelectionHeader = ({ 
  count, 
  onDelete, 
  onPermanentDelete, 
  onCancel, 
  style 
}: SelectionHeaderProps) => {
  return (
    <Animated.View style={[styles.selectionHeader, style]}>
      <View style={styles.selectionCountContainer}>
        <ThemedText style={styles.selectionCount}>
          {count} selected
        </ThemedText>
      </View>
      
      <View style={styles.selectionActions}>
        <Tooltip title="Move to Bin">
          <IconButton
            icon={props => <Ionicons name="trash-outline" {...props} />}
            mode="contained"
            onPress={onDelete}
            containerColor="#222"
            iconColor="#fff"
            size={22}
          />
        </Tooltip>
        
        <Tooltip title="Delete Permanently">
          <IconButton
            icon={props => <Ionicons name="trash" {...props} />}
            mode="contained"
            onPress={onPermanentDelete}
            containerColor="#222"
            iconColor="#f44336"
            size={22}
          />
        </Tooltip>
        
        <Tooltip title="Cancel">
          <IconButton
            icon={props => <Ionicons name="close" {...props} />}
            mode="contained"
            onPress={onCancel}
            containerColor="#222"
            iconColor="#fff"
            size={22}
          />
        </Tooltip>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.95)',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  selectionCountContainer: {
    flex: 1,
  },
  selectionCount: {
    fontFamily: 'RobotoMono',
    fontSize: 16,
    color: '#fff',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

export default SelectionHeader;
