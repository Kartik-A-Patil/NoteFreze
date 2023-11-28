import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import SQLite from 'react-native-sqlite-storage';
import MyContext from './maincontext';

const db = SQLite.openDatabase({ name: 'notes.db', location: 'default' });

const MyContextProvider = (props) => {

  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [BinNotes, setBinNotes] = useState([]);
  const [toastFunction, setToastFunction] = useState({})
  const [toastMassage, setToastMassage] = useState('')
  const [toastVisible, setToastVisible] = useState(false);
  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, headline TEXT, text TEXT, todoList TEXT)',
        [],
        () => {
          console.log('Table created successfully');
        },
        (error) => {
          console.error('Error creating notes table:', error);
        }
      );
    });
    db.transaction((tx) => {
      tx.executeSql(
        'ALTER TABLE notes ADD COLUMN isInBin INTEGER DEFAULT 0',
        [],
        () => {
          console.log('Column added successfully');
        },
        (error) => {
          console.error('Error adding column:', error);
        }
      );
    });
  }, []);

  const loadNotes = () => {
    setIsLoading(true);
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM notes WHERE isInBin = 0',
        [],
        (tx, result) => {
          const rows = result.rows.raw();
          setNotes(rows);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error loading notes:', error);
          setIsLoading(false);
        }
      );
    });
  };
  const loadBinNotes = () => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM notes WHERE isInBin = 1',
        [],
        (tx, result) => {
          const rows = result.rows.raw();
          setBinNotes(rows);
        },
        (error) => {
          console.error('Error loading bin notes:', error);
        }
      );
    });
  };


  const handleNoteCopy = (note) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM notes WHERE id = ?',
        [note.id],
        (tx, result) => {
          const row = result.rows.item(0);
          if (row) {
            const newNote = { ...row, id: Date.now() };
            const parsedTodoList = JSON.parse(newNote.todoList || '[]');
            tx.executeSql(
              'INSERT INTO notes (id, headline, text, todoList) VALUES (?, ?, ?, ?)',
              [newNote.id, newNote.headline, newNote.text, JSON.stringify(parsedTodoList)],
              () => {
                loadNotes();
                setToastMassage('Note Copied')
                setToastFunction({ name: 'moveToBin', noteId: newNote.id })
                ShowToast()
              },
              (error) => {
                console.error('Error copying note:', error);
              }
            );
          }
        },
        (error) => {
          console.error('Error copying note:', error);
        }
      );
    });
  };

  const moveToBin = (noteId) => {
    try {
      db.transaction((tx) => {
        tx.executeSql(
          'UPDATE notes SET isInBin = 1 WHERE id = ?',
          [noteId],
          (_, result) => {
            console.log('Note moved to bin successfully');
            loadNotes();
            setToastMassage('Note moved to bin')
            setToastFunction({ name: 'restoreFromBin', noteId: noteId })
            ShowToast()
          },
          (error) => {
            console.error('Error moving note to bin:', error);
            Alert.alert('Error', 'Failed to move note to bin. Please try again.');
          }
        );
      });
    } catch (error) {
      console.error('Error moving note to bin:', error);
      Alert.alert('Error', 'Failed to move note to bin. Please try again.');
    }
  };

  const restoreFromBin = (noteId) => {
    try {
      db.transaction((tx) => {
        tx.executeSql(
          'UPDATE notes SET isInBin = 0 WHERE id = ?',
          [noteId],
          (_, result) => {
            loadNotes();
            setToastMassage('Note restored from bin successfully')
            setToastFunction({ name: 'moveToBin', noteId: noteId })
            ShowToast()

          },
          (error) => {
            console.error('Error restoring note from bin:', error);
            Alert.alert('Error', 'Failed to restore note from bin. Please try again.');
          }
        );
      });
    } catch (error) {
      console.error('Error restoring note from bin:', error);
      Alert.alert('Error', 'Failed to restore note from bin. Please try again.');
    }
  };
  const deleteNotePermanently = (noteId) => {
    try {
      db.transaction((tx) => {
        tx.executeSql(
          'DELETE FROM notes WHERE id = ?',
          [noteId],
          (_, result) => {
            loadNotes();
            setToastMassage('Note deleted permanently')
            setToastFunction({ name: '' })
            ShowToast()
          },
          (error) => {
            console.error('Error deleting note permanently:', error);
            Alert.alert('Error', 'Failed to delete note permanently. Please try again.');
          }
        );
      });
    } catch (error) {
      console.error('Error deleting note permanently:', error);
      Alert.alert('Error', 'Failed to delete note permanently. Please try again.');
    }
  };
  const emptyBinCompletely = () => {
    try {
      db.transaction((tx) => {
        tx.executeSql(
          'DELETE FROM notes WHERE isInBin = 1',
          [],
          (_, result) => {
            loadNotes();
            if (BinNotes.length !== 0) {
              setToastMassage('Bin emptied completely')
              setToastFunction({ name: '' })
              ShowToast()
            }
            else {
              setToastMassage('Bin is empty')
              setToastFunction({ name: '' })
              ShowToast()
            }

          },
          (error) => {
            console.error('Error emptying bin completely:', error);
            Alert.alert('Error', 'Failed to empty bin completely. Please try again.');
          }
        );
      });
    } catch (error) {
      console.error('Error emptying bin completely:', error);
      Alert.alert('Error', 'Failed to empty bin completely. Please try again.');
    }
  };

  const moveAllNotesToBin = () => {
    try {
      db.transaction((tx) => {
        tx.executeSql(
          'UPDATE notes SET isInBin = 1',
          [],
          (_, result) => {
            loadNotes();
            if (notes.length !== 0) {
              setToastMassage('All notes moved to bin')
              setToastFunction({ name: 'restoreAllFromBin' })
              ShowToast()
            }
            else {
              setToastMassage('No notes')
              setToastFunction({ name: '' })
              ShowToast()
            }
          },
          (error) => {
            console.error('Error moving all notes to bin:', error);
            Alert.alert('Error', 'Failed to move all notes to bin. Please try again.');
          }
        );
      });
    } catch (error) {
      console.error('Error moving all notes to bin:', error);
      Alert.alert('Error', 'Failed to move all notes to bin. Please try again.');
    }
  };
  const restoreAllFromBin = () => {
    try {
      db.transaction((tx) => {
        tx.executeSql(
          'UPDATE notes SET isInBin = 0 WHERE isInBin = 1',
          [],
          (_, result) => {
            console.log('All notes restored from bin');
            loadNotes();

            if (BinNotes.length !== 0) {
              setToastMassage('All notes restored from bin')
              setToastFunction({ name: 'moveAllNotesToBin' })
              ShowToast()
            }
            else {
              setToastMassage('Bin is empty')
              setToastFunction({ name: '' })
              ShowToast()
            }
          },
          (error) => {
            console.error('Error restoring all notes from bin:', error);
            Alert.alert('Error', 'Failed to restore all notes from bin. Please try again.');
          }
        );
      });
    } catch (error) {
      console.error('Error restoring all notes from bin:', error);
      Alert.alert('Error', 'Failed to restore all notes from bin. Please try again.');
    }
  };

  const ShowToast = () => {
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  };
  return (
    <MyContext.Provider value={{ handleNoteCopy, notes, BinNotes, isLoading, setIsLoading, loadNotes, loadBinNotes, moveAllNotesToBin, emptyBinCompletely, moveToBin, deleteNotePermanently, restoreFromBin, restoreAllFromBin, toastMassage, toastFunction, ShowToast, toastVisible, setToastVisible }}>
      {props.children}
    </MyContext.Provider>
  );
};

export default MyContextProvider;
