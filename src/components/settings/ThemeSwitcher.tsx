import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'auto' as const, icon: Laptop, label: 'Auto' },
  ];

  return (
    <div className="flex gap-2">
      {options.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors duration-200 ${
              isActive
                ? 'bg-rose-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
            aria-label={`${label} theme`}
            aria-pressed={isActive}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
