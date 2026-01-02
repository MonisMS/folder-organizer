'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils';
import { Trash2, Eye, FolderOpen } from 'lucide-react';

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

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  onDelete?: ((filePath: string) => void) | undefined;
  onPreview?: ((file: DuplicateFile) => void) | undefined;
}

export function DuplicateGroupCard({
  group,
  onDelete,
  onPreview,
}: DuplicateGroupCardProps) {
  const totalSize = group.files.reduce((sum, file) => sum + (file.size || 0), 0);
  const wastedSpace = (totalSize / group.count) * (group.count - 1);

  const getFilePath = (file: DuplicateFile) => file.currentPath || file.path || '';

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
          {group.files.map((file, index) => {
            const filePath = getFilePath(file);
            return (
              <div
                key={filePath || index}
                className={`flex items-center justify-between rounded-md border p-3 ${
                  index === 0 ? 'bg-green-50 border-green-200' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs bg-green-100">Keep</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{filePath}</p>
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
                      title="Preview file"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {index > 0 && onDelete && filePath && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(filePath)}
                      className="text-destructive hover:text-destructive"
                      title="Delete this duplicate"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {onDelete && group.files.length > 1 && (
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              if (confirm(`Delete all ${group.files.length - 1} duplicate(s)? This cannot be undone.`)) {
                group.files.slice(1).forEach((file) => {
                  const filePath = getFilePath(file);
                  if (filePath) {
                    onDelete(filePath);
                  }
                });
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All Duplicates ({group.files.length - 1} files)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

