'use client';

import { useState } from 'react';
import { JobsList } from '@/components/jobs/JobsList';
import { JobLogs } from '@/components/jobs/JobLogs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listOrganizeJobs, listDuplicateJobs, cancelJob, getJobStatus } from '@/lib/api/jobs';
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
  });

  const { data: duplicateJobs, isLoading: duplicateLoading } = useQuery({
    queryKey: ['duplicate-jobs'],
    queryFn: listDuplicateJobs,
  });

  const { data: selectedJob, isLoading: jobLoading } = useQuery({
    queryKey: ['job', selectedJobId],
    queryFn: () => getJobStatus(selectedJobId!),
    enabled: !!selectedJobId,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job?.state === 'active' || job?.state === 'waiting') {
        return 2000;
      }
      return false;
    },
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
  ];

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground">
          Monitor and manage background tasks ({allJobs.length} jobs)
        </p>
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
        logs={null} // TODO: Implement job logs API endpoint
        isLoading={jobLoading}
        onClose={() => setSelectedJobId(null)}
      />
    </div>
  );
}

