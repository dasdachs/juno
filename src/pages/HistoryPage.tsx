import { useState } from 'react';
import { format } from 'date-fns';
import { Droplets, Heart, Frown, Smile, FileText, Filter } from 'lucide-react';
import { useRecords } from '../hooks/useRecords';
import type { RecordType, HealthRecord, FlowIntensity } from '../lib/types';
import {
  RECORD_TYPE_LABELS,
  FLOW_INTENSITY_LABELS,
  SYMPTOM_TYPE_LABELS,
  MOOD_TYPE_LABELS,
} from '../lib/types';

const TYPE_ICONS: Record<RecordType, React.ReactNode> = {
  period: <Droplets className="w-4 h-4" />,
  intimacy: <Heart className="w-4 h-4" />,
  symptom: <Frown className="w-4 h-4" />,
  mood: <Smile className="w-4 h-4" />,
  note: <FileText className="w-4 h-4" />,
};

const TYPE_COLORS: Record<RecordType, string> = {
  period: 'bg-rose-100 text-rose-600',
  intimacy: 'bg-violet-100 text-violet-600',
  symptom: 'bg-amber-100 text-amber-600',
  mood: 'bg-sky-100 text-sky-600',
  note: 'bg-gray-100 text-gray-600',
};

export function HistoryPage() {
  const [filterType, setFilterType] = useState<RecordType | 'all'>('all');
  const { records, isLoading } = useRecords(
    filterType !== 'all' ? { type: filterType } : {}
  );

  const sortedRecords = [...records].sort((a, b) => {
    const dateA = (a.data as { date?: number }).date || a.createdAt;
    const dateB = (b.data as { date?: number }).date || b.createdAt;
    return dateB - dateA;
  });

  // Group records by date
  const groupedRecords = sortedRecords.reduce((groups, record) => {
    const recordDate = (record.data as { date?: number }).date || record.createdAt;
    const dateKey = format(new Date(recordDate), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(record);
    return groups;
  }, {} as Record<string, HealthRecord[]>);

  return (
    <div className="p-6 pb-20 sm:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">History</h1>
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as RecordType | 'all')}
            className="pl-8 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 appearance-none cursor-pointer focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 transition-colors duration-200"
          >
            <option value="all">All</option>
            {Object.entries(RECORD_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
      ) : sortedRecords.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center transition-colors duration-200">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-300">No records found.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Start logging to see your history here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRecords).map(([dateKey, dayRecords]) => (
            <div key={dateKey}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="space-y-3">
                {dayRecords.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecordCard({ record }: { record: HealthRecord }) {
  const colorClass = TYPE_COLORS[record.type];
  const icon = TYPE_ICONS[record.type];

  const renderContent = () => {
    switch (record.type) {
      case 'period': {
        const data = record.data as { flowIntensity: FlowIntensity; notes?: string };
        return (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {FLOW_INTENSITY_LABELS[data.flowIntensity]} flow
            </p>
            {data.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.notes}</p>
            )}
          </div>
        );
      }
      case 'symptom': {
        const data = record.data as {
          symptoms: Array<{ type: string; severity: number }>;
          notes?: string;
        };
        return (
          <div>
            <div className="flex flex-wrap gap-1">
              {data.symptoms.map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded"
                >
                  {SYMPTOM_TYPE_LABELS[s.type as keyof typeof SYMPTOM_TYPE_LABELS] || s.type}
                </span>
              ))}
            </div>
            {data.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.notes}</p>
            )}
          </div>
        );
      }
      case 'mood': {
        const data = record.data as { moods: string[]; notes?: string };
        return (
          <div>
            <div className="flex flex-wrap gap-1">
              {data.moods.map((m, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-xs rounded"
                >
                  {MOOD_TYPE_LABELS[m as keyof typeof MOOD_TYPE_LABELS] || m}
                </span>
              ))}
            </div>
            {data.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.notes}</p>
            )}
          </div>
        );
      }
      case 'intimacy': {
        const data = record.data as { type: string; notes?: string };
        return (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
              {data.type}
            </p>
            {data.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.notes}</p>
            )}
          </div>
        );
      }
      case 'note': {
        const data = record.data as { title?: string; content: string };
        return (
          <div>
            {data.title && (
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.title}</p>
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm transition-colors duration-200">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {RECORD_TYPE_LABELS[record.type]}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {format(new Date(record.createdAt), 'h:mm a')}
            </span>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
