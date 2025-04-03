import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { View, StyleSheet, TextInput, BackHandler, Alert, ActivityIndicator, ScrollView, AppState } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { removeReminder, addReminder, moveMultipleToBin, getNoteById, deleteMultipleNotes, restoreMultipleFromBin, toggleNoteLock, getNoteTagIdsById } from '@/utils/db';
import Context from '@/context/createContext';
import { schedulePushNotification, cancelPushNotification } from '@/components/Notification';
import { LockModal } from '@/components/LockModal';
import RichTextEditor from '@/components/notes/RichTextEditor';
import ReminderModal from '@/components/notes/ReminderModal';
import NoteHeader from '@/components/notes/NoteHeader';
import DeleteConfirmationDialog from '@/components/notes/DeleteConfirmationDialog';
import TagSelector from '@/components/tags/TagSelector';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface Note {
  id: number;
  title: string;
  content: string;
  isInBin: number;
  reminder?: number | null;
  isLocked?: boolean;
  tags?: string[];
}

export default function CreateNote() {
  const { noteId } = useLocalSearchParams();
  const navigation = useNavigation();
  const { handleSaveNote, onToggleSnackBar, removeNoteFromState } = useContext(Context);

  // State
  const [dialogVisible, setDialogVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [reminder, setReminder] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [reminderMode, setReminderMode] = useState<'add' | 'edit'>('add');
  const [notificationId, setNotificationId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [contentReady, setContentReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [initialTitle, setInitialTitle] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [editorInitialized, setEditorInitialized] = useState(false);
  const [internalContent, setInternalContent] = useState('');
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [tags, setTags] = useState<Array<{name: string, color: string}>>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isNavigating, setIsNavigating] = useState(false); // Add this to track navigation state
  const [backButtonPressed, setBackButtonPressed] = useState(false); // Track back button presses

  // Fetch note data
  useEffect(() => {
    const fetchNote = async () => {
      if (noteId !== 'new') {
        try {
          setLoading(true);
          setContentReady(false);
          
          const fetchedNote = await getNoteById(Number(noteId));
          
          if (fetchedNote) {
            setCurrentNote(fetchedNote);
            setTitle(fetchedNote.title || '');
            setInitialTitle(fetchedNote.title || '');
            setContent(fetchedNote.content || '');
            setInternalContent(fetchedNote.content || '');
            setInitialContent(fetchedNote.content || '');
            setIsLocked(!!fetchedNote.isLocked);
            setIsEncrypted(!!fetchedNote.isEncrypted);
            
            // If the note has a reminder, set it
            if (fetchedNote.reminder) {
              setReminder(new Date(fetchedNote.reminder));
              setNotificationId(fetchedNote.notificationId || null);
            } else {
              setReminder(null);
              setNotificationId(null);
            }
            
            // Set tags
            if (fetchedNote.tags) {
              setTags(fetchedNote.tags);
              
              // Also get tag IDs for the new selector
              const ids = await getNoteTagIdsById(Number(noteId));
              setTagIds(ids);
            }

            // Show authentication modal if note is locked/encrypted
            if (fetchedNote.isLocked || fetchedNote.isEncrypted) {
              setShowLockModal(true);
              // Don't set content ready until after authentication
              return;
            }
          }
          
          setContentReady(true);
        } catch (error) {
          console.error('Error fetching note:', error);
          Alert.alert('Error', 'Failed to load note.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setContentReady(true);
      }
    };

    fetchNote();
  }, [noteId]);
  
  // Handle successful authentication
  const handleAuthSuccess = async () => {
    try {
      const decryptedNote = await getNoteById(Number(noteId), true);
      
      if (decryptedNote) {
        setTitle(decryptedNote.title || "");
        setInitialTitle(decryptedNote.title || "");
        setContent(decryptedNote.content || "");
        setInitialContent(decryptedNote.content || "");
        setTags(decryptedNote.tags || []);
        setIsEncrypted(false);
      } else {
        console.error("Failed to get decrypted note");
        Alert.alert('Error', 'Failed to decrypt note content.');
      }
    } catch (error) {
      console.error('Error decrypting note:', error);
      Alert.alert('Error', 'Failed to decrypt note.');
    } finally {
      setShowLockModal(false);
      setContentReady(true);
      setLoading(false);
    }
  };
  
  // Handle authentication failure
  const handleAuthFail = () => {
    setShowLockModal(false);
    router.navigate('/');
    onToggleSnackBar({ SnackBarMsg: 'Authentication required to view locked note' });
  };
  
  // Handle modal dismissal
  const handleDismissLockModal = () => {
    setShowLockModal(false);
    router.navigate('/');
  };

  // Save note function
  const saveNote = useCallback(async (shouldNavigate = false) => {
    // Prevent saving if we're already saving or navigating
    if (isSaving || isNavigating) return;
    
    // If not new and not modified, just navigate back
    if (noteId !== 'new' && !isModified && !internalContent) {
      if (shouldNavigate) {
        setIsNavigating(true);
        router.navigate('/');
      }
      return;
    }

    setIsSaving(true);
    
    try {
      // Use memoized content when possible to avoid string processing
      let finalContent = internalContent || content;
      
      // Quick empty check before proceeding
      const isEmpty = noteId === 'new' && !title && (!finalContent || finalContent.trim() === '');
      if (isEmpty) {
        console.log('Empty note not saved');
        if (shouldNavigate) {
          setIsNavigating(true);
          router.navigate('/');
        }
        return;
      }
      
      // Optimize ID handling
      const validNoteId = noteId !== 'new' ? Number(noteId) : null;
      
      // Perform the actual save operation
      await handleSaveNote(validNoteId, title, finalContent, reminder, notificationId, isLocked, tagIds);
      
      // Update state only once
      if (!shouldNavigate) {
        setContent(finalContent);
        setInitialContent(finalContent);
        setInitialTitle(title);
        setIsModified(false);
      }
      
      // Navigate if needed - do this before other state updates
      if (shouldNavigate) {
        setIsNavigating(true);
        setTimeout(() => router.navigate('/'), 0); // Use setTimeout to help UI thread
      }
    } catch (error) {
      console.error("Error saving note:", error);
      Alert.alert("Error", "Failed to save note.");
      
      if (shouldNavigate) {
        setIsNavigating(true);
        setTimeout(() => router.navigate('/'), 0);
      }
    } finally {
      setIsSaving(false);
    }
  }, [noteId, title, content, internalContent, reminder, notificationId, isLocked, tagIds, 
      isSaving, isModified, handleSaveNote, isNavigating, router]);

  // Handle toggle lock
  const handleToggleLock = async () => {
    if (noteId !== 'new') {
      try {
        const newLockState = !isLocked;
        setIsLocked(newLockState);
        
        await toggleNoteLock(Number(noteId), newLockState);
        
        if (!newLockState && isEncrypted) {
          const decryptedNote = await getNoteById(Number(noteId), true);
          setTitle(decryptedNote.title || "");
          setContent(decryptedNote.content || "");
          setIsEncrypted(false);
        }
        
        onToggleSnackBar({ SnackBarMsg: newLockState ? 'Note locked' : 'Note unlocked' });
      } catch (error) {
        console.error('Error toggling note lock:', error);
        Alert.alert('Error', 'Failed to update note lock status.');
      }
    } else {
      setIsLocked(!isLocked);
      onToggleSnackBar({ SnackBarMsg: !isLocked ? 'Note will be locked after saving' : 'Note will not be locked' });
    }
  };

  // Handle delete reminder
  const handleDeleteReminder = async () => {
    try {
      if (noteId !== 'new') {
        await removeReminder(noteId);
        if (notificationId) {
          await cancelPushNotification(notificationId);
        }
        setReminder(null);
        onToggleSnackBar({ SnackBarMsg: 'Reminder Dissmissed' });
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
      Alert.alert('Error', 'Failed to delete reminder.');
    }
  };

  // Handle reminder settings
  const handleReminderPress = () => {
    setReminderMode(reminder ? 'edit' : 'add');
    setDatePickerVisible(true);
  };

  const handleSetReminder = async () => {
    setDatePickerVisible(false);
    if (reminder) {
      // Make absolutely sure the date is in the future
      const now = new Date();
      const minimumTime = new Date(now.getTime() + 5000); // At least 5 seconds in the future
      
      if (reminder <= minimumTime) {
        onToggleSnackBar({ SnackBarMsg: `Please select a time at least a few seconds in the future` });
        return;
      }
      
      // Cancel any existing notification before creating a new one
      if (notificationId) {
        console.log(`Canceling existing notification: ${notificationId}`);
        await cancelPushNotification(notificationId);
        setNotificationId(null);
      }
      
      console.log(`Setting reminder for: ${reminder.toLocaleString()}`);
      const notifiId = await schedulePushNotification(title || 'Untitled Note', reminder);
      
      if (notifiId) {
        setNotificationId(notifiId);
        onToggleSnackBar({ SnackBarMsg: `Reminder Set for ${reminder.toLocaleString()}` });
        
        // Save reminder to database if note exists
        if (noteId !== 'new') {
          console.log(`Saving reminder to database for note ${noteId}`);
          await addReminder(Number(noteId), reminder.getTime());
        }
      } else {
        onToggleSnackBar({ SnackBarMsg: `Failed to set reminder. Please try again.` });
      }
    }
  };

  // Note actions
  const restoreFromBin = async(id:any) => {
    await restoreMultipleFromBin(id);
  };
  
  const moveNoteToBin = async () => {
    try {
      const noteIds = [Number(noteId)];
      const notificationIds = await moveMultipleToBin(noteIds);
      
      // Update state directly without full refresh
      removeNoteFromState(Number(noteId));
      
      onToggleSnackBar({ 
        SnackBarMsg: 'Note Moved to bin', 
        SnackBarAction: () => restoreFromBin(noteIds) 
      });

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
      const noteIds = [Number(noteId)];
      await deleteMultipleNotes(noteIds);
      
      // Update state directly without full refresh
      removeNoteFromState(Number(noteId));
      
      onToggleSnackBar({ SnackBarMsg: 'Note deleted Permanently' });

      if (notificationId) {
        await cancelPushNotification(notificationId);
      }
      router.navigate('/');
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const toggleDialogSwitch = () => setDialogVisible(!dialogVisible);

  // Setup header right component
  const renderHeaderRight = useCallback(() => {
    return (
      <NoteHeader
        saveNote={saveNote}
        handleReminderPress={handleReminderPress}
        handleToggleLock={handleToggleLock}
        moveNoteToBin={moveNoteToBin}
        toggleDialogSwitch={toggleDialogSwitch}
        reminder={reminder}
        isLocked={isLocked}
        noteId={noteId}
        isSaving={isSaving}
        isModified={isModified}
      />
    );
  }, [reminder, isLocked, noteId, isSaving, isModified, saveNote]);

  // Update header options
  useEffect(() => {
    navigation.setOptions({ 
      headerRight: renderHeaderRight
    });
  }, [renderHeaderRight]);

  // Handle back button
  useEffect(() => {
    const handleBackPress = async () => {
      // Prevent multiple back button presses from creating duplicates
      if (backButtonPressed || isSaving || isNavigating) {
        return true; // Block default navigation if we're already processing
      }
      
      setBackButtonPressed(true);
      
      try {
        // Check if we need to save
        const needsSave = (isModified || noteId === 'new') && 
                          (title || (internalContent && internalContent.trim() !== ''));
        
        if (needsSave) {
          await saveNote(true); // Save and navigate
        } else {
          setIsNavigating(true);
          router.navigate('/');
        }
        
        // Return true to prevent default back behavior since we're handling navigation
        return true;
      } finally {
        // Reset the flag after a delay to prevent rapid presses
        setTimeout(() => {
          setBackButtonPressed(false);
        }, 500);
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [saveNote, isSaving, isModified, noteId, title, internalContent, isNavigating, backButtonPressed]);

  // Check for modifications
  useEffect(() => {
    if (noteId !== 'new') {
      const titleChanged = title !== initialTitle;
      const contentChanged = content !== initialContent;
      const isChanged = titleChanged || contentChanged;
      
      if (isChanged !== isModified) {
        setIsModified(isChanged);
      }
    }
  }, [title, content, initialTitle, initialContent, noteId]);

  // Content change handler
  const handleContentChange = useCallback((newContent: string) => {
    setInternalContent(newContent);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setContent(newContent);
      if (newContent !== initialContent) {
        setIsModified(true);
      }
    }, 300);
  }, [initialContent]);

  // Handle tag selection
  const handleTagsSelected = (selectedTagIds: number[]) => {
    setTagIds(selectedTagIds);
    setIsModified(true);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save unsaved note when app goes background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // Don't save if we're already in the process of navigating away
      if (nextAppState === 'background' && !isNavigating && !backButtonPressed) {
        // Only save if there are changes and content worth saving
        if ((isModified || noteId === 'new') && 
            (title || (content && content.trim() !== ''))) {
          saveNote(false); // Don't navigate when saving in background
        }
      }
    });
    return () => subscription.remove();
  }, [noteId, isModified, saveNote, title, content, isNavigating, backButtonPressed]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.titleContainer}>
            <TextInput
              style={styles.titleInput}
              placeholder="Note Title"
              placeholderTextColor="#888"
              value={title}
              onChangeText={setTitle}
              returnKeyType="done"
            />
            {isLocked && (
              <MaterialCommunityIcons 
                name="lock" 
                size={20} 
                color="#FFC107" 
                style={styles.lockIcon} 
              />
            )}
          </View>
          
          {/* TagSelector component */}
          <TagSelector
            selectedTagIds={tagIds}
            onTagsSelected={handleTagsSelected}
          />
          
          {contentReady && (
            <RichTextEditor
              initialContent={initialContent}
              handleContentChange={handleContentChange}
              editorInitialized={editorInitialized}
            />
          )}
        </View>
      )}

      {/* Lock Modal for Authentication */}
      <LockModal
        visible={showLockModal}
        onAuthSuccess={handleAuthSuccess}
        onAuthFail={handleAuthFail}
        onDismiss={handleDismissLockModal}
      />

      {/* Reminder Modal */}
      <ReminderModal
        visible={isDatePickerVisible}
        setVisible={setDatePickerVisible}
        reminder={reminder}
        setReminder={setReminder}
        handleSetReminder={handleSetReminder}
        handleDeleteReminder={handleDeleteReminder}
        reminderMode={reminderMode}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        visible={dialogVisible}
        onDismiss={toggleDialogSwitch}
        onConfirm={handleDeleteNotePermanently}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  titleInput: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 10,
    flex: 1,
    fontFamily: 'RobotoMono',
  },
  lockIcon: {
    marginLeft: 10,
    marginBottom: 10,
  },
});
