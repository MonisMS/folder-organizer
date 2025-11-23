'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface JobLogsProps {
  jobId: string | null;
  logs: string[] | null;
  isLoading: boolean;
  onClose: () => void;
}

export function JobLogs({ jobId, logs, isLoading, onClose }: JobLogsProps) {
  if (!jobId) return null;

  return (
    <Dialog open={!!jobId} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Job Logs</DialogTitle>
          <DialogDescription>
            Logs for job: <code className="text-xs">{jobId}</code>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] rounded-md border p-4">
          {isLoading ? (
            <LoadingSpinner text="Loading logs..." />
          ) : logs && logs.length > 0 ? (
            <div className="space-y-2 font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                  <span className="flex-1 break-words">{log}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No logs available
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

