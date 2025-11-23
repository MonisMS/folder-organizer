'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatRelativeTime } from '@/lib/utils';
import { X, Eye, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { JobStatus } from '@/lib/api/jobs';

interface JobCardProps {
  job: JobStatus;
  onCancel?: (jobId: string) => void;
  onViewLogs?: (jobId: string) => void;
}

const stateIcons = {
  waiting: Clock,
  active: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

const stateColors: Record<string, string> = {
  waiting: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  active: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  failed: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function JobCard({ job, onCancel, onViewLogs }: JobCardProps) {
  const StateIcon = stateIcons[job.state] || Clock;
  const isActive = job.state === 'active' || job.state === 'waiting';

  return (
    <Card className={stateColors[job.state]}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <StateIcon className={`h-5 w-5 ${isActive ? 'animate-spin' : ''}`} />
              {job.name}
            </CardTitle>
            <CardDescription className="mt-1">
              Queue: {job.queue} • ID: {job.id}
            </CardDescription>
          </div>
          <Badge variant="outline" className={stateColors[job.state]}>
            {job.state}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="h-2" />
          </div>
        )}

        {job.processedOn && (
          <div className="text-sm text-muted-foreground">
            Started: {formatRelativeTime(new Date(job.processedOn))}
          </div>
        )}

        {job.finishedOn && (
          <div className="text-sm text-muted-foreground">
            Finished: {formatRelativeTime(new Date(job.finishedOn))}
          </div>
        )}

        {job.failedReason && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {job.failedReason}
          </div>
        )}

        {job.result && (
          <div className="rounded-md bg-muted p-3 text-sm">
            <div className="font-medium mb-1">Result:</div>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(job.result, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex items-center gap-2">
          {onViewLogs && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewLogs(job.id)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Logs
            </Button>
          )}
          {isActive && onCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onCancel(job.id)}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

