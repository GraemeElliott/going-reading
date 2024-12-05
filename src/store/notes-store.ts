import { defineStore } from 'pinia';
import { supabase } from '@/supabase/supabase';
import { handleError } from './error-handler';
import { toast } from '@/components/ui/toast';

export interface Note {
  id: string;
  user_id: string;
  book_id: string;
  title: string | null;
  note: string;
  created_at: string;
  updated_at: string;
}

interface NotesState {
  notesByBookId: Record<string, Note[]>;
  loading: boolean;
  error: string | null;
}

export const useNotesStore = defineStore({
  id: 'notes',

  state: (): NotesState => ({
    notesByBookId: {},
    loading: false,
    error: null,
  }),

  getters: {
    getNotesForBook: (state) => (bookId: string) => {
      return state.notesByBookId[bookId] || [];
    },
  },

  actions: {
    async fetchBookNotes(bookId: string) {
      try {
        this.loading = true;
        const { data, error } = await supabase
          .from('book_notes')
          .select('*')
          .eq('book_id', bookId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching notes:', error);
          throw error;
        }

        // Store notes for this book ID
        this.notesByBookId[bookId] = data || [];
      } catch (error) {
        handleError(error, 'Failed to fetch book notes');
      } finally {
        this.loading = false;
      }
    },

    async createNote(
      bookId: string,
      noteText: string,
      title: string | null = null
    ) {
      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) throw userError;

        if (!userData.user) {
          throw new Error('No authenticated user found');
        }

        const { data, error } = await supabase
          .from('book_notes')
          .insert([
            {
              book_id: bookId,
              user_id: userData.user.id,
              title: title,
              note: noteText,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error('Error creating note:', error);
          throw error;
        }

        if (!data) {
          throw new Error('No data returned from insert');
        }

        // Initialize the array if it doesn't exist
        if (!this.notesByBookId[bookId]) {
          this.notesByBookId[bookId] = [];
        }

        // Add the new note to the start of the array
        this.notesByBookId[bookId].unshift(data);

        toast({
          title: 'Note added',
          description: 'Your note has been saved successfully.',
          variant: 'success',
          duration: 3000,
        });

        return data;
      } catch (error) {
        console.error('Error in createNote:', error);
        handleError(error, 'Failed to create note');
        throw error;
      }
    },

    async updateNote(
      noteId: string,
      noteText: string,
      title: string | null = null
    ) {
      try {
        const { data, error } = await supabase
          .from('book_notes')
          .update({ note: noteText, title: title })
          .eq('id', noteId)
          .select()
          .single();

        if (error) {
          console.error('Error updating note:', error);
          throw error;
        }

        // Update the note in the correct book's notes array
        const bookId = data.book_id;
        const notes = this.notesByBookId[bookId] || [];
        const index = notes.findIndex((note) => note.id === noteId);
        if (index !== -1) {
          notes[index] = data;
        }

        toast({
          title: 'Note updated',
          description: 'Your note has been updated successfully.',
          variant: 'success',
          duration: 3000,
        });

        return data;
      } catch (error) {
        console.error('Error in updateNote:', error);
        handleError(error, 'Failed to update note');
        throw error;
      }
    },

    async deleteNote(noteId: string, bookId: string) {
      try {
        const { error } = await supabase
          .from('book_notes')
          .delete()
          .eq('id', noteId);

        if (error) {
          console.error('Error deleting note:', error);
          throw error;
        }

        // Remove the note from the correct book's notes array
        if (this.notesByBookId[bookId]) {
          this.notesByBookId[bookId] = this.notesByBookId[bookId].filter(
            (note) => note.id !== noteId
          );
        }

        toast({
          title: 'Note deleted',
          description: 'Your note has been deleted successfully.',
          variant: 'success',
          duration: 3000,
        });
      } catch (error) {
        console.error('Error in deleteNote:', error);
        handleError(error, 'Failed to delete note');
        throw error;
      }
    },
  },
});
