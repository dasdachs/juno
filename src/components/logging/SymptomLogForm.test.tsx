import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SymptomLogForm } from './SymptomLogForm';

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

describe('SymptomLogForm', () => {
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
      render(<SymptomLogForm {...defaultProps} />);

      expect(screen.getByText('Log Symptoms')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should not render content when isOpen is false', () => {
      render(<SymptomLogForm {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Log Symptoms')).not.toBeInTheDocument();
    });

    it('should display the date label', () => {
      const testDate = new Date('2024-03-15').getTime();
      render(<SymptomLogForm {...defaultProps} date={testDate} />);

      expect(screen.getByText('March 15, 2024')).toBeInTheDocument();
    });
  });

  describe('save button state', () => {
    it('should disable Save button when no symptoms are selected', () => {
      render(<SymptomLogForm {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeDisabled();
    });

    it('should enable Save button when symptoms are selected', () => {
      render(<SymptomLogForm {...defaultProps} />);

      // Click on a symptom button to select it
      const crampsSymptom = screen.getByText('Cramps');
      fireEvent.click(crampsSymptom);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('form submission', () => {
    it('should call addRecord when saving a new symptom log', async () => {
      render(<SymptomLogForm {...defaultProps} />);

      // Select a symptom
      const crampsSymptom = screen.getByText('Cramps');
      fireEvent.click(crampsSymptom);

      // Click save
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddRecord).toHaveBeenCalledWith({
          type: 'symptom',
          data: expect.objectContaining({
            symptoms: expect.arrayContaining([
              expect.objectContaining({ type: 'cramps' }),
            ]),
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
          symptoms: [{ type: 'headache' as const, severity: 2 as const }],
        },
      };

      render(<SymptomLogForm {...defaultProps} existingRecord={existingRecord} />);

      // Add another symptom
      const crampsSymptom = screen.getByText('Cramps');
      fireEvent.click(crampsSymptom);

      // Click save
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRecord).toHaveBeenCalledWith(
          'test-id',
          expect.objectContaining({
            data: expect.objectContaining({
              symptoms: expect.arrayContaining([
                expect.objectContaining({ type: 'headache' }),
                expect.objectContaining({ type: 'cramps' }),
              ]),
            }),
          })
        );
      });
    });
  });

  describe('delete functionality', () => {
    it('should not show Delete button for new records', () => {
      render(<SymptomLogForm {...defaultProps} />);

      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('should show Delete button for existing records', () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          symptoms: [{ type: 'cramps' as const, severity: 2 as const }],
        },
      };

      render(<SymptomLogForm {...defaultProps} existingRecord={existingRecord} />);

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should call deleteRecord when Delete is clicked', async () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          symptoms: [{ type: 'cramps' as const, severity: 2 as const }],
        },
      };

      render(<SymptomLogForm {...defaultProps} existingRecord={existingRecord} />);

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
      render(<SymptomLogForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('notes field', () => {
    it('should allow entering notes', () => {
      render(<SymptomLogForm {...defaultProps} />);

      const notesInput = screen.getByPlaceholderText('Any additional notes...');
      fireEvent.change(notesInput, { target: { value: 'Test note' } });

      expect(notesInput).toHaveValue('Test note');
    });
  });
});
