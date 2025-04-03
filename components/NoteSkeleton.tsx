import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay } from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');
const NoteWidth = screenWidth / 2 - 15;

interface NoteSkeletonProps {
  count?: number;
}

const NoteSkeleton: React.FC<NoteSkeletonProps> = ({ count = 6 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.column}>
        {Array.from({ length: Math.ceil(count/2) }).map((_, i) => (
          <SkeletonNote key={`left-${i}`} delay={i * 150} />
        ))}
      </View>
      <View style={styles.column}>
        {Array.from({ length: Math.floor(count/2) }).map((_, i) => (
          <SkeletonNote key={`right-${i}`} delay={i * 150 + 75} />
        ))}
      </View>
    </View>
  );
};

const SkeletonNote = ({ delay }: { delay: number }) => {
  const opacity = useSharedValue(0.3);
  
  React.useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.6, { duration: 1000 }),
        -1,
        true
      )
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  
  return (
    <Animated.View style={[styles.noteContainer, animatedStyle]}>
      <View style={styles.titleBar} />
      <View style={[styles.line, { width: '100%' }]} />
      <View style={[styles.line, { width: '85%' }]} />
      <View style={[styles.line, { width: '70%' }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 5,
  },
  column: {
    flex: 1,
    paddingHorizontal: 4,
  },
  noteContainer: {
    padding: 15,
    marginVertical: 5,
    borderColor: '#222',
    borderWidth: 0.4,
    borderRadius: 10,
    width: NoteWidth,
    height: 180,
    backgroundColor: '#111',
  },
  titleBar: {
    height: 20,
    width: '80%',
    backgroundColor: '#222',
    borderRadius: 4,
    marginBottom: 15,
  },
  line: {
    height: 12,
    backgroundColor: '#222',
    borderRadius: 4,
    marginVertical: 10,
  }
});

export default NoteSkeleton;
