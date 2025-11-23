'use client';

import { useState, useMemo } from 'react';
import { HistoryTimeline } from '@/components/history/HistoryTimeline';
import { HistoryFilters } from '@/components/history/HistoryFilters';
import { useQuery } from '@tanstack/react-query';
import { getRecentOperations, getFileById } from '@/lib/api/files';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from 'sonner';
import { FilePreview } from '@/components/files/FilePreview';

export default function HistoryPage() {
  const [actionFilter, setActionFilter] = useState('all');
  const [previewFileId, setPreviewFileId] = useState<number | null>(null);

  const { data: operations, isLoading, error } = useQuery({
    queryKey: ['history-operations'],
    queryFn: () => getRecentOperations(100),
  });

  const { data: previewFile } = useQuery({
    queryKey: ['file', previewFileId],
    queryFn: () => getFileById(previewFileId!),
    enabled: !!previewFileId,
  });

  const filteredOperations = useMemo(() => {
    if (!operations) return [];

    if (!actionFilter || actionFilter === 'all') return operations;

    return operations.filter((op: any) =>
      op.action.toLowerCase() === actionFilter.toLowerCase()
    );
  }, [operations, actionFilter]);

  const handleUndo = async (id: number) => {
    // TODO: Implement undo API call
    toast.info('Undo functionality will be implemented');
  };

  const handleView = (fileId: number) => {
    setPreviewFileId(fileId);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground">View operation history and undo actions</p>
        </div>
        <div className="text-center text-destructive">
          Error loading history: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground">
          View operation history and undo actions ({filteredOperations.length} operations)
        </p>
      </div>

      <HistoryFilters
        actionFilter={actionFilter}
        onActionChange={setActionFilter}
      />

      <HistoryTimeline
        operations={filteredOperations}
        onUndo={handleUndo}
        onView={handleView}
      />

      {previewFile && (
        <FilePreview
          file={previewFile.file}
          onClose={() => setPreviewFileId(null)}
        />
      )}
    </div>
  );
}

