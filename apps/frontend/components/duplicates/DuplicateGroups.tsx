'use client';

import { DuplicateGroupCard } from './DuplicateGroupCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Copy } from 'lucide-react';
import type { FileInfo } from '@file-manager/shared';
import { formatFileSize } from '@/lib/utils';

interface DuplicateGroup {
  hash: string;
  files: FileInfo[];
  count: number;
}

interface DuplicateGroupsProps {
  groups: DuplicateGroup[];
  onDelete?: (filePath: string) => void;
  onPreview?: (file: FileInfo) => void;
}

export function DuplicateGroups({
  groups,
  onDelete,
  onPreview,
}: DuplicateGroupsProps) {
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<Copy className="h-12 w-12" />}
        title="No duplicates found"
        description="All files are unique. Run a scan to check for duplicates."
      />
    );
  }

  const totalWasted = groups.reduce((sum, group) => {
    const totalSize = group.files.reduce((s, f) => s + f.size, 0);
    return sum + totalSize * (group.count - 1);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Total Duplicate Groups</p>
            <p className="text-2xl font-bold">{groups.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Total Wasted Space</p>
            <p className="text-2xl font-bold text-destructive">
              {formatFileSize(totalWasted)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <DuplicateGroupCard
            key={group.hash}
            group={group}
            onDelete={onDelete}
            onPreview={onPreview}
          />
        ))}
      </div>
    </div>
  );
}

