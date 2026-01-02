'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Briefcase, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/utils';

interface Job {
  id: string;
  name: string;
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  data: any;
  processedOn?: number;
}

interface ActiveJobsWidgetProps {
  jobs: Job[] | null;
  isLoading: boolean;
}

const stateColors: Record<string, string> = {
  waiting: 'bg-yellow-500/10 text-yellow-500',
  active: 'bg-blue-500/10 text-blue-500',
  completed: 'bg-green-500/10 text-green-500',
  failed: 'bg-red-500/10 text-red-500',
};

export function ActiveJobsWidget({ jobs, isLoading }: ActiveJobsWidgetProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Active Jobs
          </CardTitle>
          <CardDescription>Background tasks in progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeJobs = jobs?.filter((job) => 
    job.state === 'active' || job.state === 'waiting'
  ) || [];

  if (activeJobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Active Jobs
          </CardTitle>
          <CardDescription>Background tasks in progress</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">No active jobs</p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/dashboard/jobs')}
          >
            View All Jobs
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Active Jobs
        </CardTitle>
        <CardDescription>Background tasks in progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeJobs.slice(0, 3).map((job) => (
          <div key={job.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{job.name}</span>
                <Badge
                  variant="outline"
                  className={stateColors[job.state] || 'bg-gray-500/10 text-gray-500'}
                >
                  {job.state}
                </Badge>
              </div>
              {job.processedOn && (
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(new Date(job.processedOn))}
                </span>
              )}
            </div>
            {job.state === 'active' && (
              <Progress value={job.progress} className="h-2" />
            )}
          </div>
        ))}
        {activeJobs.length > 3 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/dashboard/jobs')}
          >
            View All Jobs ({activeJobs.length})
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

