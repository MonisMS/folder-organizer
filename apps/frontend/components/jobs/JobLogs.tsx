'use client';

import { useEffect, useState } from 'react';
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
import { getJobLogs } from '@/lib/api/jobs';
import { CheckCircle2, XCircle, Info, AlertTriangle, FileText } from 'lucide-react';

interface JobLogsProps {
  jobId: string | null;
  onClose: () => void;
}

function getLogIcon(log: string) {
  if (log.includes('✅') || log.includes('Successfully') || log.includes('Moved:')) {
    return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />;
  }
  if (log.includes('❌') || log.includes('Failed') || log.includes('Error')) {
    return <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />;
  }
  if (log.includes('⚠') || log.includes('Warning')) {
    return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  }
  if (log.includes('📂') || log.includes('📋') || log.includes('📦')) {
    return <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
  }
  return <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
}

function formatLog(log: string): string {
  // Remove emoji prefixes for cleaner display (since we use icons)
  return log.replace(/^[📂📋📦✅❌⚠️🔍]\s*/, '').trim();
}

export function JobLogs({ jobId, onClose }: JobLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setLogs([]);
      return;
    }

    const fetchLogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getJobLogs(jobId);
        setLogs(response.logs || []);
      } catch {
        setError('Failed to fetch logs');
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [jobId]);

  if (!jobId) return null;

  return (
    <Dialog open={!!jobId} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Job Logs
          </DialogTitle>
          <DialogDescription>
            Activity log for job #{jobId}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] rounded-md border bg-muted/30">
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Loading logs..." />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500">{error}</p>
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Badge 
                      variant="outline" 
                      className="text-[10px] px-1.5 py-0 h-5 shrink-0 tabular-nums"
                    >
                      {index + 1}
                    </Badge>
                    {getLogIcon(log)}
                    <span className="text-sm wrap-break-word flex-1">
                      {formatLog(log)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground font-medium">No logs available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Logs are generated during job execution
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {logs.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>{logs.length} log entries</span>
            <span>Job #{jobId}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

