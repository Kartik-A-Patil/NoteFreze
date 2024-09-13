import SQLite, { SQLiteDatabase, Transaction, SQLError, ResultSet } from 'react-native-sqlite-storage';
import Aes from 'react-native-aes-crypto';

// Initialize the SQLite database
const db: SQLiteDatabase = SQLite.openDatabase({ name: 'notesDB.db', location: 'default' });

// Encryption key settings
const secretKey = process.env.EXPO_PUBLIC_SECRET_KEY;
const salt = process.env.EXPO_PUBLIC_SALT;
const keyCost = 5000;
const keyLength = 256; // AES-256 requires a 32-byte key (256 bits)

// Generate the encryption key
const generateKey = async (password: string, salt: string, cost: number, length: number): Promise<string> => {
  return Aes.pbkdf2(password, salt, cost, length, 'sha256');
};

// Encrypt data
const encryptData = async (text: string, key: string): Promise<{ cipher: string; iv: string }> => {
  const iv = await Aes.randomKey(16); // 16 bytes IV for AES
  const cipher = await Aes.encrypt(text, key, iv, 'aes-256-cbc');
  return { cipher, iv };
};

// Decrypt data
const decryptData = async (encryptedData: { cipher: string; iv: string }, key: string): Promise<string> => {
  return Aes.decrypt(encryptedData.cipher, key, encryptedData.iv, 'aes-256-cbc');
};

// Initialize the database
export const initDatabase = async (): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      db.transaction((tx: Transaction) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            title TEXT, 
            content TEXT, 
            title_iv TEXT,
            content_iv TEXT,
            isInBin INTEGER DEFAULT 0, 
            reminder INTEGER,
            notificationId TEXT 
          )`,
          [],
          () => {
            resolve();
          },
          (tx: Transaction, error: SQLError) => {
            console.error('Error creating notes table:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

export const saveNote = async (
  id: number | null,
  title: string | null,
  content: string | null,
  reminder: number | null,
  notificationId: string | null
): Promise<string> => {
  try {
    const key = await generateKey(secretKey, salt, keyCost, keyLength);

    // Encrypt title and content if they exist
    const encryptedTitle = title ? await encryptData(title, key) : null;
    const encryptedContent = content ? await encryptData(content, key) : null;

    if (id) {
      // Updating existing note
      let query = 'UPDATE notes SET ';
      const params: any[] = [];

      if (encryptedTitle) {
        query += 'title = ?, title_iv = ?, ';
        params.push(encryptedTitle.cipher, encryptedTitle.iv);
      }

      if (encryptedContent) {
        query += 'content = ?, content_iv = ?, ';
        params.push(encryptedContent.cipher, encryptedContent.iv);
      }

      query += 'reminder = ?, notificationId = ? WHERE id = ?';
      params.push(reminder, notificationId, id);

      // Remove trailing comma from SQL if either title or content was updated
      query = query.replace(', WHERE', ' WHERE');

      await executeQuery(query, params);
      return 'Note updated successfully';
    } else {
      // Inserting a new note
      let query = 'INSERT INTO notes (';
      const params: any[] = [];

      if (encryptedTitle) {
        query += 'title, title_iv, ';
        params.push(encryptedTitle.cipher, encryptedTitle.iv);
      }

      if (encryptedContent) {
        query += 'content, content_iv, ';
        params.push(encryptedContent.cipher, encryptedContent.iv);
      }

      query += 'reminder, notificationId) VALUES (';
      query += params.map(() => '?').join(', ') + ', ?, ?)';
      params.push(reminder, notificationId);

      await executeQuery(query, params);
      return 'Note created successfully';
    }
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
};



// Load all notes (not in bin) with decryption
export const loadNotes = async (): Promise<any[]> => {
  try {
    const key = await generateKey(secretKey, salt, keyCost, keyLength);

    const notes = await executeQuery('SELECT * FROM notes WHERE isInBin = 0');

    return Promise.all(notes.map(async (note) => {
      if (note.title) {
        note.title = await decryptData({ cipher: note.title, iv: note.title_iv }, key);
      }
      if (note.content) {
        note.content = await decryptData({ cipher: note.content, iv: note.content_iv }, key);
      }
      // Include notificationId when fetching notes
      note.notificationId = note.notificationId;
      return note;
    }));
  } catch (error) {
    console.error('Error loading notes:', error);
    throw error;
  }
};


// Load all notes in the bin with decryption
export const loadBinNotes = async (): Promise<any[]> => {
  try {
    const key = await generateKey(secretKey, salt, keyCost, keyLength);

    const notes = await executeQuery('SELECT * FROM notes WHERE isInBin = 1');

    // Decrypt the title and content of each note
    return Promise.all(notes.map(async (note) => {
      if (note.title) {
        note.title = await decryptData({ cipher: note.title, iv: note.title_iv }, key);
      }
      if (note.content) {
        note.content = await decryptData({ cipher: note.content, iv: note.content_iv }, key);
      }
      return note;
    }));
  } catch (error) {
    console.error('Error loading bin notes:', error);
    throw error;
  }
};


// Generic function to execute SQL queries
const executeQuery = <T = any>(query: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: Transaction) => {
      tx.executeSql(
        query,
        params,
        (_: Transaction, result: ResultSet) => resolve(result.rows.raw() as T[]),
        (_: Transaction, error: SQLError) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

// Get a note by ID with decryption
export const getNoteById = async (noteId: number): Promise<any | null> => {
  try {
    const key = await generateKey(secretKey, salt, keyCost, keyLength);

    const notes = await executeQuery<any>(
      'SELECT * FROM notes WHERE id = ? LIMIT 1',
      [noteId]
    );
    const note = notes[0];
    if (note) {
      note.title = note.title ? await decryptData({ cipher: note.title, iv: note.title_iv }, key) : null;
      note.content = note.content ? await decryptData({ cipher: note.content, iv: note.content_iv }, key) : null;
    }
    return note;
  } catch (error) {
    console.error('Error getting note by ID:', error);
    throw error;
  }
};


// Empty the bin completely
export const emptyBinCompletely = async (): Promise<string> => {
  try {
    await executeQuery('DELETE FROM notes WHERE isInBin = 1');
    return 'Bin emptied completely';
  } catch (error) {
    console.error('Error emptying bin:', error);
    throw error;
  }
};

// Copy a note
export const handleNoteCopy = async (noteId: number): Promise<string> => {
  try {
    const [existingNote] = await executeQuery('SELECT * FROM notes WHERE id = ?', [noteId]);
    if (existingNote) {
      await executeQuery(
        'INSERT INTO notes (title, content, title_iv, content_iv, reminder) VALUES (?, ?, ?, ?, ?)',
        [existingNote.title, existingNote.content, existingNote.title_iv, existingNote.content_iv, existingNote.reminder]
      );
      return 'Note copied successfully';
    }
    throw new Error('Note not found');
  } catch (error) {
    console.error('Error copying note:', error);
    throw error;
  }
};

// Add a reminder to a note
export const addReminder = async (noteId: number, reminderTime: number): Promise<string> => {
  try {
    await executeQuery('UPDATE notes SET reminder = ? WHERE id = ?', [reminderTime, noteId]);
    return 'Reminder added';
  } catch (error) {
    console.error('Error adding reminder:', error);
    throw error;
  }
};

// Remove a reminder from a note
export const removeReminder = async (noteId: number): Promise<string> => {
  try {
    await executeQuery('UPDATE notes SET reminder = NULL WHERE id = ?', [noteId]);
    return 'Reminder removed';
  } catch (error) {
    console.error('Error removing reminder:', error);
    throw error;
  }
};
// Move multiple notes to the bin
export const moveMultipleToBin = async (noteIds: number[]): Promise<string> => {
  try {
    if (noteIds.length === 0) {
      return 'No notes to move';
    }

    // Create a placeholder for the SQL query
    const placeholders = noteIds.map(() => '?').join(', ');

    // Execute the query to update multiple notes
    await executeQuery(
      `UPDATE notes SET isInBin = 1 WHERE id IN (${placeholders})`,
      noteIds
    );

    return 'Notes moved to bin successfully';
  } catch (error) {
    console.error('Error moving multiple notes to bin:', error);
    throw error;
  }
};
export const restoreMultipleFromBin = async (noteIds: number[]): Promise<string> => {
  try {
    if (noteIds.length === 0) {
      return 'No notes to restore';
    }

    // Create a placeholder for the SQL query
    const placeholders = noteIds.map(() => '?').join(', ');

    // Execute the query to update multiple notes
    await executeQuery(
      `UPDATE notes SET isInBin = 0 WHERE id IN (${placeholders})`,
      noteIds
    );

    return 'Notes restored from bin successfully';
  } catch (error) {
    console.error('Error restoring multiple notes from bin:', error);
    throw error;
  }
};

export const deleteMultipleNotes = async (noteIds: number[]): Promise<string> => {
  try {
    if (noteIds.length === 0) {
      return 'No notes to delete';
    }

    const placeholders = noteIds.map(() => '?').join(', ');

    await executeQuery(
      `DELETE FROM notes WHERE id IN (${placeholders})`,
      noteIds
    );

    return 'Multiple notes deleted successfully';
  } catch (error) {
    console.error('Error deleting multiple notes:', error);
    throw error;
  }
};
export const restoreAllFromBin = async (): Promise<string> => {
  try {
    // Update all notes in the bin to restore them
    await executeQuery('UPDATE notes SET isInBin = 0 WHERE isInBin = 1');

    return 'All notes restored from bin successfully';
  } catch (error) {
    console.error('Error restoring all notes from bin:', error);
    throw error;
  }
};
export const deleteAllInBin = async (): Promise<string> => {
  try {
    // Delete all notes that are in the bin
    await executeQuery('DELETE FROM notes WHERE isInBin = 1');

    return 'All notes permanently deleted from bin successfully';
  } catch (error) {
    console.error('Error deleting all notes from bin:', error);
    throw error;
  }
};
