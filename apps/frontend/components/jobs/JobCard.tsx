'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatRelativeTime } from '@/lib/utils';
import { X, Eye, Clock, CheckCircle2, XCircle, Loader2, FolderInput, FolderOutput, FileStack, Files } from 'lucide-react';
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
  waiting: 'border-yellow-200 bg-yellow-50/50',
  active: 'border-blue-200 bg-blue-50/50',
  completed: 'border-green-200 bg-green-50/50',
  failed: 'border-red-200 bg-red-50/50',
};

const stateBadgeColors: Record<string, string> = {
  waiting: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  active: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-600 border-green-500/20',
  failed: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const stateLabels: Record<string, string> = {
  waiting: 'Waiting in Queue',
  active: 'Processing...',
  completed: 'Completed Successfully',
  failed: 'Failed',
};

function getJobTypeInfo(name: string): { label: string; icon: React.ReactNode; description: string } {
  if (name.includes('organize') || name.includes('Organize')) {
    return {
      label: 'File Organization',
      icon: <Files className="h-5 w-5" />,
      description: 'Organizing files into categories',
    };
  }
  if (name.includes('duplicate') || name.includes('Duplicate')) {
    return {
      label: 'Duplicate Scan',
      icon: <FileStack className="h-5 w-5" />,
      description: 'Scanning for duplicate files',
    };
  }
  if (name.includes('scheduled')) {
    return {
      label: 'Scheduled Task',
      icon: <Clock className="h-5 w-5" />,
      description: 'Automated scheduled job',
    };
  }
  return {
    label: name,
    icon: <Files className="h-5 w-5" />,
    description: 'Background task',
  };
}

export function JobCard({ job, onCancel, onViewLogs }: JobCardProps) {
  const StateIcon = stateIcons[job.state] || Clock;
  const isActive = job.state === 'active' || job.state === 'waiting';
  const jobTypeInfo = getJobTypeInfo(job.name);

  // Extract meaningful data from job.data
  const sourcePath = job.data?.sourcePath;
  const targetPath = job.data?.targetPath;
  const scanPath = job.data?.path;

  // Extract result info
  const resultInfo = job.result ? {
    totalFiles: job.result.totalFiles,
    movedFiles: job.result.movedFiles,
    failedFiles: job.result.failedFiles,
    duplicatesFound: job.result.duplicatesFound,
  } : null;

  return (
    <Card className={`${stateColors[job.state]} transition-all hover:shadow-md`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${job.state === 'active' ? 'bg-blue-100' : job.state === 'completed' ? 'bg-green-100' : job.state === 'failed' ? 'bg-red-100' : 'bg-yellow-100'}`}>
              {jobTypeInfo.icon}
            </div>
            <div>
              <CardTitle className="text-base">{jobTypeInfo.label}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Job #{job.id}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={stateBadgeColors[job.state]}>
            <StateIcon className={`h-3 w-3 mr-1 ${job.state === 'active' ? 'animate-spin' : ''}`} />
            {job.state}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status message */}
        <p className="text-sm text-muted-foreground">
          {stateLabels[job.state]}
        </p>

        {/* Progress bar for active jobs */}
        {isActive && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="h-2" />
          </div>
        )}

        {/* Source/Target paths */}
        {(sourcePath || targetPath || scanPath) && (
          <div className="space-y-1.5 text-xs bg-muted/50 rounded-lg p-2">
            {sourcePath && (
              <div className="flex items-center gap-2">
                <FolderInput className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">From:</span>
                <span className="font-mono truncate" title={sourcePath}>{sourcePath}</span>
              </div>
            )}
            {targetPath && (
              <div className="flex items-center gap-2">
                <FolderOutput className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">To:</span>
                <span className="font-mono truncate" title={targetPath}>{targetPath}</span>
              </div>
            )}
            {scanPath && !sourcePath && (
              <div className="flex items-center gap-2">
                <FolderInput className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Scanning:</span>
                <span className="font-mono truncate" title={scanPath}>{scanPath}</span>
              </div>
            )}
          </div>
        )}

        {/* Results for completed jobs */}
        {job.state === 'completed' && resultInfo && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {resultInfo.totalFiles !== undefined && (
              <div className="bg-muted/50 rounded p-2">
                <p className="text-muted-foreground">Total Files</p>
                <p className="text-lg font-semibold">{resultInfo.totalFiles}</p>
              </div>
            )}
            {resultInfo.movedFiles !== undefined && (
              <div className="bg-green-100 rounded p-2">
                <p className="text-green-700">Files Moved</p>
                <p className="text-lg font-semibold text-green-700">{resultInfo.movedFiles}</p>
              </div>
            )}
            {resultInfo.failedFiles !== undefined && resultInfo.failedFiles > 0 && (
              <div className="bg-red-100 rounded p-2">
                <p className="text-red-700">Failed</p>
                <p className="text-lg font-semibold text-red-700">{resultInfo.failedFiles}</p>
              </div>
            )}
            {resultInfo.duplicatesFound !== undefined && (
              <div className="bg-amber-100 rounded p-2">
                <p className="text-amber-700">Duplicates Found</p>
                <p className="text-lg font-semibold text-amber-700">{resultInfo.duplicatesFound}</p>
              </div>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {job.timestamp && (
            <span>Created: {formatRelativeTime(new Date(job.timestamp))}</span>
          )}
          {job.processedOn && (
            <span>Started: {formatRelativeTime(new Date(job.processedOn))}</span>
          )}
          {job.finishedOn && (
            <span>Finished: {formatRelativeTime(new Date(job.finishedOn))}</span>
          )}
        </div>

        {/* Error message */}
        {job.failedReason && (
          <div className="rounded-md bg-red-100 border border-red-200 p-2 text-xs text-red-700">
            <p className="font-medium">Error:</p>
            <p className="mt-0.5">{job.failedReason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {onViewLogs && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewLogs(job.id)}
              className="h-8 text-xs"
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View Logs
            </Button>
          )}
          {isActive && onCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onCancel(job.id)}
              className="h-8 text-xs"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

