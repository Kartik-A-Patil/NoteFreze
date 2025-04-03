import Ionicons from '@expo/vector-icons/Ionicons';
import { PropsWithChildren, useState, memo, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, useColorScheme, Animated, TextStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';

interface CollapsibleProps extends PropsWithChildren {
  title: string;
  titleStyle?: TextStyle;
}

export const Collapsible = memo(({ children, title, titleStyle }: CollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';
  
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        style={styles.heading}
        onPress={toggleOpen}
        activeOpacity={0.7}>
        <Ionicons
          name={isOpen ? 'chevron-down' : 'chevron-forward-outline'}
          size={18}
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
        />
        <ThemedText type="defaultSemiBold" style={titleStyle}>{title}</ThemedText>
      </TouchableOpacity>
      
      {isOpen && (
        <Animated.View 
          style={[styles.content]}
        >
          {children}
        </Animated.View>
      )}
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 30, 30, 0.5)',
    padding: 8,
    width: '100%',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});
