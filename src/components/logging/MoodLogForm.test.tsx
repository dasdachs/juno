import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MoodLogForm } from './MoodLogForm';

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

describe('MoodLogForm', () => {
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
      render(<MoodLogForm {...defaultProps} />);

      expect(screen.getByText('Log Mood')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should not render content when isOpen is false', () => {
      render(<MoodLogForm {...defaultProps} isOpen={false} />);

      // BottomSheet should hide content when closed
      expect(screen.queryByText('Log Mood')).not.toBeInTheDocument();
    });

    it('should display the date label', () => {
      const testDate = new Date('2024-03-15').getTime();
      render(<MoodLogForm {...defaultProps} date={testDate} />);

      expect(screen.getByText('March 15, 2024')).toBeInTheDocument();
    });
  });

  describe('save button state', () => {
    it('should disable Save button when no moods are selected', () => {
      render(<MoodLogForm {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeDisabled();
    });

    it('should enable Save button when moods are selected', () => {
      render(<MoodLogForm {...defaultProps} />);

      // Click on a mood button to select it
      const happyMood = screen.getByText('Happy');
      fireEvent.click(happyMood);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('form submission', () => {
    it('should call addRecord when saving a new mood log', async () => {
      render(<MoodLogForm {...defaultProps} />);

      // Select a mood
      const happyMood = screen.getByText('Happy');
      fireEvent.click(happyMood);

      // Click save
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddRecord).toHaveBeenCalledWith({
          type: 'mood',
          data: expect.objectContaining({
            moods: ['happy'],
          }),
          tags: [],
        });
      });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call updateRecord when editing an existing record', async () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          moods: ['calm' as const],
        },
      };

      render(<MoodLogForm {...defaultProps} existingRecord={existingRecord} />);

      // Select an additional mood
      const happyMood = screen.getByText('Happy');
      fireEvent.click(happyMood);

      // Click save
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRecord).toHaveBeenCalledWith(
          'test-id',
          expect.objectContaining({
            data: expect.objectContaining({
              moods: expect.arrayContaining(['calm', 'happy']),
            }),
          })
        );
      });
    });
  });

  describe('delete functionality', () => {
    it('should not show Delete button for new records', () => {
      render(<MoodLogForm {...defaultProps} />);

      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('should show Delete button for existing records', () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          moods: ['calm' as const],
        },
      };

      render(<MoodLogForm {...defaultProps} existingRecord={existingRecord} />);

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should call deleteRecord when Delete is clicked', async () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          moods: ['calm' as const],
        },
      };

      render(<MoodLogForm {...defaultProps} existingRecord={existingRecord} />);

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
      render(<MoodLogForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('notes field', () => {
    it('should allow entering notes', () => {
      render(<MoodLogForm {...defaultProps} />);

      const notesInput = screen.getByPlaceholderText('Any additional notes...');
      fireEvent.change(notesInput, { target: { value: 'Test note' } });

      expect(notesInput).toHaveValue('Test note');
    });

    it('should include notes in saved data', async () => {
      render(<MoodLogForm {...defaultProps} />);

      // Select a mood
      const happyMood = screen.getByText('Happy');
      fireEvent.click(happyMood);

      // Enter notes
      const notesInput = screen.getByPlaceholderText('Any additional notes...');
      fireEvent.change(notesInput, { target: { value: 'Test note' } });

      // Save
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddRecord).toHaveBeenCalledWith({
          type: 'mood',
          data: expect.objectContaining({
            notes: 'Test note',
          }),
          tags: [],
        });
      });
    });
  });
});
