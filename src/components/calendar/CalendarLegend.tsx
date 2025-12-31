export function CalendarLegend() {
  return (
    <div className="px-4 py-3 flex flex-wrap gap-4 text-xs text-gray-600">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-rose-400" />
        <span>Period</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm border-2 border-dashed border-rose-300" />
        <span>Predicted</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-violet-500" />
        <span>Intimacy</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span>Symptoms</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-sky-500" />
        <span>Mood</span>
      </div>
    </div>
  );
}
