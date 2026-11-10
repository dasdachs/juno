import { useTheme } from '../../contexts/ThemeContext';
import { SegmentedButton } from '../ui';

const OPTIONS = [
  { value: 'light' as const, icon: 'light_mode', label: 'Light', ariaLabel: 'Light theme' },
  { value: 'dark' as const, icon: 'dark_mode', label: 'Dark', ariaLabel: 'Dark theme' },
  { value: 'auto' as const, icon: 'computer', label: 'Auto', ariaLabel: 'Auto theme' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return <SegmentedButton label="Theme" segments={OPTIONS} value={theme} onChange={setTheme} />;
}
