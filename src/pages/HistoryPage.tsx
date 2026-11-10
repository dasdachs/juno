import { useState } from 'react';
import { useRecords } from '../hooks/useRecords';
import { useLogForm } from '../components/logging';
import { HistoryDayGroup, HistoryFilter, groupRecordsByDay } from '../components/history';
import type { HistoryFilterValue } from '../components/history';
import { Card, Icon, Progress } from '../components/ui';

export function HistoryPage() {
  const [filterType, setFilterType] = useState<HistoryFilterValue>('all');
  const { records, isLoading } = useRecords(
    filterType !== 'all' ? { type: filterType } : {}
  );
  const { openEdit, logForm } = useLogForm();

  const groups = groupRecordsByDay(records);

  return (
    <div className="page-container">
      <div className="stack">
      <h1 className="page-title">History</h1>
      <HistoryFilter value={filterType} onChange={setFilterType} />

      {isLoading ? (
        <Progress />
      ) : groups.length === 0 ? (
        <Card className="empty-state">
          <Icon name="description" size="extra" />
          <p>No records found.</p>
          <p className="supporting">Start logging to see your history here.</p>
        </Card>
      ) : (
        groups.map((group) => (
          <HistoryDayGroup key={group.dateKey} group={group} onEdit={openEdit} />
        ))
      )}
      </div>

      {logForm}
    </div>
  );
}
