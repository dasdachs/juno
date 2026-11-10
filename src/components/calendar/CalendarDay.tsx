import { Droplet } from "lucide-react";
import type { DayData, FlowIntensity } from "../../lib/types";
import { FLOW_INTENSITY_LABELS } from "../../lib/types";
import { useDateFormat } from "../../contexts/DateFormatContext";

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


/** Everything a screen reader needs to know about this day, as one sentence. */
function buildAriaLabel(day: DayData, formatLong: (date: Date, withWeekday?: boolean) => string): string {
  const parts: string[] = [formatLong(day.date, true)];

  if (day.isToday) parts.push("today");

  if (day.isPeriod) {
    parts.push(
      day.flowIntensity
        ? `period logged, ${FLOW_INTENSITY_LABELS[day.flowIntensity]} flow`
        : "period logged",
    );
  } else if (day.isPredictedPeriod) {
    parts.push("predicted period");
  }

  if (day.cycleDay) parts.push(`cycle day ${day.cycleDay}`);

  const logged = [
    day.hasSymptoms && "symptoms",
    day.hasMood && "mood",
    day.hasIntimacy && "intimacy",
    day.hasNote && "note",
  ].filter(Boolean) as string[];

  if (logged.length > 0) parts.push(`${logged.join(", ")} logged`);

  return parts.join(", ");
}

export function CalendarDay({ day, onClick }: CalendarDayProps) {
  const { formatLong } = useDateFormat();
  const dayNumber = day.date.getDate();

  let containerClasses =
    "relative flex flex-col items-center justify-start m-1 p-2 sm:p-1 min-h-[56px] cursor-pointer rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800";

  if (!day.isCurrentMonth) {
    containerClasses += " opacity-40";
  }

  if (day.isToday) {
    containerClasses += " ring-2 ring-rose-500 dark:ring-rose-400";
  }

  // Period or predicted period background
  let periodIndicator = null;
  if (day.isPeriod) {
    const colorClass = day.flowIntensity
      ? FLOW_INTENSITY_COLORS[day.flowIntensity]
      : "bg-rose-400";

    // Intensity is carried by the background shade (see CalendarLegend); a single
    // droplet just marks the day as a logged period without crowding the cell.
    periodIndicator = (
      <div className={`absolute inset-0 rounded-lg ${colorClass} opacity-80`}>
        <Droplet
          className="absolute bottom-1 right-1 w-2.5 h-2.5 text-white/90 fill-current z-20"
          aria-hidden="true"
        />
      </div>
    );
  } else if (day.isPredictedPeriod) {
    periodIndicator = (
      <div className="absolute inset-0 rounded-lg border-2 border-dashed border-rose-300 dark:border-rose-400" />
    );
  }

  // Indicator dots for logged data
  const indicators = [
    day.hasIntimacy && { key: "intimacy", className: "bg-violet-500" },
    day.hasSymptoms && { key: "symptoms", className: "bg-amber-500" },
    day.hasMood && { key: "mood", className: "bg-sky-500" },
    day.hasNote && { key: "note", className: "bg-gray-400 dark:bg-gray-500" },
  ].filter(Boolean) as Array<{ key: string; className: string }>;

  return (
    <button
      type="button"
      className={containerClasses}
      onClick={() => onClick(day)}
      aria-label={buildAriaLabel(day, formatLong)}
      aria-current={day.isToday ? "date" : undefined}
    >
      {periodIndicator}

      <span
        aria-hidden="true"
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
        <span
          aria-hidden="true"
          className="relative z-10 text-[10px] text-gray-500 dark:text-gray-400"
        >
          D{day.cycleDay}
        </span>
      )}

      {indicators.length > 0 && (
        <div className="relative z-10 flex gap-0.5 mt-auto" aria-hidden="true">
          {indicators.map((indicator) => (
            <span
              key={indicator.key}
              className={`w-1.5 h-1.5 rounded-full ${indicator.className}`}
            />
          ))}
        </div>
      )}
    </button>
  );
}
