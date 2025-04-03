import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  searchQuery?: string;
}

const EmptyState = ({ searchQuery }: EmptyStateProps) => {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={70} color="#444" />
      <Text style={styles.noNotesText}>No notes found</Text>
      <Text style={styles.noNotesSubText}>
        {searchQuery ? "Try a different search term" : "Create your first note with the + button"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  noNotesText: {
    fontSize: 18,
    color: '#aaa',
    marginTop: 16,
    fontFamily: 'RobotoMono',
  },
  noNotesSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontFamily: 'PTMono',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});

export default EmptyState;
