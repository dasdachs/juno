import type { MoodType } from '../../lib/types';
import { MOOD_TYPE_LABELS } from '../../lib/types';

interface MoodPickerProps {
  value: MoodType[];
  onChange: (moods: MoodType[]) => void;
}

const MOOD_OPTIONS: MoodType[] = [
  'happy',
  'calm',
  'energetic',
  'focused',
  'sensitive',
  'anxious',
  'sad',
  'irritable',
  'mood_swings',
];

const MOOD_EMOJI: Record<MoodType, string> = {
  happy: '\u{1F60A}',
  calm: '\u{1F60C}',
  energetic: '\u{26A1}',
  focused: '\u{1F3AF}',
  sensitive: '\u{1F97A}',
  anxious: '\u{1F630}',
  sad: '\u{1F622}',
  irritable: '\u{1F620}',
  mood_swings: '\u{1F3A2}',
};

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  const toggleMood = (mood: MoodType) => {
    if (value.includes(mood)) {
      onChange(value.filter((m) => m !== mood));
    } else {
      onChange([...value, mood]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">How are you feeling?</label>
      <div className="grid grid-cols-3 gap-2">
        {MOOD_OPTIONS.map((mood) => {
          const isSelected = value.includes(mood);

          return (
            <button
              key={mood}
              type="button"
              onClick={() => toggleMood(mood)}
              className={`flex flex-col items-center py-3 px-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-sky-500 text-white'
                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
            >
              <span className="text-2xl mb-1">{MOOD_EMOJI[mood]}</span>
              <span className="text-xs">{MOOD_TYPE_LABELS[mood]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
