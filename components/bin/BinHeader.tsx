import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface BinHeaderProps {
  selectedCount: number;
  onRestore: () => void;
  onDelete: () => void;
  onRestoreAll?: () => void;
  onEmptyBin?: () => void;
}

const BinHeader = ({ 
  selectedCount, 
  onRestore, 
  onDelete, 
  onRestoreAll, 
  onEmptyBin 
}: BinHeaderProps) => {
  return (
    <View style={styles.header}>
      {selectedCount > 0 ? (
        <>
          <TouchableOpacity onPress={onRestore} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Restore</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity onPress={onRestoreAll} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Restore All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onEmptyBin} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Empty Bin</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  actionButtonText: { 
    color: '#fff',
    fontFamily:'RobotoMono' 
  },
});

export default BinHeader;
