'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { History } from 'lucide-react';

interface Operation {
  id: number;
  action: string;
  timestamp: string;
  fileId?: number;
  metadata?: string;
}

interface RecentActivityProps {
  operations: Operation[] | null;
  isLoading: boolean;
}

const actionColors: Record<string, string> = {
  scanned: 'bg-blue-500/10 text-blue-500',
  moved: 'bg-green-500/10 text-green-500',
  organized: 'bg-purple-500/10 text-purple-500',
  deleted: 'bg-red-500/10 text-red-500',
  undone: 'bg-gray-500/10 text-gray-500',
};

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
              <TableHead>Action</TableHead>
              <TableHead>File ID</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.map((op) => (
              <TableRow key={op.id}>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={actionColors[op.action.toLowerCase()] || 'bg-gray-500/10 text-gray-500'}
                  >
                    {op.action}
                  </Badge>
                </TableCell>
                <TableCell>{op.fileId || '-'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatRelativeTime(op.timestamp)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

