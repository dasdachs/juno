import type { DayData, FlowIntensity } from "../../lib/types";

interface CalendarDayProps {
  day: DayData;
  onClick: (day: DayData) => void;
}

const FLOW_INTENSITY_COLORS: Record<FlowIntensity, string> = {
  spotting: "bg-rose-200",
  light: "bg-rose-300",
  medium: "bg-rose-400",
  heavy: "bg-rose-500",
  very_heavy: "bg-rose-600",
};

const FLOW_INTENSITY_DROPS: Record<FlowIntensity, number> = {
  spotting: 1,
  light: 2,
  medium: 3,
  heavy: 4,
  very_heavy: 5,
};

export function CalendarDay({ day, onClick }: CalendarDayProps) {
  const dayNumber = day.date.getDate();

  // Base classes
  let containerClasses =
    "relative flex flex-col items-center justify-start m-1 p-2 sm:p-1 min-h-[56px] cursor-pointer transition-colors duration-200";

  // Current month vs other months
  if (!day.isCurrentMonth) {
    containerClasses += " opacity-40";
  }

  // Today highlight
  if (day.isToday) {
    containerClasses += " ring-2 ring-rose-500 dark:ring-rose-400 rounded-lg";
  }

  // Period or predicted period background
  let periodIndicator = null;
  if (day.isPeriod) {
    const colorClass = day.flowIntensity
      ? FLOW_INTENSITY_COLORS[day.flowIntensity]
      : "bg-rose-400";
    const dropCount = day.flowIntensity
      ? FLOW_INTENSITY_DROPS[day.flowIntensity]
      : 3;

    periodIndicator = (
      <div className={`absolute inset-0 rounded-lg ${colorClass} opacity-80`}>
        {/* Flow intensity droplet indicators */}
        <div className="absolute bottom-1 right-1 flex gap-0.5 z-20">
          {Array.from({ length: dropCount }).map((_, i) => (
            <span
              key={i}
              className="text-xs text-white drop-shadow-sm"
              title={`${dropCount} droplets`}
            >
              💧
            </span>
          ))}
        </div>
      </div>
    );
  } else if (day.isPredictedPeriod) {
    periodIndicator = (
      <div className="absolute inset-0 rounded-lg border-2 border-dashed border-rose-300 dark:border-rose-400" />
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
      />,
    );
  }
  if (day.hasSymptoms) {
    indicators.push(
      <span
        key="symptoms"
        className="w-1.5 h-1.5 rounded-full bg-amber-500"
        title="Symptoms"
      />,
    );
  }
  if (day.hasMood) {
    indicators.push(
      <span
        key="mood"
        className="w-1.5 h-1.5 rounded-full bg-sky-500"
        title="Mood"
      />,
    );
  }
  if (day.hasNote) {
    indicators.push(
      <span
        key="note"
        className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"
        title="Note"
      />,
    );
  }

  return (
    <div className={containerClasses} onClick={() => onClick(day)}>
      {periodIndicator}

      <span
        className={`relative z-10 text-sm font-medium ${
          day.isToday
            ? "text-rose-600 dark:text-rose-400"
            : day.isPeriod
              ? "text-white"
              : day.isCurrentMonth
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {dayNumber}
      </span>

      {day.cycleDay && day.isCurrentMonth && (
        <span className="relative z-10 text-[10px] text-gray-500 dark:text-gray-400">
          D{day.cycleDay}
        </span>
      )}

      {indicators.length > 0 && (
        <div className="relative z-10 flex gap-0.5 mt-auto">{indicators}</div>
      )}
    </div>
  );
}
