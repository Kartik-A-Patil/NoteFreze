import React, { useState, ReactNode, useCallback, useEffect } from 'react';
import Context from '@/context/createContext';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { saveNote, removeReminder, addReminder, loadNotes } from '@/utils/db';
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

    const handleSaveNote = useCallback(
        async (noteId: string | number | null, title: string | null, content: string | null, reminder: Date | null, notificationId: string | null) => {
            if (!title && !content) {
                fetchNotes();
                router.navigate('/');
                return;
            }

            try {
                const reminderTime = reminder?.getTime() || null;

                const savedNoteId = await saveNote(
                    noteId === 'new' ? null : Number(noteId),
                    title,
                    content,
                    reminderTime,
                    notificationId
                );
                if (reminderTime) {
                    await addReminder(savedNoteId, reminderTime);
                } else if (savedNoteId) {
                    await removeReminder(savedNoteId);
                }
                router.navigate('/');
                fetchNotes();
                onToggleSnackBar({ SnackBarMsg: 'Note Saved' })
            } catch (error) {
                console.error('Error in handleSaveNote:', error);
                Alert.alert('Error', `Failed to save note: ${error}`);
            }
        },
        [fetchNotes]
    );

    return (
        <Context.Provider
            value={{
                isAuthEnabled,
                setIsAuthEnabled,
                handleSaveNote,
                fetchNotes,
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
