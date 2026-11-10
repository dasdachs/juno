import { useDateFormat } from '../../contexts/DateFormatContext';
import { DATE_FORMAT_LABELS, formatLongDate, type DateFormatStyle } from '../../lib/dateFormat';
import { Card, List, ListItem } from '../ui';

const DATE_FORMAT_STYLES: DateFormatStyle[] = ['us', 'international', 'iso'];
const DATE_FORMAT_PREVIEW_DATE = new Date(2024, 0, 15);

export function PreferencesSection() {
  const { dateFormat, setDateFormat } = useDateFormat();

  return (
    <section>
      <h2 className="section-title">Preferences</h2>
      <Card variant="outlined" className="settings-card">
        <List>
          <ListItem
            icon="calendar_month"
            headline="Date Format"
            supporting="How dates are displayed throughout the app"
          />
        </List>
        <div className="tile-grid settings-options">
          {DATE_FORMAT_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              className="tile"
              aria-pressed={dateFormat === style}
              onClick={() => setDateFormat(style)}
            >
              <span className="bold">{DATE_FORMAT_LABELS[style]}</span>
              <span className="small-text">{formatLongDate(DATE_FORMAT_PREVIEW_DATE, style)}</span>
            </button>
          ))}
        </div>
      </Card>
    </section>
  );
}
