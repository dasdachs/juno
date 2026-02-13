import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntimacyLogForm } from './IntimacyLogForm';

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

describe('IntimacyLogForm', () => {
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
      render(<IntimacyLogForm {...defaultProps} />);

      expect(screen.getByText('Log Intimacy')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should not render content when isOpen is false', () => {
      render(<IntimacyLogForm {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Log Intimacy')).not.toBeInTheDocument();
    });

    it('should display the date label', () => {
      const testDate = new Date('2024-03-15').getTime();
      render(<IntimacyLogForm {...defaultProps} date={testDate} />);

      expect(screen.getByText('March 15, 2024')).toBeInTheDocument();
    });

    it('should display protection options', () => {
      render(<IntimacyLogForm {...defaultProps} />);

      expect(screen.getByText('Protected')).toBeInTheDocument();
      expect(screen.getByText('Unprotected')).toBeInTheDocument();
    });
  });

  describe('save button state', () => {
    it('should disable Save button when no type is selected', () => {
      render(<IntimacyLogForm {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeDisabled();
    });

    it('should enable Save button when a type is selected', () => {
      render(<IntimacyLogForm {...defaultProps} />);

      // Click on protected option
      const protectedOption = screen.getByText('Protected');
      fireEvent.click(protectedOption);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('form submission', () => {
    it('should call addRecord when saving a new intimacy log', async () => {
      render(<IntimacyLogForm {...defaultProps} />);

      // Select protected
      const protectedOption = screen.getByText('Protected');
      fireEvent.click(protectedOption);

      // Click save
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddRecord).toHaveBeenCalledWith({
          type: 'intimacy',
          data: expect.objectContaining({
            type: 'protected',
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
          type: 'protected' as const,
        },
      };

      render(<IntimacyLogForm {...defaultProps} existingRecord={existingRecord} />);

      // Change to unprotected
      const unprotectedOption = screen.getByText('Unprotected');
      fireEvent.click(unprotectedOption);

      // Click save
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRecord).toHaveBeenCalledWith(
          'test-id',
          expect.objectContaining({
            data: expect.objectContaining({
              type: 'unprotected',
            }),
          })
        );
      });
    });
  });

  describe('delete functionality', () => {
    it('should not show Delete button for new records', () => {
      render(<IntimacyLogForm {...defaultProps} />);

      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('should show Delete button for existing records', () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          type: 'protected' as const,
        },
      };

      render(<IntimacyLogForm {...defaultProps} existingRecord={existingRecord} />);

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should call deleteRecord when Delete is clicked', async () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          type: 'protected' as const,
        },
      };

      render(<IntimacyLogForm {...defaultProps} existingRecord={existingRecord} />);

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
      render(<IntimacyLogForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('notes field', () => {
    it('should allow entering notes', () => {
      render(<IntimacyLogForm {...defaultProps} />);

      const notesInput = screen.getByPlaceholderText('Any additional notes...');
      fireEvent.change(notesInput, { target: { value: 'Test note' } });

      expect(notesInput).toHaveValue('Test note');
    });
  });
});
