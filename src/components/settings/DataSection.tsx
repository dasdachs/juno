import { useState } from 'react';
import { Card, List, ListItem } from '../ui';
import { DeleteAllData } from './DeleteAllData';
import { ExportDataModal } from './ExportDataModal';
import { ImportDataModal } from './ImportDataModal';

export function DataSection() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <section>
      <h2 className="section-title">Data</h2>
      <Card variant="outlined" className="settings-card">
        <List>
          <ListItem
            icon="download"
            headline="Export Data"
            supporting="Create encrypted backup"
            onClick={() => setShowExportModal(true)}
          />
          <ListItem
            icon="upload"
            headline="Import Data"
            supporting="Restore from backup"
            onClick={() => setShowImportModal(true)}
          />
        </List>
        <hr />
        <DeleteAllData />
      </Card>

      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
      <ImportDataModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => window.location.reload()}
      />
    </section>
  );
}
