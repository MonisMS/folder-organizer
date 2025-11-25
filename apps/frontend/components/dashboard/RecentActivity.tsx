'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { History, FileIcon, ArrowRight, Undo2 } from 'lucide-react';

interface Operation {
  id: number;
  action: string;
  timestamp: string;
  fileId?: number;
  metadata?: string;
  fileName?: string;
  category?: string;
  originalPath?: string;
  currentPath?: string;
}

interface RecentActivityProps {
  operations: Operation[] | null;
  isLoading: boolean;
}

const actionConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  scanned: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: null },
  moved: { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: <ArrowRight className="h-3 w-3" /> },
  organized: { color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: null },
  deleted: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: null },
  undone: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: <Undo2 className="h-3 w-3" /> },
};

function getFileName(path?: string): string {
  if (!path) return '';
  return path.split(/[/\\]/).pop() || path;
}

export function RecentActivity({ operations, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest file operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!operations || operations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest file operations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest file operations</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Action</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.map((op) => {
              const config = actionConfig[op.action.toLowerCase()] || { 
                color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', 
                icon: null 
              };
              const fileName = op.fileName || getFileName(op.currentPath) || `File #${op.fileId}`;
              
              return (
                <TableRow key={op.id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${config.color} flex items-center gap-1 w-fit`}
                    >
                      {config.icon}
                      {op.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate max-w-[200px]" title={fileName}>
                        {fileName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {op.category ? (
                      <Badge variant="secondary" className="font-normal">
                        {op.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatRelativeTime(op.timestamp)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

