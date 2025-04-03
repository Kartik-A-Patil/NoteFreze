import React, { useContext, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
  BackHandler
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Context from "@/context/createContext";
import * as LocalAuthentication from "expo-local-authentication";
import * as TagRepository from "@/utils/tagRepository";

export default function Settings() {
  const context = useContext(Context);
  const [tags, setTags] = useState<TagRepository.Tag[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#444444");
  const [editingTagId, setEditingTagId] = useState<number | null>(null);

  // Add back button handler
  useEffect(() => {
    const handleBackPress = () => {
      router.navigate('/');
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, []);

  const checkHardwareAndEnrollment = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (hasHardware && isEnrolled) {
      console.log(
        "Device has hardware and is enrolled for biometric authentication."
      );
    }
  };

  // Load tags when component mounts
  useEffect(() => {
    checkHardwareAndEnrollment();
    loadTags();
  }, []);

  const loadTags = async () => {
    const allTags = await TagRepository.getAllTags();
    setTags(allTags);
  };

  const handleAddTag = async () => {
    if (tagName.trim() === "") {
      Alert.alert("Error", "Tag name cannot be empty");
      return;
    }

    try {
      if (editingTagId) {
        // Update existing tag
        await TagRepository.updateTag(editingTagId, tagName, tagColor);
      } else {
        // Add new tag
        await TagRepository.addTag(tagName, tagColor);
      }

      // Reset form and refresh tags
      setTagName("");
      setTagColor("#444444");
      setEditingTagId(null);
      setShowTagModal(false);
      await loadTags();
    } catch (error) {
      Alert.alert("Error", "Failed to save tag");
      console.error(error);
    }
  };

  const handleEditTag = (tag: TagRepository.Tag) => {
    setTagName(tag.name);
    setTagColor(tag.color);
    setEditingTagId(tag.id);
    setShowTagModal(true);
  };

  const handleDeleteTag = async (tagId: number) => {
    Alert.alert(
      "Delete Tag",
      "Are you sure you want to delete this tag? It will be removed from all notes.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await TagRepository.deleteTag(tagId);
              await loadTags();
            } catch (error) {
              Alert.alert("Error", "Failed to delete tag");
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const SettingItem = ({ title, icon, onPress, value, description }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.settingItem}
      activeOpacity={0.6}
    >
      <View style={styles.settingContent}>
        <Ionicons name={icon} size={20} color="#666" style={styles.icon} />
        <View style={styles.textWrapper}>
          <ThemedText style={styles.itemTitle}>{title}</ThemedText>
          {description && (
            <ThemedText style={styles.itemDescription}>
              {description}
            </ThemedText>
          )}
        </View>
      </View>
      {value ? (
        <ThemedText style={styles.valueText}>{value}</ThemedText>
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#555" />
      )}
    </TouchableOpacity>
  );

  const renderTag = ({ item }: { item: TagRepository.Tag }) => (
    <View style={styles.tagItem}>
      <View style={styles.tagInfo}>
        <View style={[styles.tagColor, { backgroundColor: item.color }]} />
        <ThemedText style={styles.tagName}>{item.name}</ThemedText>
      </View>
      <View style={styles.tagActions}>
        <TouchableOpacity
          onPress={() => handleEditTag(item)}
          style={styles.tagButton}
        >
          <Ionicons name="pencil" size={18} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteTag(item.id)}
          style={styles.tagButton}
        >
          <Ionicons name="trash-outline" size={18} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ThemedText style={styles.headerText}>Settings</ThemedText>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>TOOLS</ThemedText>
        <SettingItem
          title="Recycle Bin"
          icon="trash-outline"
          onPress={() => router.navigate("/bin")}
        />
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>TAGS</ThemedText>
        {tags.length === 0 ? (
          <ThemedText style={styles.noTags}>No tags created yet</ThemedText>
        ) : (
          <View style={styles.tagList}>
            {tags.map((tag) => renderTag({ item: tag }))}
          </View>
        )}
        <TouchableOpacity
          style={styles.addTagButton}
          onPress={() => {
            setTagName("");
            setTagColor("#444444");
            setEditingTagId(null);
            setShowTagModal(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#666" />
          <ThemedText style={styles.addTagText}>Add New Tag</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>ABOUT</ThemedText>
        <SettingItem
          title="Contributors"
          icon="people-outline"
          value="Kartik Patil"
        />
        <SettingItem title="Version" icon="code-outline" value="1.0.0" />
      </View>

      {/* Tag Modal */}
      <Modal
        visible={showTagModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTagModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              {editingTagId ? "Edit Tag" : "Add New Tag"}
            </ThemedText>

            <TextInput
              style={styles.tagInput}
              placeholder="Tag name"
              placeholderTextColor="#666"
              value={tagName}
              onChangeText={setTagName}
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
                      tagColor === color && styles.selectedColor
                    ]}
                    onPress={() => setTagColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTagModal(false)}
              >
                <ThemedText style={[styles.buttonText, { color: "#999" }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddTag}
              >
                <ThemedText style={[styles.buttonText, { color: "#000" }]}>
                  {editingTagId ? "Update" : "Add"}
                </ThemedText>
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
    flex: 1,
    padding: 24,
    backgroundColor: "#000000"
  },
  headerText: {
    fontSize: 24,
    fontFamily: "ndot",
    paddingTop: 16,
    marginBottom: 40,
    color: "#fff"
  },
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "RobotoMono",
    marginBottom: 12,
    marginLeft: 4,
    color: "#555",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: "#0A0A0A",
    borderRadius: 8
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center"
  },
  icon: {
    marginRight: 12,
    width: 24
  },
  textWrapper: {
    flexDirection: "column"
  },
  itemTitle: {
    fontSize: 15,
    fontFamily: "RobotoMono",
    color: "#eee",
    letterSpacing: 0.2
  },
  itemDescription: {
    fontSize: 12,
    fontFamily: "PTMono",
    color: "#666",
    marginTop: 2
  },
  valueText: {
    fontSize: 13,
    fontFamily: "PTMono",
    color: "#666"
  },
  // Tag list styles
  tagList: {
    marginBottom: 10
  },
  tagItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  tagInfo: {
    flexDirection: "row",
    alignItems: "center"
  },
  tagColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12
  },
  tagName: {
    fontSize: 14,
    color: "#eee",
    fontFamily: "PTMono"
  },
  tagActions: {
    flexDirection: "row",
    alignItems: "center"
  },
  tagButton: {
    padding: 8,
    marginLeft: 8
  },
  addTagButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#111",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#333"
  },
  addTagText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14
  },
  noTags: {
    color: "#666",
    textAlign: "center",
    padding: 20,
    fontStyle: "italic"
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    padding: 20
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 20,
    borderColor: "#333",
    borderWidth: 1
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "RobotoMono",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center"
  },
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
    width: 32,
    height: 32,
    borderRadius: 16,
    margin: 4
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
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center"
  },
  saveButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center"
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "RobotoMono"
  }
});
