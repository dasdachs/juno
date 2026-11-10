import { X, Droplets, Heart, Pencil } from 'lucide-react';
import { RECORD_TYPE_META, RECORD_TYPE_ORDER } from '../../lib/recordTypeMeta';
import { useRecords } from '../../hooks/useRecords';
import { useDialog } from '../../hooks/useDialog';
import { useDateFormat } from '../../contexts/DateFormatContext';
import type {
  DayData,
  HealthRecord,
  RecordType,
  PeriodData,
  SymptomData,
  MoodData,
  IntimacyData,
  NoteData,
} from '../../lib/types';
import {
  FLOW_INTENSITY_LABELS,
  SYMPTOM_TYPE_LABELS,
  MOOD_TYPE_LABELS,
  INTIMACY_TYPE_LABELS,
} from '../../lib/types';

interface DayDetailSheetProps {
  day: DayData | null;
  onClose: () => void;
  onLog: (type: RecordType, date: number) => void;
  onEditRecord: (record: HealthRecord) => void;
}

/** Short human-readable summary of a record, used for labels and screen readers. */
export function describeRecord(record: HealthRecord): string {
  switch (record.type) {
    case 'period': {
      const data = record.data as PeriodData;
      return `${FLOW_INTENSITY_LABELS[data.flowIntensity]} flow`;
    }
    case 'symptom': {
      const data = record.data as SymptomData;
      return data.symptoms
        .map((s) => SYMPTOM_TYPE_LABELS[s.type] ?? s.type)
        .join(', ');
    }
    case 'mood': {
      const data = record.data as MoodData;
      return data.moods.map((m) => MOOD_TYPE_LABELS[m] ?? m).join(', ');
    }
    case 'intimacy': {
      const data = record.data as IntimacyData;
      return INTIMACY_TYPE_LABELS[data.type] ?? data.type;
    }
    case 'note': {
      const data = record.data as NoteData;
      return data.title || data.content;
    }
    default:
      return 'record';
  }
}

export function DayDetailSheet({ day, onClose, onLog, onEditRecord }: DayDetailSheetProps) {
  const { getRecordsByDate } = useRecords();
  const dialogRef = useDialog(day !== null, onClose);
  const { formatLong } = useDateFormat();

  if (!day) return null;

  const records = getRecordsByDate(day.timestamp);
  const dateLabel = formatLong(day.date, true);

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close day details"
        tabIndex={-1}
        className="fixed inset-0 bg-black/50 z-40 cursor-default"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={dateLabel}
        tabIndex={-1}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl z-50 max-h-[80vh] overflow-hidden flex flex-col animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{dateLabel}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick log buttons */}
          <div className="grid grid-cols-5 gap-2">
            {RECORD_TYPE_ORDER.map((type) => {
              const meta = RECORD_TYPE_META[type];
              const Icon = meta.icon;
              const active = meta.isLogged(day);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onLog(type, day.timestamp)}
                  aria-label={`Log ${meta.label}`}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors duration-200 ${
                    active ? meta.tileActiveClass : meta.tileClass
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cycle info */}
          {day.cycleDay && (
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3">
              <p className="text-sm text-rose-700 dark:text-rose-300">
                <span className="font-medium">Cycle Day {day.cycleDay}</span>
              </p>
            </div>
          )}

          {/* Prediction info */}
          {day.isPredictedPeriod && !day.isPeriod && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-dashed border-rose-200 dark:border-rose-800 rounded-lg p-3">
              <p className="text-sm text-rose-600 dark:text-rose-400">
                Period predicted for this day
              </p>
            </div>
          )}

          {/* Logged data */}
          {records.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Logged Data</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tap an entry to edit or delete it.
              </p>

              {records.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  onEdit={() => onEditRecord(record)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface RecordCardProps {
  record: HealthRecord;
  onEdit: () => void;
}

function RecordCard({ record, onEdit }: RecordCardProps) {
  const renderContent = () => {
    switch (record.type) {
      case 'period': {
        const data = record.data as PeriodData;
        return (
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {FLOW_INTENSITY_LABELS[data.flowIntensity]} flow
            </span>
          </div>
        );
      }
      case 'symptom': {
        const data = record.data as SymptomData;
        return (
          <div className="flex flex-wrap gap-1">
            {data.symptoms.map((s, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded"
              >
                {SYMPTOM_TYPE_LABELS[s.type] ?? s.type}
              </span>
            ))}
          </div>
        );
      }
      case 'mood': {
        const data = record.data as MoodData;
        return (
          <div className="flex flex-wrap gap-1">
            {data.moods.map((m, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-xs rounded"
              >
                {MOOD_TYPE_LABELS[m] ?? m}
              </span>
            ))}
          </div>
        );
      }
      case 'intimacy': {
        const data = record.data as IntimacyData;
        return (
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0" />
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {INTIMACY_TYPE_LABELS[data.type] ?? data.type}
            </span>
          </div>
        );
      }
      case 'note': {
        const data = record.data as NoteData;
        return (
          <div>
            {data.title && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{data.title}</p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-300">{data.content}</p>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Edit ${describeRecord(record)}`}
      className="w-full flex items-center gap-3 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-3 transition-colors duration-200"
    >
      <div className="flex-1 min-w-0">{renderContent()}</div>
      <Pencil className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
    </button>
  );
}
