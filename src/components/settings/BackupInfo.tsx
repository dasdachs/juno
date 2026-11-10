import { useDateFormat } from '../../contexts/DateFormatContext';
import type { ExportManifest } from '../../lib/exportImport';
import { Card } from '../ui';

export function BackupInfo({ manifest }: { manifest: ExportManifest }) {
  const { formatShort } = useDateFormat();

  return (
    <Card>
      <p className="headline bold">Backup Info</p>
      <ul className="supporting plain-list">
        <li>
          Exported:{' '}
          {formatShort(manifest.exportedAt)}
        </li>
        {manifest.recordCount !== undefined && (
          <li>Records: {manifest.recordCount}</li>
        )}
        {manifest.cycleCount !== undefined && (
          <li>Cycles: {manifest.cycleCount}</li>
        )}
      </ul>
    </Card>
  );
}
