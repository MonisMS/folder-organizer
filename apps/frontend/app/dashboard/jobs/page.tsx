'use client';

import { useState } from 'react';
import { JobsList } from '@/components/jobs/JobsList';
import { JobLogs } from '@/components/jobs/JobLogs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listOrganizeJobs, listDuplicateJobs, cancelJob } from '@/lib/api/jobs';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from 'sonner';
import type { JobStatus } from '@/lib/api/jobs';

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: organizeJobs, isLoading: organizeLoading } = useQuery({
    queryKey: ['organize-jobs'],
    queryFn: listOrganizeJobs,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: duplicateJobs, isLoading: duplicateLoading } = useQuery({
    queryKey: ['duplicate-jobs'],
    queryFn: listDuplicateJobs,
    refetchInterval: 5000,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelJob,
    onSuccess: () => {
      toast.success('Job cancelled');
      queryClient.invalidateQueries({ queryKey: ['organize-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-jobs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel job');
    },
  });

  const allJobs: JobStatus[] = [
    ...(organizeJobs?.jobs || []),
    ...(duplicateJobs?.jobs || []),
  ].sort((a, b) => {
    // Sort by timestamp, most recent first
    const timeA = a.timestamp || 0;
    const timeB = b.timestamp || 0;
    return timeB - timeA;
  });

  const handleCancel = (jobId: string) => {
    if (confirm('Are you sure you want to cancel this job?')) {
      cancelMutation.mutate(jobId);
    }
  };

  const handleViewLogs = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  if (organizeLoading || duplicateLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading jobs..." />
      </div>
    );
  }

  // Count jobs by status
  const statusCounts = {
    all: allJobs.length,
    waiting: allJobs.filter(j => j.state === 'waiting').length,
    active: allJobs.filter(j => j.state === 'active').length,
    completed: allJobs.filter(j => j.state === 'completed').length,
    failed: allJobs.filter(j => j.state === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground">
          Monitor and manage background tasks
        </p>
        <div className="flex gap-4 mt-3 text-sm">
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{statusCounts.all}</span> total
          </span>
          {statusCounts.active > 0 && (
            <span className="text-blue-600">
              <span className="font-medium">{statusCounts.active}</span> active
            </span>
          )}
          {statusCounts.waiting > 0 && (
            <span className="text-yellow-600">
              <span className="font-medium">{statusCounts.waiting}</span> waiting
            </span>
          )}
          <span className="text-green-600">
            <span className="font-medium">{statusCounts.completed}</span> completed
          </span>
          {statusCounts.failed > 0 && (
            <span className="text-red-600">
              <span className="font-medium">{statusCounts.failed}</span> failed
            </span>
          )}
        </div>
      </div>

      <JobsList
        jobs={allJobs}
        onCancel={handleCancel}
        onViewLogs={handleViewLogs}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <JobLogs
        jobId={selectedJobId}
        onClose={() => setSelectedJobId(null)}
      />
    </div>
  );
}

