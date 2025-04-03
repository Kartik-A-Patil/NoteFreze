import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Menu, MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native-paper';
import { ThemedText } from '@/components/ThemedText';

interface NoteHeaderProps {
  saveNote: () => void;
  handleReminderPress: () => void;
  handleToggleLock: () => void;
  moveNoteToBin: () => void;
  toggleDialogSwitch: () => void;
  reminder: Date | null;
  isLocked: boolean;
  noteId: string | number;
  isSaving: boolean;
  isModified: boolean;
}

const NoteHeader = ({ 
  saveNote, 
  handleReminderPress, 
  handleToggleLock, 
  moveNoteToBin, 
  toggleDialogSwitch, 
  reminder, 
  isLocked, 
  noteId, 
  isSaving, 
  isModified 
}: NoteHeaderProps) => {
  return (
    <Menu>
      <MenuTrigger style={{ padding: 5 }}>
        <Ionicons name="ellipsis-vertical-outline" size={28} color="#fff" />
      </MenuTrigger>
      <MenuOptions customStyles={menuCustomStyles}>
        <MenuOption onSelect={saveNote}>
          <Text style={styles.menuText}>Save</Text>
        </MenuOption>
        <View style={styles.divider} />
        <MenuOption onSelect={handleReminderPress}>
          {reminder ? (
            <ThemedText>{reminder.toLocaleString()}</ThemedText>
          ) : (
            <Text style={styles.menuText}>Set Reminder</Text>
          )}
        </MenuOption>
        <View style={styles.divider} />
        <MenuOption onSelect={handleToggleLock}>
          <View style={styles.lockOption}>
            <Text style={styles.menuText}>Lock Note</Text>
            <Switch value={isLocked} onValueChange={handleToggleLock} />
          </View>
        </MenuOption>
        {noteId !== 'new' && (
          <>
            <View style={styles.divider} />
            <MenuOption onSelect={moveNoteToBin}>
              <Text style={styles.menuText}>Move To Bin</Text>
            </MenuOption>
            <View style={styles.divider} />
            <MenuOption onSelect={toggleDialogSwitch}>
              <Text style={styles.menuText}>Delete Permanently</Text>
            </MenuOption>
          </>
        )}
      </MenuOptions>
    </Menu>
  );
};

const menuCustomStyles = {
  optionsContainer: {
    backgroundColor: '#151515',
    padding: 10,
    width: 200,
    borderRadius: 10,
  },
};

const styles = StyleSheet.create({
  menuText: {
    fontSize: 15,
    color: '#ddd',
    fontFamily: 'RobotoMono'
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 5,
  },
  lockOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
});

export default NoteHeader;
