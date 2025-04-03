import React, { useRef } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { RichEditor } from "react-native-pell-rich-editor";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import TagCircles from "@/components/tags/TagCircles";

interface Note {
  id: number;
  title: string;
  content: string;
  isInBin: number;
  reminder?: number | null;
  isLocked?: number;
  tags?: Array<{ name: string; color: string }>; // Update tags type
}

interface NoteItemProps {
  item: Note;
  isSelected: boolean;
  isSelectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const NoteItem = ({
  item,
  isSelected,
  isSelectionMode,
  onPress,
  onLongPress
}: NoteItemProps) => {
  const richText = useRef<RichEditor>(null);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.noteCard,
        item.isLocked === 1 && styles.lockedNoteCard,
        pressed && !isSelectionMode && styles.notePressed
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
    >
      {/* Selection indicator */}
      {isSelectionMode && (
        <View style={styles.selectionIndicator}>
          <View
            style={[styles.checkbox, isSelected && styles.checkboxSelected]}
          >
            {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
          </View>
        </View>
      )}

      {/* Tag circles in top-right corner */}
      {!isSelectionMode && item.tags && item.tags.length > 0 && (
        <TagCircles tags={item.tags} maxDisplay={3} />
      )}
    

      <View style={styles.noteContent}>
        {/* Note title and lock indicator */}
        <View style={styles.noteTitleContainer}>
          {item.title && item.isLocked !== 1 ? (
            <ThemedText
              style={styles.noteTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.title}
            </ThemedText>
          ) : null}
        </View>

        {/* Note preview */}
        {item.isLocked === 1 ? (
          <View style={styles.lockedNoteContent}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: "60%" }]} />
            <View style={[styles.skeletonLine, { width: "75%" }]} />
            <View style={[styles.skeletonLine, { width: "45%" }]} />
            <Ionicons
              name="lock-closed"
              size={50}
              color="#333"
              style={styles.lockedNoteIcon}
            />
          </View>
        ) : item.content ? (
          <View style={styles.contentPreview}>
            <RichEditor
              ref={richText}
              style={{ height: "100%" }}
              initialContentHTML={item.content}
              editorStyle={{
                backgroundColor: "transparent",
                color: "#ccc"
              }}
              disabled={true}
              forceDarkOn={true}
            />
          </View>
        ) : null}

        {/* If note has a reminder, show enhanced indicator */}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  noteCard: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111",
    borderColor: "#222",
    borderWidth: 1,
    position: "relative"
  },
  noteContent: {
    padding: 14
  },
  lockedNoteCard: {
    backgroundColor: "#0c0c0c",
    borderColor: "#222"
  },
  notePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }]
  },
  noteTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  noteTitle: {
    fontSize: 16,
    fontFamily: "RobotoMono",
    color: "#fff",
    flex: 1
  },
  contentPreview: {
    minHeight: 60,
    maxHeight: 120,
    overflow: "hidden"
  },
  editor: {
    height: "100%",
    backgroundColor: "transparent"
  },
  lockedNoteContent: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginVertical: 5,
    height: 130
  },
  skeletonLine: {
    height: 8,
    width: "90%",
    backgroundColor: "#1a1a1a",
    marginVertical: 6,
    borderRadius: 4
  },
  lockedNoteIcon: {
    position: "absolute",
    opacity: 0.2
  },
  reminderIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "#222",
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    borderRadius: 4
  },
  reminderText: {
    fontSize: 12,
    color: "#FFC107",
    marginLeft: 4,
    fontFamily: "PTMono"
  },
  selectionIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent"
  },
  checkboxSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF"
  },
  // Updated style for locked note tag circles
  lockedTagCircles: {
    position: "absolute",
    bottom: 5,
    right: 5,
    zIndex: 10 // Ensure tag circles appear on top
  }
});

export default NoteItem;
