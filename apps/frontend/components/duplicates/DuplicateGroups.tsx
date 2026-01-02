'use client';

import { DuplicateGroupCard } from './DuplicateGroupCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Copy } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

// File can come from database (with id, currentPath) or from scan (with path)
interface DuplicateFile {
  id?: number;
  name: string;
  path?: string;
  currentPath?: string;
  size: number;
  extension?: string;
}

interface DuplicateGroup {
  hash: string;
  files: DuplicateFile[];
  count: number;
}

interface DuplicateGroupsProps {
  groups: DuplicateGroup[];
  onDelete?: (filePath: string) => void;
  onPreview?: (file: DuplicateFile) => void;
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
    const totalSize = group.files.reduce((s, f) => s + (f.size || 0), 0);
    // Wasted space is the size of all files minus one copy
    return sum + (totalSize / group.count) * (group.count - 1);
  }, 0);

  const totalDuplicates = groups.reduce((sum, g) => sum + g.count - 1, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium">Duplicate Groups</p>
            <p className="text-2xl font-bold">{groups.length}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Total Duplicates</p>
            <p className="text-2xl font-bold text-orange-600">{totalDuplicates}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Wasted Space</p>
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
            {...(onDelete && { onDelete })}
            {...(onPreview && { onPreview })}
          />
        ))}
      </div>
    </div>
  );
}

