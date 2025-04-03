import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  StyleSheet,
  Text,
  TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import * as TagRepository from "@/utils/tagRepository";

interface TagSelectorProps {
  selectedTagIds: number[];
  onTagsSelected: (tagIds: number[]) => void;
}

export default function TagSelector({
  selectedTagIds,
  onTagsSelected
}: TagSelectorProps) {
  const [tags, setTags] = useState<TagRepository.Tag[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<number>>(
    new Set(selectedTagIds)
  );
  const [selectedTagsData, setSelectedTagsData] = useState<TagRepository.Tag[]>(
    []
  );

  // New tag creation state
  const [createTagModalVisible, setCreateTagModalVisible] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#2196F3");

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    setSelectedTags(new Set(selectedTagIds));
    loadSelectedTagsData();
  }, [selectedTagIds]);

  const loadTags = async () => {
    try {
      const allTags = await TagRepository.getAllTags();
      setTags(allTags);
      loadSelectedTagsData();
    } catch (error) {
      console.error("Error loading tags", error);
    }
  };

  const loadSelectedTagsData = async () => {
    if (!selectedTagIds.length) {
      setSelectedTagsData([]);
      return;
    }

    try {
      const tagData = await Promise.all(
        selectedTagIds.map((id) => TagRepository.getTagById(id))
      );
      setSelectedTagsData(
        tagData.filter((tag) => tag !== null) as TagRepository.Tag[]
      );
    } catch (error) {
      console.error("Error loading selected tag data", error);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const handleDone = () => {
    const selectedTagsArray = Array.from(selectedTags);
    onTagsSelected(selectedTagsArray);
    setModalVisible(false);
  };

  // Handle creating a new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      return;
    }

    try {
      const newTagId = await TagRepository.addTag(
        newTagName.trim(),
        newTagColor
      );
      await loadTags();

      // Select the newly created tag
      setSelectedTags((prev) => {
        const newSet = new Set(prev);
        newSet.add(newTagId);
        return newSet;
      });

      // Reset form and close modal
      setNewTagName("");
      setNewTagColor("#2196F3");
      setCreateTagModalVisible(false);
    } catch (error) {
      console.error("Error creating new tag:", error);
    }
  };

  const renderTag = ({ item }: { item: TagRepository.Tag }) => (
    <TouchableOpacity
      style={[
        styles.tagItem,
        selectedTags.has(item.id) && styles.selectedTagItem
      ]}
      onPress={() => toggleTag(item.id)}
    >
      <View style={[styles.tagColor, { backgroundColor: item.color }]} />
      <ThemedText style={styles.tagName}>{item.name}</ThemedText>
      {selectedTags.has(item.id) && (
        <Ionicons
          name="checkmark-circle"
          size={18}
          color="#2196F3"
          style={styles.checkmark}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.selectedTagsContainer}>
        {selectedTagsData.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedTagsData.map((tag) => (
              <View
                key={tag.id}
                style={[styles.tag, { backgroundColor: tag.color + "30" }]}
              >
                <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                <Text style={styles.tagText}>{tag.name}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <ThemedText style={styles.noTagsText}>No tags selected</ThemedText>
        )}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="pricetags-outline" size={20} color="#666" />
      </TouchableOpacity>

      {/* Tag Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Tags</ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#aaa" />
              </TouchableOpacity>
            </View>

            {/* Create New Tag Button */}
            <TouchableOpacity
              style={styles.createTagButton}
              onPress={() => {
                setCreateTagModalVisible(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color="#2196F3" />
              <Text style={styles.createTagText}>Create New Tag</Text>
            </TouchableOpacity>

            <FlatList
              data={tags}
              renderItem={renderTag}
              keyExtractor={(item) => item.id.toString()}
              style={styles.tagList}
              ListEmptyComponent={
                <ThemedText style={styles.emptyListText}>
                  No tags found. Create your first tag!
                </ThemedText>
              }
            />

            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <ThemedText style={styles.doneText}>Done</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create New Tag Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={createTagModalVisible}
        onRequestClose={() => setCreateTagModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.createTagModalContent]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Create New Tag</ThemedText>
              <TouchableOpacity onPress={() => setCreateTagModalVisible(false)}>
                <Ionicons name="close" size={24} color="#aaa" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.tagInput}
              placeholder="Tag name"
              placeholderTextColor="#666"
              value={newTagName}
              onChangeText={setNewTagName}
            />

            <View style={styles.colorSection}>
              <ThemedText style={styles.colorLabel}>Select Color:</ThemedText>
              <View style={styles.colorPicker}>
                {[
                  "#D32F2F", // Muted Red
                  "#C2185B", // Soft Magenta
                  "#AD1457", // Warm Pink
                  "#E64A19", // Rust Orange
                  "#FB8C00", // Subdued Orange
                  "#F9A825", // Goldenrod
                  "#FDD835", // Muted Yellow
                  "#689F38", // Olive Green
                  "#2E7D32", // Forest Green
                  "#388E3C", // Earthy Green
                  "#00838F", // Teal Blue
                  "#0097A7", // Dusty Cyan
                  "#1976D2", // Soft Blue
                  "#1565C0", // Deep Blue
                  "#5C6BC0", // Soft Indigo
                  "#6A1B9A", // Dark Plum
                  "#7B1FA2", // Deep Purple
                  "#AB47BC", // Dusty Purple
                  "#455A64", // Charcoal Blue
                  "#546E7A", // Slate Gray
                  "#90A4AE" // Cool Gray
                ].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newTagColor === color && styles.selectedColor
                    ]}
                    onPress={() => setNewTagColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCreateTagModalVisible(false)}
              >
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !newTagName.trim() && styles.disabledButton
                ]}
                onPress={handleCreateTag}
                disabled={!newTagName.trim()}
              >
                <ThemedText style={styles.buttonText}>Create</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginVertical: 10
  },
  selectedTagsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333333",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  tagText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "PTMono"
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#222",
    marginLeft: 8
  },
  noTagsText: {
    color: "#666",
    fontStyle: "italic",
    fontSize: 14
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.7)"
  },
  modalContent: {
    backgroundColor: "#111",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%"
  },
  createTagModalContent: {
    maxHeight: "50%"
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "RobotoMono",
    color: "#fff"
  },
  createTagButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    borderStyle: "dashed",
    marginBottom: 16
  },
  createTagText: {
    color: "#2196F3",
    fontSize: 16,
    marginLeft: 8,
    fontFamily: "RobotoMono"
  },
  tagList: {
    marginBottom: 16
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    backgroundColor: "#1A1A1A"
  },
  selectedTagItem: {
    backgroundColor: "#222"
  },
  tagColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12
  },
  tagName: {
    flex: 1,
    fontSize: 16,
    color: "#eee"
  },
  checkmark: {
    marginLeft: 8
  },
  doneButton: {
    backgroundColor: "#2196F3",
    padding: 14,
    borderRadius: 10,
    alignItems: "center"
  },
  doneText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  },
  emptyListText: {
    textAlign: "center",
    color: "#666",
    padding: 20,
    fontStyle: "italic"
  },
  // New tag creation modal styles
  tagInput: {
    backgroundColor: "#1A1A1A",
    color: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    fontFamily: "PTMono"
  },
  colorSection: {
    marginBottom: 20
  },
  colorLabel: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 10
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: "white"
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  cancelButton: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center"
  },
  saveButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center"
  },
  disabledButton: {
    backgroundColor: "#2196F380"
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "RobotoMono"
  }
});
