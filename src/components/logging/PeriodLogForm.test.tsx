import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PeriodLogForm } from './PeriodLogForm';

// Mock useRecords hook
const mockAddRecord = vi.fn(() => Promise.resolve());
const mockUpdateRecord = vi.fn(() => Promise.resolve());
const mockDeleteRecord = vi.fn(() => Promise.resolve());
const mockRefresh = vi.fn(() => Promise.resolve());

vi.mock('../../hooks/useRecords', () => ({
  useRecords: () => ({
    addRecord: mockAddRecord,
    updateRecord: mockUpdateRecord,
    deleteRecord: mockDeleteRecord,
    refresh: mockRefresh,
  }),
}));

// Mock useCycles hook
const mockStartNewCycle = vi.fn(() => Promise.resolve());

vi.mock('../../hooks/useCycles', () => ({
  useCycles: () => ({
    startNewCycle: mockStartNewCycle,
    currentCycle: null,
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

describe('PeriodLogForm', () => {
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
      render(<PeriodLogForm {...defaultProps} />);

      expect(screen.getByText('Log Period')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should not render content when isOpen is false', () => {
      render(<PeriodLogForm {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Log Period')).not.toBeInTheDocument();
    });

    it('should display the date label', () => {
      const testDate = new Date('2024-03-15').getTime();
      render(<PeriodLogForm {...defaultProps} date={testDate} />);

      expect(screen.getByText('March 15, 2024')).toBeInTheDocument();
    });

    it('should display mode toggle buttons', () => {
      render(<PeriodLogForm {...defaultProps} />);

      expect(screen.getByText('Single Day')).toBeInTheDocument();
      expect(screen.getByText('Multiple Days')).toBeInTheDocument();
    });

    it('should display flow intensity options', () => {
      render(<PeriodLogForm {...defaultProps} />);

      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Heavy')).toBeInTheDocument();
    });
  });

  describe('save button state', () => {
    it('should disable Save button when no flow intensity is selected', () => {
      render(<PeriodLogForm {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeDisabled();
    });

    it('should enable Save button when flow intensity is selected', () => {
      render(<PeriodLogForm {...defaultProps} />);

      // Click on a flow intensity
      const mediumFlow = screen.getByText('Medium');
      fireEvent.click(mediumFlow);

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('form submission - single day mode', () => {
    it('should call addRecord when saving a new period log', async () => {
      render(<PeriodLogForm {...defaultProps} />);

      // Select flow intensity
      const mediumFlow = screen.getByText('Medium');
      fireEvent.click(mediumFlow);

      // Click save
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddRecord).toHaveBeenCalledWith({
          type: 'period',
          data: expect.objectContaining({
            flowIntensity: 'medium',
          }),
          tags: [],
        });
      });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should start a new cycle when no current cycle exists', async () => {
      render(<PeriodLogForm {...defaultProps} />);

      // Select flow intensity
      const mediumFlow = screen.getByText('Medium');
      fireEvent.click(mediumFlow);

      // Click save
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockStartNewCycle).toHaveBeenCalled();
      });
    });

    it('should call updateRecord when editing an existing record', async () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          flowIntensity: 'light' as const,
        },
      };

      render(<PeriodLogForm {...defaultProps} existingRecord={existingRecord} />);

      // Change flow intensity
      const heavyFlow = screen.getByText('Heavy');
      fireEvent.click(heavyFlow);

      // Click save
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateRecord).toHaveBeenCalledWith(
          'test-id',
          expect.objectContaining({
            data: expect.objectContaining({
              flowIntensity: 'heavy',
            }),
          })
        );
      });
    });
  });

  describe('multi-day mode', () => {
    it('should show date range inputs when Multiple Days is selected', () => {
      render(<PeriodLogForm {...defaultProps} />);

      // Click Multiple Days mode
      const multiDayButton = screen.getByText('Multiple Days');
      fireEvent.click(multiDayButton);

      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('End Date')).toBeInTheDocument();
    });

    it('should not show mode toggle for existing records', () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          flowIntensity: 'medium' as const,
        },
      };

      render(<PeriodLogForm {...defaultProps} existingRecord={existingRecord} />);

      expect(screen.queryByText('Single Day')).not.toBeInTheDocument();
      expect(screen.queryByText('Multiple Days')).not.toBeInTheDocument();
    });
  });

  describe('delete functionality', () => {
    it('should not show Delete button for new records', () => {
      render(<PeriodLogForm {...defaultProps} />);

      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('should show Delete button for existing records', () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          flowIntensity: 'medium' as const,
        },
      };

      render(<PeriodLogForm {...defaultProps} existingRecord={existingRecord} />);

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should call deleteRecord when Delete is clicked', async () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          flowIntensity: 'medium' as const,
        },
      };

      render(<PeriodLogForm {...defaultProps} existingRecord={existingRecord} />);

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
      render(<PeriodLogForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should reset mode when cancelled', () => {
      render(<PeriodLogForm {...defaultProps} />);

      // Switch to multi mode
      const multiDayButton = screen.getByText('Multiple Days');
      fireEvent.click(multiDayButton);

      expect(screen.getByText('Start Date')).toBeInTheDocument();

      // Cancel
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('notes field', () => {
    it('should allow entering notes', () => {
      render(<PeriodLogForm {...defaultProps} />);

      const notesInput = screen.getByPlaceholderText('Any additional notes...');
      fireEvent.change(notesInput, { target: { value: 'Test note' } });

      expect(notesInput).toHaveValue('Test note');
    });

    it('should include notes in saved data', async () => {
      render(<PeriodLogForm {...defaultProps} />);

      // Select flow intensity
      const mediumFlow = screen.getByText('Medium');
      fireEvent.click(mediumFlow);

      // Enter notes
      const notesInput = screen.getByPlaceholderText('Any additional notes...');
      fireEvent.change(notesInput, { target: { value: 'Test note' } });

      // Save
      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddRecord).toHaveBeenCalledWith({
          type: 'period',
          data: expect.objectContaining({
            notes: 'Test note',
          }),
          tags: [],
        });
      });
    });
  });

  describe('existing record initialization', () => {
    it('should pre-populate form with existing flow intensity', () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          flowIntensity: 'heavy' as const,
        },
      };

      render(<PeriodLogForm {...defaultProps} existingRecord={existingRecord} />);

      // The heavy option should be selected (check for styling)
      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).not.toBeDisabled();
    });

    it('should pre-populate form with existing notes', () => {
      const existingRecord = {
        id: 'test-id',
        data: {
          date: Date.now(),
          flowIntensity: 'medium' as const,
          notes: 'Existing note',
        },
      };

      render(<PeriodLogForm {...defaultProps} existingRecord={existingRecord} />);

      const notesInput = screen.getByPlaceholderText('Any additional notes...');
      expect(notesInput).toHaveValue('Existing note');
    });
  });
});
