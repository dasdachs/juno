import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getSettings, updateSettings } from '../lib/db';
import {
  inferDateFormatStyle,
  formatLongDate,
  formatShortDate,
  type DateFormatStyle,
} from '../lib/dateFormat';

interface DateFormatContextValue {
  dateFormat: DateFormatStyle;
  setDateFormat: (style: DateFormatStyle) => Promise<void>;
  formatLong: (date: Date | number, withWeekday?: boolean) => string;
  formatShort: (date: Date | number) => string;
}

const DateFormatContext = createContext<DateFormatContextValue | null>(null);

export function DateFormatProvider({ children }: { children: ReactNode }) {
  const [dateFormat, setDateFormatState] = useState<DateFormatStyle>('us');

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings.dateFormat) {
        setDateFormatState(settings.dateFormat);
      } else {
        const inferred = inferDateFormatStyle();
        setDateFormatState(inferred);
        void updateSettings({ dateFormat: inferred });
      }
    });
  }, []);

  const setDateFormat = useCallback(async (style: DateFormatStyle) => {
    setDateFormatState(style);
    await updateSettings({ dateFormat: style });
  }, []);

  const formatLong = useCallback(
    (date: Date | number, withWeekday = false) => formatLongDate(date, dateFormat, withWeekday),
    [dateFormat]
  );

  const formatShort = useCallback(
    (date: Date | number) => formatShortDate(date, dateFormat),
    [dateFormat]
  );

  return (
    <DateFormatContext.Provider value={{ dateFormat, setDateFormat, formatLong, formatShort }}>
      {children}
    </DateFormatContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDateFormat(): DateFormatContextValue {
  const context = useContext(DateFormatContext);
  if (!context) {
    throw new Error('useDateFormat must be used within a DateFormatProvider');
  }
  return context;
}
