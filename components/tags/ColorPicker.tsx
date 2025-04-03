import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

const ColorPicker = ({ selectedColor, onSelectColor }: ColorPickerProps) => {
  // Predefined colors that look good in dark mode
  const colors = [
    '#444444', // Dark gray
    '#3498db', // Blue
    '#2ecc71', // Green
    '#e74c3c', // Red
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#1abc9c', // Teal
    '#e91e63', // Pink
    '#ffeb3b', // Yellow
    '#00bcd4', // Cyan
    '#8bc34a', // Light Green
    '#ff5722', // Deep Orange
    '#795548', // Brown
    '#607d8b', // Blue Gray
  ];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {colors.map((color, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.colorOption,
            { backgroundColor: color },
            selectedColor === color && styles.selectedColorOption
          ]}
          onPress={() => onSelectColor(color)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default ColorPicker;
