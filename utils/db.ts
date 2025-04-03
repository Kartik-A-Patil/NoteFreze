import SQLite, { SQLiteDatabase, Transaction, SQLError, ResultSet } from 'react-native-sqlite-storage';
import Aes from 'react-native-aes-crypto';

// Initialize the SQLite database
const db: SQLiteDatabase = SQLite.openDatabase({ name: 'notesDB.db', location: 'default' });

// Encryption key settings
const secretKey =  'jaje354weu3rdwd*&#^';
const salt = 'jkasd90s2erww&$%@!#';
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

// Initialize the database - add color column to tags
export const initDatabase = async (): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      db.transaction((tx: Transaction) => {
        // Create notes table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            title TEXT, 
            content TEXT, 
            title_iv TEXT,
            content_iv TEXT,
            isInBin INTEGER DEFAULT 0, 
            reminder INTEGER,
            notificationId TEXT,
            isLocked INTEGER DEFAULT 0
          )`,
          [],
          () => {
            // Create tags table
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                color TEXT DEFAULT '#444444'
              )`,
              [],
              () => {
                // Create note_tags junction table
                tx.executeSql(
                  `CREATE TABLE IF NOT EXISTS note_tags (
                    note_id INTEGER,
                    tag_id INTEGER,
                    PRIMARY KEY (note_id, tag_id),
                    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
                    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                  )`,
                  [],
                  () => {
                    // Check if color column exists in tags table, add if missing
                    tx.executeSql(
                      "PRAGMA table_info(tags)",
                      [],
                      (_, result) => {
                        const columns = result.rows.raw();
                        const hasColorColumn = columns.some(col => col.name === 'color');
                        
                        if (!hasColorColumn) {
                          tx.executeSql(
                            "ALTER TABLE tags ADD COLUMN color TEXT DEFAULT '#444444'",
                            [],
                            () => { resolve(); },
                            (tx, error) => {
                              console.error("Error adding color column:", error);
                              reject(error);
                              return false;
                            }
                          );
                        } else {
                          resolve();
                        }
                      },
                      (tx, error) => {
                        console.error("Error checking table schema:", error);
                        reject(error);
                        return false;
                      }
                    );
                  },
                  (tx: Transaction, error: SQLError) => {
                    console.error('Error creating note_tags table:', error);
                    reject(error);
                    return false;
                  }
                );
              },
              (tx: Transaction, error: SQLError) => {
                console.error('Error creating tags table:', error);
                reject(error);
                return false;
              }
            );
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

// Add a cache for decrypted notes
let noteCache: Record<number, any> = {};

// Clear cache function for when settings might change
export const clearNoteCache = () => {
  noteCache = {};
};

// Clear a single note from cache
export const clearNoteCacheItem = (noteId: number) => {
  if (noteCache[noteId]) {
    delete noteCache[noteId];
  }
};

export const saveNote = async (
  id: number | null,
  title: string | null,
  content: string | null,
  reminder: number | null,
  notificationId: string | null,
  isLocked: boolean = false,
  tagIds: number[] = [] // Changed from tags array to tagIds array
): Promise<number> => {
  // Add a lock to prevent concurrent saves of the same note
  const lockKey = id ? `note_lock_${id}` : 'new_note_lock';
  
  if (globalSaveLocks[lockKey]) {
    console.log('Note is already being saved, skipping duplicate save');
    return id || -1; // Return existing ID or -1 for unsaved new note
  }
  
  globalSaveLocks[lockKey] = true;
  
  try {
    // Generate key once for both title and content encryption
    const key = await generateKey(secretKey, salt, keyCost, keyLength);
    
    // Prepare encrypted data outside of the transaction for better performance
    const encryptedTitle = title ? await encryptData(title, key) : null;
    const encryptedContent = content ? await encryptData(content, key) : null;

    let noteId: number;

    // Clear cache for this note before saving
    if (id) {
      clearNoteCacheItem(id);
    }

    // Use a database transaction to ensure either all operations succeed or all fail
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
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

            query += 'reminder = ?, notificationId = ?, isLocked = ? WHERE id = ?';
            params.push(reminder, notificationId, isLocked ? 1 : 0, id);

            // Remove trailing comma from SQL if either title or content was updated
            query = query.replace(', WHERE', ' WHERE');

            tx.executeSql(
              query,
              params,
              () => {
                noteId = id;
                
                // First clear existing tags in the same transaction
                tx.executeSql(
                  'DELETE FROM note_tags WHERE note_id = ?',
                  [noteId],
                  () => {
                    // Ensure we're working with unique tag IDs
                    const uniqueTagIds = [...new Set(tagIds)];
                    
                    if (uniqueTagIds.length > 0) {
                      // Add each tag association in the same transaction
                      const insertTagPromises = uniqueTagIds.map(tagId => {
                        return new Promise<void>((resolveTag, rejectTag) => {
                          tx.executeSql(
                            'INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)',
                            [noteId, tagId],
                            () => resolveTag(),
                            (_, error) => {
                              console.error('Error inserting tag association:', error);
                              rejectTag(error);
                              return false;
                            }
                          );
                        });
                      });
                      
                      // All tag insertions completed
                      Promise.all(insertTagPromises)
                        .then(() => resolve(noteId))
                        .catch(error => reject(error));
                    } else {
                      resolve(noteId);
                    }
                  },
                  (_, error) => {
                    console.error('Error clearing tags:', error);
                    reject(error);
                    return false;
                  }
                );
              },
              (_, error) => {
                console.error('Error updating note:', error);
                reject(error);
                return false;
              }
            );
          } else {
            // Inserting a new note - similar logic as above
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

            query += 'reminder, notificationId, isLocked) VALUES (';
            query += params.map(() => '?').join(', ') + ', ?, ?, ?)';
            params.push(reminder, notificationId, isLocked ? 1 : 0);

            // Execute the query and get the last inserted ID
            tx.executeSql(
              query,
              params,
              () => {
                // Get the ID of the inserted note
                tx.executeSql(
                  'SELECT last_insert_rowid() as id',
                  [],
                  (_, result) => {
                    noteId = result.rows.item(0).id;
                    
                    // Ensure we're working with unique tag IDs
                    const uniqueTagIds = [...new Set(tagIds)];
                    
                    if (uniqueTagIds.length > 0) {
                      // Add each tag association in the same transaction
                      const insertTagPromises = uniqueTagIds.map(tagId => {
                        return new Promise<void>((resolveTag, rejectTag) => {
                          tx.executeSql(
                            'INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)', [noteId, tagId],
                            () => resolveTag(),
                            (_, error) => {
                              console.error('Error inserting tag association:', error);
                              rejectTag(error);
                              return false;
                            }
                          );
                        });
                      });
                      
                      // All tag insertions completed
                      Promise.all(insertTagPromises)
                        .then(() => resolve(noteId))
                        .catch(error => reject(error));
                    } else {
                      resolve(noteId);
                    }
                  },
                  (_, error) => {
                    console.error('Error getting last insert ID:', error);
                    reject(error);
                    return false;
                  }
                );
              },
              (_, error) => {
                console.error('Error inserting note:', error);
                reject(error);
                return false;
              }
            );
          }
        },
        (error) => {
          console.error('Transaction error:', error);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  } finally {
    // Release the lock
    delete globalSaveLocks[lockKey];
  }
};

// Global lock object to prevent concurrent saves
const globalSaveLocks: Record<string, boolean> = {};

// Add tag-related functions

// New function to update note tags using just tag IDs
export const updateNoteTagIds = async (noteId: number, tagIds: number[]): Promise<void> => {
  try {
    // First clear existing tags
    await executeQuery('DELETE FROM note_tags WHERE note_id = ?', [noteId]);
    
    // If no tags, just return
    if (tagIds.length === 0) return;
    
    // Ensure tag IDs are unique
    const uniqueTagIds = [...new Set(tagIds)];
    
    // Add each tag association
    for (const tagId of uniqueTagIds) {
      await executeQuery('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)', [noteId, tagId]);
    }
    
    // Clear the note from cache to refresh tag data
    clearNoteCacheItem(noteId);
  } catch (error) {
    console.error('Error updating note tags:', error);
    throw error;
  }
};

// For backward compatibility, keep updateNoteTags but refactor internally
export const updateNoteTags = async (noteId: number, tags: Array<{name: string, color: string}>): Promise<void> => {
  try {
    // First clear existing tags
    await executeQuery('DELETE FROM note_tags WHERE note_id = ?', [noteId]);
    
    // If no tags, just return
    if (tags.length === 0) return;
    
    // Process each tag
    for (const tag of tags) {
      // Check if tag exists
      const existingTags = await executeQuery('SELECT id, color FROM tags WHERE name = ?', [tag.name]);
      let tagId: number;
      
      if (existingTags.length === 0) {
        // Create new tag with color
        await executeQuery('INSERT INTO tags (name, color) VALUES (?, ?)', [tag.name, tag.color]);
        const newTagResult = await executeQuery('SELECT last_insert_rowid() as id');
        tagId = newTagResult[0].id;
      } else {
        tagId = existingTags[0].id;
        
        // Update color if it changed
        if (existingTags[0].color !== tag.color) {
          await executeQuery('UPDATE tags SET color = ? WHERE id = ?', [tag.color, tagId]);
        }
      }
      
      // Link tag to note
      await executeQuery('INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)', [noteId, tagId]);
    }
  } catch (error) {
    console.error('Error updating note tags:', error);
    throw error;
  }
};

// Get tag IDs for a specific note
export const getNoteTagIdsById = async (noteId: number): Promise<number[]> => {
  try {
    const result = await executeQuery(
      'SELECT tag_id FROM note_tags WHERE note_id = ?', 
      [noteId]
    );
    
    return result.map(item => item.tag_id);
  } catch (error) {
    console.error('Error getting tag IDs for note:', error);
    return [];
  }
};

// Modified to return tag IDs and tag details
export const getNoteTagsById = async (noteId: number): Promise<Array<{id: number, name: string, color: string}>> => {
  try {
    const result = await executeQuery(`
      SELECT t.id, t.name, t.color
      FROM tags t
      INNER JOIN note_tags nt ON t.id = nt.tag_id
      WHERE nt.note_id = ?
    `, [noteId]);
    
    return result.map(tag => ({ 
      id: tag.id,
      name: tag.name, 
      color: tag.color || '#444444' 
    }));
  } catch (error) {
    console.error('Error getting tags for note:', error);
    return [];
  }
};

// Get all unique tags
export const getAllTags = async (): Promise<Array<{id: number, name: string, color: string}>> => {
  try {
    const result = await executeQuery(`
      SELECT id, name, color FROM tags
      ORDER BY name
    `);
    
    return result.map(tag => ({ 
      id: tag.id,
      name: tag.name, 
      color: tag.color || '#444444' 
    }));
  } catch (error) {
    console.error('Error getting all tags:', error);
    return [];
  }
};

// Load all notes (not in bin) with decryption - Optimized version
export const loadNotes = async (): Promise<any[]> => {
  try {
    const key = await generateKey(secretKey, salt, keyCost, keyLength);

    // Get all notes and their tags in a single query with JOIN
    const notes = await executeQuery(`
      SELECT n.*, GROUP_CONCAT(t.id) as tag_ids, 
             GROUP_CONCAT(t.name) as tag_names, 
             GROUP_CONCAT(t.color) as tag_colors
      FROM notes n
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
      WHERE n.isInBin = 0
      GROUP BY n.id
    `);
    
    const processedNotes = await Promise.all(notes.map(async (note) => {
      // Check if we have a cached version
      if (noteCache[note.id] && note.isLocked !== 1) {
        return noteCache[note.id];
      }
      
      // Skip decryption for locked notes
      if (note.isLocked === 1) {
        note.isEncrypted = true;
        
        // Process tags
        note.tags = processTagsFromJoin(note);
        
        return note;
      }
      
      try {
        if (note.title && note.title_iv) {
          note.title = await decryptData({ cipher: note.title, iv: note.title_iv }, key);
        } else {
          note.title = "";
        }
        
        if (note.content && note.content_iv) {
          note.content = await decryptData({ cipher: note.content, iv: note.content_iv }, key);
        } else {
          note.content = "";
        }
        
        // Process tags from the JOIN result
        note.tags = processTagsFromJoin(note);
        
        // Cache the decrypted note
        noteCache[note.id] = { ...note };
        
        return note;
      } catch (error) {
        console.error('Error decrypting note:', note.id, error);
        // Set defaults if decryption fails
        if (!note.title) note.title = "";
        if (!note.content) note.content = "";
        
        // Process tags
        note.tags = processTagsFromJoin(note);
        
        return note;
      }
    }));
    
    return processedNotes;
  } catch (error) {
    console.error('Error loading notes:', error);
    throw error;
  }
};

// Helper function to process tags from JOIN results
function processTagsFromJoin(note: any): Array<{id: number, name: string, color: string}> {
  if (!note.tag_ids) return [];
  
  const ids = note.tag_ids.split(',');
  const names = note.tag_names.split(',');
  const colors = note.tag_colors.split(',');
  
  const tags = [];
  for (let i = 0; i < ids.length; i++) {
    if (ids[i]) {  // Skip empty entries
      tags.push({
        id: parseInt(ids[i]),
        name: names[i],
        color: colors[i] || '#444444'
      });
    }
  }
  
  return tags;
}

// Load all notes in the bin with decryption
export const loadBinNotes = async (): Promise<any[]> => {
  try {
    const key = await generateKey(secretKey, salt, keyCost, keyLength);

    const notes = await executeQuery('SELECT * FROM notes WHERE isInBin = 1');

    // Decrypt the title and content of each note
    return Promise.all(notes.map(async (note) => {
      // Skip decryption for locked notes
      if (note.isLocked === 1) {
        // Keep the encrypted content but add a flag
        note.isEncrypted = true;
        return note;
      }
      
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
export const executeQuery = <T = any>(query: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: Transaction) => {
      tx.executeSql(
        query,
        params,
        (_: Transaction, result: ResultSet) => {
          resolve(result.rows.raw() as T[]);
        },
        (_: Transaction, error: SQLError) => {
          reject(error);
          return false;
        }
      );
    });
  });
};

// Get a note by ID with decryption and caching
export const getNoteById = async (noteId: number, forceDecrypt: boolean = false): Promise<any | null> => {
  try {
    // Always clear the cache for locked notes when forcing decryption
    if (forceDecrypt) {
      clearNoteCacheItem(noteId);
    }
    
    // Check cache first unless decryption is forced
    if (!forceDecrypt && noteCache[noteId]) {
      return { ...noteCache[noteId] }; // Return a copy of the cached note
    }

    const key = await generateKey(secretKey, salt, keyCost, keyLength);

    const notes = await executeQuery<any>(
      'SELECT * FROM notes WHERE id = ? LIMIT 1',
      [noteId]
    );
    
    if (!notes || notes.length === 0) {
      return null;
    }
    
    const note = notes[0];
    
    if (note) {
      // Make sure we set this flag correctly before any other processing
      note.isLocked = note.isLocked === 1;
      
      // Only decrypt if not locked or forceDecrypt is true
      if (!note.isLocked || forceDecrypt) {
        try {
          // Make sure both cipher and iv exist before attempting decryption
          if (note.title && note.title_iv) {
            note.title = await decryptData({ cipher: note.title, iv: note.title_iv }, key);
          } else {
            note.title = "";
          }
          
          if (note.content && note.content_iv) {
            note.content = await decryptData({ cipher: note.content, iv: note.content_iv }, key);
          } else {
            note.content = "";
          }

          // Get tags for this note - use the dedicated tag retrieval function
          note.tags = await getNoteTagsById(noteId);
          
          // Cache the decrypted note
          noteCache[noteId] = { ...note };
          
          // Clear the encryption flag
          note.isEncrypted = false;
        } catch (decryptError) {
          console.error('Error decrypting note data:', decryptError);
          // If decryption fails, set default values instead of null
          if (!note.title) note.title = "";
          if (!note.content) note.content = "";
          
          // Set the encryption flag to indicate content is still encrypted
          note.isEncrypted = true;
        }
      } else {
        // For locked notes, mark as encrypted
        note.isEncrypted = true;
        
        // Get tags even for locked notes - it's safe to show tags
        note.tags = await getNoteTagsById(noteId);
      }
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

    // Get all notification IDs associated with these notes before moving to bin
    const placeholders = noteIds.map(() => '?').join(', ');
    const notesWithReminders = await executeQuery(
      `SELECT id, notificationId FROM notes WHERE id IN (${placeholders}) AND notificationId IS NOT NULL`,
      noteIds
    );
    
    // Return the notification IDs for cancellation outside this function
    const notificationIds = notesWithReminders
      .filter(note => note.notificationId)
      .map(note => note.notificationId);

    // Execute the query to update multiple notes and clear their reminders
    await executeQuery(
      `UPDATE notes SET isInBin = 1, reminder = NULL, notificationId = NULL WHERE id IN (${placeholders})`,
      noteIds
    );

    return notificationIds;
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

    // Get all notification IDs associated with these notes before deletion
    const placeholders = noteIds.map(() => '?').join(', ');
    const notesWithReminders = await executeQuery(
      `SELECT id, notificationId FROM notes WHERE id IN (${placeholders}) AND notificationId IS NOT NULL`,
      noteIds
    );
    
    // Return the notification IDs for cancellation outside this function
    const notificationIds = notesWithReminders
      .filter(note => note.notificationId)
      .map(note => note.notificationId);

    // Now delete the notes
    await executeQuery(
      `DELETE FROM notes WHERE id IN (${placeholders})`,
      noteIds
    );

    return notificationIds;
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

// Add a new function to toggle lock status
export const toggleNoteLock = async (noteId: number, isLocked: boolean): Promise<string> => {
  try {
    await executeQuery('UPDATE notes SET isLocked = ? WHERE id = ?', [isLocked ? 1 : 0, noteId]);
    
    // Clear this note from cache to prevent showing decrypted content after locking
    // or showing encrypted content after unlocking
    clearNoteCacheItem(noteId);
    
    return isLocked ? 'Note locked successfully' : 'Note unlocked successfully';
  } catch (error) {
    console.error('Error toggling note lock status:', error);
    throw error;
  }
};

// Function to delete a tag entirely from the system
export const deleteTag = async (tagName: string): Promise<void> => {
  try {
    // Get the tag ID
    const tagResult = await executeQuery('SELECT id FROM tags WHERE name = ?', [tagName]);
    
    if (tagResult.length === 0) return;
    
    const tagId = tagResult[0].id;
    
    // First delete all associations with notes
    await executeQuery('DELETE FROM note_tags WHERE tag_id = ?', [tagId]);
    
    // Then delete the tag itself
    await executeQuery('DELETE FROM tags WHERE id = ?', [tagId]);
  } catch (error) {
    console.error(`Error deleting tag ${tagName}:`, error);
    throw error;
  }
};

// Function to merge two tags - will rename all occurrences of oldTag to newTag
export const mergeTags = async (oldTag: string, newTag: string): Promise<void> => {
  try {
    // Check if old tag exists
    const oldTagResult = await executeQuery('SELECT id FROM tags WHERE name = ?', [oldTag]);
    if (oldTagResult.length === 0) return;
    
    // Check if new tag exists, if not create it
    let newTagId: number;
    const newTagResult = await executeQuery('SELECT id FROM tags WHERE name = ?', [newTag]);
    
    if (newTagResult.length === 0) {
      await executeQuery('INSERT INTO tags (name) VALUES (?)', [newTag]);
      const newTagIdResult = await executeQuery('SELECT last_insert_rowid() as id');
      newTagId = newTagIdResult[0].id;
    } else {
      newTagId = newTagResult[0].id;
    }
    
    const oldTagId = oldTagResult[0].id;
    
    // Find all note IDs associated with old tag
    const notesWithOldTag = await executeQuery(
      'SELECT note_id FROM note_tags WHERE tag_id = ?',
      [oldTagId]
    );
    
    // For each note with old tag, add new tag if it doesn't exist
    for (const { note_id } of notesWithOldTag) {
      // Check if note already has new tag
      const existingAssociation = await executeQuery(
        'SELECT * FROM note_tags WHERE note_id = ? AND tag_id = ?',
        [note_id, newTagId]
      );
      
      // If note doesn't have new tag yet, add it
      if (existingAssociation.length === 0) {
        await executeQuery(
          'INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)',
          [note_id, newTagId]
        );
      }
    }
    
    // Delete all associations with old tag
    await executeQuery('DELETE FROM note_tags WHERE tag_id = ?', [oldTagId]);
    
    // Delete the old tag
    await executeQuery('DELETE FROM tags WHERE id = ?', [oldTagId]);
  } catch (error) {
    console.error(`Error merging tags ${oldTag} to ${newTag}:`, error);
    throw error;
  }
};
