import { executeQuery } from './db';

export interface Tag {
  id: number;
  name: string;
  color: string;
}

// Get all tags
export const getAllTags = async (): Promise<Tag[]> => {
  try {
    return await executeQuery<Tag>('SELECT * FROM tags ORDER BY name');
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

// Get a tag by ID
export const getTagById = async (id: number): Promise<Tag | null> => {
  try {
    const result = await executeQuery<Tag>('SELECT * FROM tags WHERE id = ?', [id]);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Error fetching tag by ID:', error);
    return null;
  }
};

// Add a new tag
export const addTag = async (name: string, color: string = '#444444'): Promise<number> => {
  try {
    await executeQuery('INSERT INTO tags (name, color) VALUES (?, ?)', [name, color]);
    const result = await executeQuery<{id: number}>('SELECT last_insert_rowid() as id');
    return result[0].id;
  } catch (error) {
    console.error('Error adding tag:', error);
    throw error;
  }
};

// Update a tag
export const updateTag = async (id: number, name: string, color: string): Promise<void> => {
  try {
    await executeQuery('UPDATE tags SET name = ?, color = ? WHERE id = ?', [name, color, id]);
  } catch (error) {
    console.error('Error updating tag:', error);
    throw error;
  }
};

// Delete a tag
export const deleteTag = async (id: number): Promise<void> => {
  try {
    // First delete tag associations with notes
    await executeQuery('DELETE FROM note_tags WHERE tag_id = ?', [id]);
    // Then delete the tag
    await executeQuery('DELETE FROM tags WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
};

// Get all notes that have a specific tag
export const getNotesWithTag = async (tagId: number): Promise<number[]> => {
  try {
    const results = await executeQuery<{note_id: number}>(
      'SELECT note_id FROM note_tags WHERE tag_id = ?', 
      [tagId]
    );
    return results.map(row => row.note_id);
  } catch (error) {
    console.error('Error fetching notes with tag:', error);
    return [];
  }
};
