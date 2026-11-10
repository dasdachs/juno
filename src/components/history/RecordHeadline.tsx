import type { FlowIntensity, HealthRecord } from '../../lib/types';
import { FLOW_INTENSITY_LABELS, MOOD_TYPE_LABELS, SYMPTOM_TYPE_LABELS } from '../../lib/types';
import { RECORD_TYPE_META } from '../../lib/recordTypeMeta';
import { Chip } from '../ui';

function Tags({ labels, tone }: { labels: string[]; tone: string }) {
  return (
    <div className="entry-tags">
      {labels.map((label, i) => (
        <Chip key={i} className={tone}>
          {label}
        </Chip>
      ))}
    </div>
  );
}

/** The main line of a history entry: what was logged. */
export function RecordHeadline({ record }: { record: HealthRecord }) {
  const tone = RECORD_TYPE_META[record.type].tone;

  switch (record.type) {
    case 'period': {
      const data = record.data as { flowIntensity: FlowIntensity };
      return <>{FLOW_INTENSITY_LABELS[data.flowIntensity]} flow</>;
    }
    case 'symptom': {
      const data = record.data as { symptoms: Array<{ type: string }> };
      const labels = data.symptoms.map(
        (s) => SYMPTOM_TYPE_LABELS[s.type as keyof typeof SYMPTOM_TYPE_LABELS] || s.type
      );
      return <Tags labels={labels} tone={tone} />;
    }
    case 'mood': {
      const data = record.data as { moods: string[] };
      const labels = data.moods.map(
        (m) => MOOD_TYPE_LABELS[m as keyof typeof MOOD_TYPE_LABELS] || m
      );
      return <Tags labels={labels} tone={tone} />;
    }
    case 'intimacy':
      return <span className="capitalize">{(record.data as { type: string }).type}</span>;
    case 'note': {
      const data = record.data as { title?: string; content: string };
      return <>{data.title || data.content}</>;
    }
    default:
      return null;
  }
}
