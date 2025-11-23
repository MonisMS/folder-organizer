'use client';

import { JobCard } from './JobCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Briefcase } from 'lucide-react';
import type { JobStatus } from '@/lib/api/jobs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface JobsListProps {
  jobs: JobStatus[];
  onCancel?: (jobId: string) => void;
  onViewLogs?: (jobId: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function JobsList({
  jobs,
  onCancel,
  onViewLogs,
  statusFilter,
  onStatusFilterChange,
}: JobsListProps) {
  const filteredJobs = statusFilter && statusFilter !== 'all'
    ? jobs.filter((job) => job.state === statusFilter)
    : jobs;

  if (filteredJobs.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase className="h-12 w-12" />}
        title="No jobs found"
        description={statusFilter ? `No ${statusFilter} jobs` : 'No jobs in queue'}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label htmlFor="status-filter">Filter by status</Label>
        <Select value={statusFilter || 'all'} onValueChange={onStatusFilterChange}>
          <SelectTrigger id="status-filter" className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="waiting">Waiting</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onCancel={onCancel}
            onViewLogs={onViewLogs}
          />
        ))}
      </div>
    </div>
  );
}

