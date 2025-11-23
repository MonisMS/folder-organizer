'use client';

import { HistoryItem } from './HistoryItem';
import { EmptyState } from '@/components/shared/EmptyState';
import { History } from 'lucide-react';

interface Operation {
  id: number;
  action: string;
  timestamp: string;
  fileId?: number;
  metadata?: string;
}

interface HistoryTimelineProps {
  operations: Operation[];
  onUndo?: (id: number) => void;
  onView?: (fileId: number) => void;
}

export function HistoryTimeline({
  operations,
  onUndo,
  onView,
}: HistoryTimelineProps) {
  if (operations.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-12 w-12" />}
        title="No history found"
        description="Operation history will appear here"
      />
    );
  }

  return (
    <div className="space-y-4">
      {operations.map((op) => (
        <HistoryItem
          key={op.id}
          {...op}
          onUndo={onUndo}
          onView={onView}
        />
      ))}
    </div>
  );
}

