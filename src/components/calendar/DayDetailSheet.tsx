import { format } from 'date-fns';
import { X, Droplets, Heart, Frown, Smile, FileText } from 'lucide-react';
import { useRecords } from '../../hooks/useRecords';
import type { DayData, HealthRecord, FlowIntensity } from '../../lib/types';
import { FLOW_INTENSITY_LABELS, SYMPTOM_TYPE_LABELS, MOOD_TYPE_LABELS } from '../../lib/types';

interface DayDetailSheetProps {
  day: DayData | null;
  onClose: () => void;
  onLogPeriod: (date: number) => void;
  onLogSymptom: (date: number) => void;
  onLogMood: (date: number) => void;
  onLogIntimacy: (date: number) => void;
  onLogNote: (date: number) => void;
}

export function DayDetailSheet({
  day,
  onClose,
  onLogPeriod,
  onLogSymptom,
  onLogMood,
  onLogIntimacy,
  onLogNote,
}: DayDetailSheetProps) {
  const { getRecordsByDate } = useRecords();

  if (!day) return null;

  const records = getRecordsByDate(day.timestamp);
  const dateLabel = format(day.date, 'EEEE, MMMM d, yyyy');

  const periodRecords = records.filter((r) => r.type === 'period');
  const symptomRecords = records.filter((r) => r.type === 'symptom');
  const moodRecords = records.filter((r) => r.type === 'mood');
  const intimacyRecords = records.filter((r) => r.type === 'intimacy');
  const noteRecords = records.filter((r) => r.type === 'note');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{dateLabel}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick log buttons */}
          <div className="grid grid-cols-5 gap-2">
            <QuickLogButton
              icon={<Droplets className="w-5 h-5" />}
              label="Period"
              active={day.isPeriod}
              color="rose"
              onClick={() => onLogPeriod(day.timestamp)}
            />
            <QuickLogButton
              icon={<Frown className="w-5 h-5" />}
              label="Symptoms"
              active={day.hasSymptoms}
              color="amber"
              onClick={() => onLogSymptom(day.timestamp)}
            />
            <QuickLogButton
              icon={<Smile className="w-5 h-5" />}
              label="Mood"
              active={day.hasMood}
              color="sky"
              onClick={() => onLogMood(day.timestamp)}
            />
            <QuickLogButton
              icon={<Heart className="w-5 h-5" />}
              label="Intimacy"
              active={day.hasIntimacy}
              color="violet"
              onClick={() => onLogIntimacy(day.timestamp)}
            />
            <QuickLogButton
              icon={<FileText className="w-5 h-5" />}
              label="Note"
              active={day.hasNote}
              color="gray"
              onClick={() => onLogNote(day.timestamp)}
            />
          </div>

          {/* Cycle info */}
          {day.cycleDay && (
            <div className="bg-rose-50 rounded-lg p-3">
              <p className="text-sm text-rose-700">
                <span className="font-medium">Cycle Day {day.cycleDay}</span>
              </p>
            </div>
          )}

          {/* Prediction info */}
          {day.isPredictedPeriod && !day.isPeriod && (
            <div className="bg-rose-50 border border-dashed border-rose-200 rounded-lg p-3">
              <p className="text-sm text-rose-600">
                Period predicted for this day
              </p>
            </div>
          )}

          {/* Logged data */}
          {records.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Logged Data</h4>

              {periodRecords.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}

              {symptomRecords.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}

              {moodRecords.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}

              {intimacyRecords.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}

              {noteRecords.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface QuickLogButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  color: 'rose' | 'amber' | 'sky' | 'violet' | 'gray';
  onClick: () => void;
}

function QuickLogButton({ icon, label, active, color, onClick }: QuickLogButtonProps) {
  const colorClasses = {
    rose: active
      ? 'bg-rose-500 text-white'
      : 'bg-rose-50 text-rose-600 hover:bg-rose-100',
    amber: active
      ? 'bg-amber-500 text-white'
      : 'bg-amber-50 text-amber-600 hover:bg-amber-100',
    sky: active
      ? 'bg-sky-500 text-white'
      : 'bg-sky-50 text-sky-600 hover:bg-sky-100',
    violet: active
      ? 'bg-violet-500 text-white'
      : 'bg-violet-50 text-violet-600 hover:bg-violet-100',
    gray: active
      ? 'bg-gray-500 text-white'
      : 'bg-gray-50 text-gray-600 hover:bg-gray-100',
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${colorClasses[color]}`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}

interface RecordCardProps {
  record: HealthRecord;
}

function RecordCard({ record }: RecordCardProps) {
  const renderContent = () => {
    switch (record.type) {
      case 'period': {
        const data = record.data as { flowIntensity: FlowIntensity; notes?: string };
        return (
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-rose-500" />
            <span className="text-sm">
              {FLOW_INTENSITY_LABELS[data.flowIntensity]} flow
            </span>
          </div>
        );
      }
      case 'symptom': {
        const data = record.data as { symptoms: Array<{ type: string; severity: number }>; notes?: string };
        return (
          <div className="flex flex-wrap gap-1">
            {data.symptoms.map((s, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded"
              >
                {SYMPTOM_TYPE_LABELS[s.type as keyof typeof SYMPTOM_TYPE_LABELS] || s.type}
              </span>
            ))}
          </div>
        );
      }
      case 'mood': {
        const data = record.data as { moods: string[]; notes?: string };
        return (
          <div className="flex flex-wrap gap-1">
            {data.moods.map((m, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs rounded"
              >
                {MOOD_TYPE_LABELS[m as keyof typeof MOOD_TYPE_LABELS] || m}
              </span>
            ))}
          </div>
        );
      }
      case 'intimacy': {
        const data = record.data as { type: string; notes?: string };
        return (
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-violet-500" />
            <span className="text-sm capitalize">{data.type}</span>
          </div>
        );
      }
      case 'note': {
        const data = record.data as { content: string; title?: string };
        return (
          <div>
            {data.title && (
              <p className="text-sm font-medium text-gray-700">{data.title}</p>
            )}
            <p className="text-sm text-gray-600">{data.content}</p>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      {renderContent()}
    </div>
  );
}
