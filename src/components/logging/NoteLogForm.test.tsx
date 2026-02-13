import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NoteLogForm } from './NoteLogForm';

// Mock useRecords hook
const mockAddRecord = vi.fn(() => Promise.resolve());
const mockUpdateRecord = vi.fn(() => Promise.resolve());
const mockDeleteRecord = vi.fn(() => Promise.resolve());

vi.mock('../../hooks/useRecords', () => ({
  useRecords: () => ({
    addRecord: mockAddRecord,
    updateRecord: mockUpdateRecord,
    deleteRecord: mockDeleteRecord,
  }),
}));

// Mock logger
vi.mock('../../lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('NoteLogForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    date: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the form when isOpen is true', () => {
      render(<NoteLogForm {...defaultProps} />);

      expect(screen.getByText('Add Note')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should not render content when isOpen is false', () => {
      render(<NoteLogForm {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Add Note')).not.toBeInTheDocument();
    });

    it('should display the date label', () => {
      const testDate = new Date('2024-03-15').getTime();
      render(<NoteLogForm {...defaultProps} date={testDate} />);

      expect(screen.getByText('March 15, 2024')).toBeInTheDocument();
    });

    it('should display a text area for the note', () => {
      render(<NoteLogForm {...defaultProps} />);

      expect(screen.getByPlaceholderText('Write your note...')).toBeInTheDocument();
    });
  });

  describe('save button state', () => {
    it('should disable Save button when note content is empty', () => {
      render(<NoteLogForm {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeDisabled();
    });

    it('should enable Save button when note content is entered', () => {
      render(<NoteLogForm {...defaultProps} />);

      const noteInput = screen.getByPlaceholderText('Write your note...');
      fireEvent.change(noteInput, { target: { value: 'My test note' } });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).not.toBeDisabled();
    });

    it('should disable Save button for whitespace-only content', () => {
      render(<NoteLogForm {...defaultProps} />);

      const noteInput = screen.getByPlaceholderText('Write your note...');
      fireEvent.change(noteInput, { target: { value: '   ' } });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('form submission', () => {
    it('should call addRecord when saving a new note', async () => {
      render(<NoteLogForm {...defaultProps} />);

      // Enter note content
      const noteInput = screen.getByPlaceholderText('Write your note...');
      fireEvent.change(noteInput, { target: { value: 'My test note' } });

      // Click save
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddRecord).toHaveBeenCalledWith({
          type: 'note',
          data: expect.objectContaining({
            content: 'My test note',
          }),
          tags: [],
        });
      });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call updateRecord when editing an existing note', async () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          content: 'Original note',
        },
      };

      render(<NoteLogForm {...defaultProps} existingRecord={existingRecord} />);

      // Change the content
      const noteInput = screen.getByPlaceholderText('Write your note...');
      fireEvent.change(noteInput, { target: { value: 'Updated note' } });

      // Click save
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRecord).toHaveBeenCalledWith(
          'test-id',
          expect.objectContaining({
            data: expect.objectContaining({
              content: 'Updated note',
            }),
          })
        );
      });
    });

    it('should trim whitespace from note content', async () => {
      render(<NoteLogForm {...defaultProps} />);

      const noteInput = screen.getByPlaceholderText('Write your note...');
      fireEvent.change(noteInput, { target: { value: '  My test note  ' } });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddRecord).toHaveBeenCalledWith({
          type: 'note',
          data: expect.objectContaining({
            content: 'My test note',
          }),
          tags: [],
        });
      });
    });
  });

  describe('delete functionality', () => {
    it('should not show Delete button for new notes', () => {
      render(<NoteLogForm {...defaultProps} />);

      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('should show Delete button for existing notes', () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          content: 'Test note',
        },
      };

      render(<NoteLogForm {...defaultProps} existingRecord={existingRecord} />);

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should call deleteRecord when Delete is clicked', async () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          content: 'Test note',
        },
      };

      render(<NoteLogForm {...defaultProps} existingRecord={existingRecord} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteRecord).toHaveBeenCalledWith('test-id');
      });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('cancel functionality', () => {
    it('should call onClose when Cancel is clicked', () => {
      render(<NoteLogForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('existing record initialization', () => {
    it('should pre-populate form with existing note content', () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          content: 'Existing note content',
        },
      };

      render(<NoteLogForm {...defaultProps} existingRecord={existingRecord} />);

      const noteInput = screen.getByPlaceholderText('Write your note...');
      expect(noteInput).toHaveValue('Existing note content');
    });
  });
});
