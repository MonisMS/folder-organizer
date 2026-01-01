import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getJobStatus, type JobStatus } from '@/lib/api/jobs';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ActiveOrganizationCardProps {
  jobId: string;
  onComplete?: () => void;
}

export function ActiveOrganizationCard({ jobId, onComplete }: ActiveOrganizationCardProps) {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getJobStatus(jobId);
        setJob(status);

        if (status.state === 'completed' || status.state === 'failed') {
          clearInterval(intervalId);
          if (status.state === 'completed') {
            onComplete?.();
          }
        }
      } catch {
        setError('Failed to track job progress');
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 1000);

    return () => clearInterval(intervalId);
  }, [jobId, onComplete]);

  if (error) {
    return (
      <Card className="w-full mt-6 border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card className="w-full mt-6">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-6 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-base">
          <span>Organizing Files...</span>
          <span className="text-sm font-normal text-muted-foreground">
            {job.state.toUpperCase()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={job.progress} className="h-2" />
        
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Job ID: {job.id}</span>
          <Link href={`/dashboard/jobs`} className="text-blue-600 hover:underline">
            View Details
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
