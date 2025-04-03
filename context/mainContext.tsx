import React, { useState, ReactNode, useCallback, useEffect } from 'react';
import Context from '@/context/createContext';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { saveNote, removeReminder, addReminder, loadNotes, getNoteById } from '@/utils/db';
import { router } from 'expo-router';

interface ContextProviderProps {
    children: ReactNode;
}

interface Note {
    id: number;
    title: string;
    content: string;
    isInBin: number;
    reminder?: number | null;
}
type ToggleSnackBarArgs = {
    SnackBarAction?: any;
    SnackBarMsg?: string;
};
const ContextProvider: React.FC<ContextProviderProps> = ({ children }) => {
    const [isAuthEnabled, setIsAuthEnabled] = useState(false);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);
    const [SnackBarAction, setSnackBarAction] = useState<() => void>(() => () => setVisible(!visible));
    const [SnackBarMsg, setSnackBarMsg] = useState<string | undefined>('');

    const onToggleSnackBar = ({ SnackBarAction, SnackBarMsg }: ToggleSnackBarArgs = {}) => {
        setSnackBarAction(SnackBarAction);
        setSnackBarMsg(SnackBarMsg);
        setVisible(!visible);
    };

    const onDismissSnackBar = () => setVisible(false);

    useEffect(() => {
        const loadAuthEnabled = async () => {
            try {
                const storedValue = await SecureStore.getItemAsync('authEnabled');
                if (storedValue !== null) {
                    setIsAuthEnabled(JSON.parse(storedValue));
                }
            } catch (error) {
                console.error('Error loading authEnabled:', error);
            }
        };
        loadAuthEnabled();
    }, []);
    useEffect(() => {
        const saveAuthEnabled = async () => {
            try {
                await SecureStore.setItemAsync('authEnabled', JSON.stringify(isAuthEnabled));
            } catch (error) {
                console.error('Error saving authEnabled:', error);
            }
        };
        saveAuthEnabled();
    }, [isAuthEnabled]);


    const fetchNotes = useCallback(async () => {
        setLoading(true)
        try {
            const allNotes = await loadNotes();
            setNotes(allNotes);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);

        }
    }, []);

    const updateNoteInState = useCallback((updatedNote: any) => {
        setNotes(prevNotes => 
            prevNotes.map(note => 
                note.id === updatedNote.id ? updatedNote : note
            )
        );
    }, []);
    
    const removeNoteFromState = useCallback((noteId: number) => {
        setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    }, []);
    
    const addNoteToState = useCallback((note: any) => {
        setNotes(prevNotes => [note, ...prevNotes]);
    }, []);

    const handleSaveNote = useCallback(
        async (
            noteId: string | number | null, 
            title: string | null, 
            content: string | null, 
            reminder: Date | null, 
            notificationId: string | null, 
            isLocked: boolean = false, 
            tagIds: number[] = []  // Changed from tags array to tagIds array
        ) => {
            // Skip if both title and content are empty
            if (!title && (!content || content.trim() === '')) {
                console.log("No content to save");
                // Don't navigate here - let calling code handle navigation
                return;
            }

            try {
                console.log('Starting save operation for note ID:', noteId);
                
                const reminderTime = reminder?.getTime() || null;
                
                // Make sure we properly handle 'new' vs existing note to avoid duplication
                const numericNoteId = noteId === 'new' ? null : 
                                     (typeof noteId === 'string' ? Number(noteId) : noteId);
                
                // Save the note and get the ID using tag IDs directly
                const savedNoteId = await saveNote(
                    numericNoteId,
                    title,
                    content,
                    reminderTime,
                    notificationId,
                    isLocked,
                    tagIds
                );
                
                console.log('Saved note ID:', savedNoteId);

                // Handle reminders only if we have a valid note ID
                if (typeof savedNoteId === 'number') {
                    // Update UI state based on whether it's a new note or an existing one
                    if (noteId === 'new') {
                        // Load the freshly created note to get all fields
                        const newNote = await getNoteById(savedNoteId);
                        if (newNote) {
                            addNoteToState(newNote);
                        }
                        
                        // DON'T navigate here - let calling code handle navigation
                        // This helps prevent navigation conflicts
                    } else {
                        // Update the existing note in state
                        const updatedNote = await getNoteById(Number(noteId));
                        if (updatedNote) {
                            updateNoteInState(updatedNote);
                        }
                    }
                    
                    return true; // Success
                }
                
                return false; // Failed to save
            } catch (error) {
                console.error('Error saving note:', error);
                onToggleSnackBar({
                    SnackBarMsg: 'Failed to save note'
                });
                return false;
            }
        },
        [addNoteToState, updateNoteInState, onToggleSnackBar]
    );

    return (
        <Context.Provider
            value={{
                isAuthEnabled,
                setIsAuthEnabled,
                handleSaveNote,
                fetchNotes,
                updateNoteInState,
                removeNoteFromState,
                addNoteToState,
                notes,
                loading,
                setLoading,
                visible,
                onDismissSnackBar,
                SnackBarAction,
                SnackBarMsg,
                onToggleSnackBar,
                setSnackBarMsg,
                setSnackBarAction
            }}
        >
            {children}
        </Context.Provider>
    );
};

export default ContextProvider;
