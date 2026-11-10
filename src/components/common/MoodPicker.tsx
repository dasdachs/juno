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
    <div className="stack tight">
      <p className="picker-label">How are you feeling?</p>
      <div className="tile-grid">
        {MOOD_OPTIONS.map((mood) => (
          <button
            key={mood}
            type="button"
            className="tile"
            aria-pressed={value.includes(mood)}
            onClick={() => toggleMood(mood)}
          >
            <span className="emoji">{MOOD_EMOJI[mood]}</span>
            <span>{MOOD_TYPE_LABELS[mood]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
