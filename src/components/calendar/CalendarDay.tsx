import type { DayData, FlowIntensity } from '../../lib/types';

interface CalendarDayProps {
  day: DayData;
  onClick: (day: DayData) => void;
}

const FLOW_INTENSITY_COLORS: Record<FlowIntensity, string> = {
  spotting: 'bg-rose-200',
  light: 'bg-rose-300',
  medium: 'bg-rose-400',
  heavy: 'bg-rose-500',
  very_heavy: 'bg-rose-600',
};

export function CalendarDay({ day, onClick }: CalendarDayProps) {
  const dayNumber = day.date.getDate();

  // Base classes
  let containerClasses =
    'relative flex flex-col items-center justify-start p-1 min-h-[52px] cursor-pointer transition-colors';

  // Current month vs other months
  if (!day.isCurrentMonth) {
    containerClasses += ' opacity-40';
  }

  // Today highlight
  if (day.isToday) {
    containerClasses += ' ring-2 ring-rose-500 ring-inset rounded-lg';
  }

  // Period or predicted period background
  let periodIndicator = null;
  if (day.isPeriod) {
    const colorClass = day.flowIntensity
      ? FLOW_INTENSITY_COLORS[day.flowIntensity]
      : 'bg-rose-400';
    periodIndicator = (
      <div
        className={`absolute inset-1 rounded-lg ${colorClass} opacity-80`}
      />
    );
  } else if (day.isPredictedPeriod) {
    periodIndicator = (
      <div className="absolute inset-1 rounded-lg border-2 border-dashed border-rose-300" />
    );
  }

  // Indicator dots for logged data
  const indicators = [];
  if (day.hasIntimacy) {
    indicators.push(
      <span
        key="intimacy"
        className="w-1.5 h-1.5 rounded-full bg-violet-500"
        title="Intimacy"
      />
    );
  }
  if (day.hasSymptoms) {
    indicators.push(
      <span
        key="symptoms"
        className="w-1.5 h-1.5 rounded-full bg-amber-500"
        title="Symptoms"
      />
    );
  }
  if (day.hasMood) {
    indicators.push(
      <span
        key="mood"
        className="w-1.5 h-1.5 rounded-full bg-sky-500"
        title="Mood"
      />
    );
  }
  if (day.hasNote) {
    indicators.push(
      <span
        key="note"
        className="w-1.5 h-1.5 rounded-full bg-gray-400"
        title="Note"
      />
    );
  }

  return (
    <button
      type="button"
      className={containerClasses}
      onClick={() => onClick(day)}
    >
      {periodIndicator}

      <span
        className={`relative z-10 text-sm font-medium ${
          day.isToday
            ? 'text-rose-600'
            : day.isPeriod
            ? 'text-white'
            : day.isCurrentMonth
            ? 'text-gray-900'
            : 'text-gray-400'
        }`}
      >
        {dayNumber}
      </span>

      {day.cycleDay && day.isCurrentMonth && (
        <span className="relative z-10 text-[10px] text-gray-500">
          D{day.cycleDay}
        </span>
      )}

      {indicators.length > 0 && (
        <div className="relative z-10 flex gap-0.5 mt-auto">
          {indicators}
        </div>
      )}
    </button>
  );
}
