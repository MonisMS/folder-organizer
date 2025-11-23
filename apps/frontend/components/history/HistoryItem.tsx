'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';
import { Undo2, Eye } from 'lucide-react';

interface HistoryItemProps {
  id: number;
  action: string;
  timestamp: string;
  fileId?: number;
  metadata?: string;
  onUndo?: (id: number) => void;
  onView?: (id: number) => void;
}

const actionColors: Record<string, string> = {
  scanned: 'bg-blue-500/10 text-blue-500',
  moved: 'bg-green-500/10 text-green-500',
  organized: 'bg-purple-500/10 text-purple-500',
  deleted: 'bg-red-500/10 text-red-500',
  undone: 'bg-gray-500/10 text-gray-500',
};

export function HistoryItem({
  id,
  action,
  timestamp,
  fileId,
  metadata,
  onUndo,
  onView,
}: HistoryItemProps) {
  const canUndo = action !== 'undone' && action !== 'scanned' && onUndo;
  let parsedMetadata: any = null;

  try {
    if (metadata) {
      parsedMetadata = JSON.parse(metadata);
    }
  } catch (e) {
    // Ignore parse errors
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={actionColors[action.toLowerCase()] || 'bg-gray-500/10 text-gray-500'}
              >
                {action}
              </Badge>
              {fileId && (
                <span className="text-sm text-muted-foreground">File ID: {fileId}</span>
              )}
            </div>
            {parsedMetadata && (
              <div className="text-sm text-muted-foreground">
                {parsedMetadata.category && (
                  <span>Category: {parsedMetadata.category}</span>
                )}
                {parsedMetadata.originalPath && (
                  <div className="truncate max-w-md">
                    Path: {parsedMetadata.originalPath}
                  </div>
                )}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {formatRelativeTime(timestamp)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onView && fileId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(fileId)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {canUndo && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUndo(id)}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Undo
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

