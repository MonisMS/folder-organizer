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
  scanned: {
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
    icon: null,
  },
  moved: {
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    icon: <ArrowRight className="h-3 w-3" />,
  },
  organized: {
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400',
    icon: null,
  },
  deleted: {
    color: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
    icon: null,
  },
  undone: {
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    icon: <Undo2 className="h-3 w-3" />,
  },
};

function getFileName(path?: string): string {
  if (!path) return '';
  return path.split(/[/\\]/).pop() || path;
}

export function RecentActivity({ operations, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest file operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!operations || operations.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest file operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <History className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No recent activity</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Organize some files to see your history here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-muted-foreground" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest file operations</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="pl-6 w-[110px] text-xs">Action</TableHead>
              <TableHead className="text-xs">File</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="pr-6 text-right text-xs">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.map((op) => {
              const config = actionConfig[op.action.toLowerCase()] ?? {
                color: 'bg-muted text-muted-foreground border-border',
                icon: null,
              };
              const fileName =
                op.fileName || getFileName(op.currentPath) || `File #${op.fileId}`;

              return (
                <TableRow
                  key={op.id}
                  className="border-border/40 transition-colors duration-100 hover:bg-muted/40"
                >
                  <TableCell className="pl-6">
                    <Badge
                      variant="outline"
                      className={`${config.color} flex w-fit items-center gap-1 text-[11px] font-medium`}
                    >
                      {config.icon}
                      {op.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                      <span
                        className="max-w-[200px] truncate text-sm font-medium"
                        title={fileName}
                      >
                        {fileName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {op.category ? (
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-normal"
                      >
                        {op.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-6 text-right text-xs text-muted-foreground">
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
