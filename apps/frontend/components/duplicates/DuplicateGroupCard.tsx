'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils';
import { Trash2, Eye } from 'lucide-react';
import type { FileInfo } from '@file-manager/shared';

interface DuplicateGroup {
  hash: string;
  files: FileInfo[];
  count: number;
}

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  onDelete?: (hash: string) => void;
  onPreview?: (file: FileInfo) => void;
}

export function DuplicateGroupCard({
  group,
  onDelete,
  onPreview,
}: DuplicateGroupCardProps) {
  const totalSize = group.files.reduce((sum, file) => sum + file.size, 0);
  const wastedSpace = totalSize * (group.count - 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {group.count} duplicate{group.count > 1 ? 's' : ''} found
            </CardTitle>
            <CardDescription>
              Hash: <code className="text-xs">{group.hash.slice(0, 16)}...</code>
            </CardDescription>
          </div>
          <Badge variant="destructive">
            Wasted: {formatFileSize(wastedSpace)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-2">
          {group.files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground truncate">{file.path}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {onPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPreview(file)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {index > 0 && onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(file.path)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              // Delete all duplicates except the first one
              group.files.slice(1).forEach((file) => {
                onDelete(file.path);
              });
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All Duplicates
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

