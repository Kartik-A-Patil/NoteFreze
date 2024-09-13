import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, TextInput, Modal, TouchableOpacity, Text, BackHandler, Alert, ActivityIndicator } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import DatePicker from 'react-native-date-picker';
import { router, useNavigation, useLocalSearchParams } from 'expo-router';
import { removeReminder, moveMultipleToBin, getNoteById, deleteMultipleNotes,restoreMultipleFromBin } from '@/utils/db';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Button, Dialog, Portal, Tooltip } from 'react-native-paper';
import Context from '@/context/createContext';
import { schedulePushNotification, cancelPushNotification } from '@/components/Notification';

interface Note {
  id: number;
  title: string;
  content: string;
  isInBin: number;
  reminder?: number | null;
}

export default function CreateNote() {
  const { noteId } = useLocalSearchParams();
  const navigation = useNavigation();
  const richText = useRef<RichEditor>(null);
  const { handleSaveNote,onToggleSnackBar} = useContext(Context);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [reminder, setReminder] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [reminderMode, setReminderMode] = useState<'add' | 'edit'>('add');
  const [notificationId, setNotificationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      if (noteId !== 'new') {
        try {
          const fetchedNote = await getNoteById(Number(noteId));
          setTitle(fetchedNote.title);
          setContent(fetchedNote.content);
          setReminder(fetchedNote.reminder ? new Date(fetchedNote.reminder) : null);
          setNotificationId(fetchedNote.notificationId || null);
        } catch (error) {
          console.error('Error fetching note:', error);
          Alert.alert('Error', 'Failed to fetch note.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  useFocusEffect(
    useCallback(() => {
      const handleBackPress = () => {
        saveNote();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    }, [title, content, reminder])
  );

  const saveNote = useCallback(() => {
    handleSaveNote(noteId, title, content, reminder, notificationId);
  }, [noteId, title, content, reminder, notificationId]);

  const handleDeleteReminder = async () => {
    try {
      if (noteId !== 'new') {
        await removeReminder(noteId);
        if (notificationId) {
          await cancelPushNotification(notificationId);
        }
        setReminder(null);
        onToggleSnackBar({ SnackBarMsg: 'Reminder Dissmissed' })

      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
      Alert.alert('Error', 'Failed to delete reminder.');
    }
  };

  const handleReminderPress = () => {
    setReminderMode(reminder ? 'edit' : 'add');
    setDatePickerVisible(true);
  };

  const handleSetReminder = async () => {
    setDatePickerVisible(false);
    if (reminder) {
      const notifiId = await schedulePushNotification(title, reminder);
      setNotificationId(notifiId);
      onToggleSnackBar({ SnackBarMsg: `Reminder Set at ${reminder.toLocaleString()}` })
    }
  };
const restoreFromBin = async(id:any) =>{
  await restoreMultipleFromBin(id);
}
  const moveNoteToBin = async () => {
    try {
      const noteIds = [noteId];
      await moveMultipleToBin(noteIds);
      onToggleSnackBar({ SnackBarMsg: 'Note Moved to bin',SnackBarAction:restoreFromBin(noteIds) })

      if (notificationId) {
        await cancelPushNotification(notificationId);
      }
      router.navigate('/');
    } catch (error) {
      console.error('Error moving note to bin:', error);
    }
  };

  const handleDeleteNotePermanently = async () => {
    try {
      const noteIds = [noteId];
      await deleteMultipleNotes(noteIds);
      onToggleSnackBar({ SnackBarMsg: 'Note deleted Permanently'})

      if (notificationId) {
        await cancelPushNotification(notificationId);
      }
      router.navigate('/');
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const toggleDialogSwitch = () => setDialogVisible(!dialogVisible);

  const renderHeaderRight = useCallback(() => (
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
  ), [saveNote, reminder, noteId]);

  useEffect(() => {
    navigation.setOptions({ headerRight: renderHeaderRight });
  }, [renderHeaderRight]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <View style={{ flex: 1 }}>
          <TextInput
            style={styles.titleInput}
            placeholder="Note Title"
            placeholderTextColor="#888"
            value={title}
            onChangeText={setTitle}
            returnKeyType="done"
          />
          <RichEditor
            ref={richText}
            style={styles.editor}
            placeholder="Note Content"
            initialContentHTML={content}
            initialFocus={noteId == 'new'}
            onChange={setContent}
            editorStyle={{ backgroundColor: '#000', color: '#fff' }}
          />
          <RichToolbar
            editor={richText}
            actions={[
              actions.undo,
              actions.redo,
              actions.setBold,
              actions.setItalic,
              actions.setUnderline,
              actions.checkboxList,
              actions.insertBulletsList,
              actions.insertOrderedList,
            ]}
            iconTint="#fff"
            selectedIconTint="#ccc"
            style={styles.toolbar}
            unselectedButtonStyle={{ width: 40 }}
            selectedButtonStyle={{ backgroundColor: '#444', borderRadius: 30, width: 40 }}
          />
        </View>
      )}

      <Modal
        visible={isDatePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <DatePicker
              date={reminder || new Date()}
              mode="datetime"
              onDateChange={setReminder}
              theme="dark"
              minimumDate={new Date()}
              dividerColor="#666"
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity onPress={handleSetReminder} style={styles.button}>
                <Text style={styles.buttonText}>
                  {reminderMode === 'edit' ? 'Update Reminder' : 'Set Reminder'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)} style={styles.button}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>

            {reminder && (
              <TouchableOpacity onPress={handleDeleteReminder} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Remove Reminder</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={toggleDialogSwitch} style={{ backgroundColor: '#000' }}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title>Do you want to delete this note permanently?</Dialog.Title>
          <Dialog.Actions>
            <Button onPress={toggleDialogSwitch}>Cancel</Button>
            <Button onPress={handleDeleteNotePermanently}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const menuCustomStyles = {
  optionsContainer: {
    backgroundColor: '#151515',
    padding: 10,
    width: 200,
    borderRadius: 10,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
  },
  titleInput: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 10,
    paddingHorizontal: 15,
    fontFamily: 'RobotoMono',

  },
  editor: {
    flex: 1,
    paddingHorizontal: 15,
  },
  toolbar: {
    backgroundColor: '#151515',
    width: '90%',
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 15
  },
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: '#151515',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 50
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#222', // Dark button color
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal:15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff', // White text color
    fontSize: 16,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff3b30', // Dark red for delete button
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  deleteButtonText: {
    color: '#fff', // White text
    fontSize: 16,
    textAlign: 'center',
  },
});
