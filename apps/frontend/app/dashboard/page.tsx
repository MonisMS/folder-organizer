'use client';

import { StatsCards } from '@/components/dashboard/StatsCards';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ActiveJobsWidget } from '@/components/dashboard/ActiveJobsWidget';
import { useAllFiles } from '@/lib/hooks/useFiles';
import { getRecentOperations } from '@/lib/api/files';
import { listOrganizeJobs, listDuplicateJobs } from '@/lib/api/jobs';
import { useQuery } from '@tanstack/react-query';

export default function DashboardPage() {
  const { data: files, isLoading: filesLoading } = useAllFiles();
  const { data: operations, isLoading: operationsLoading } = useQuery({
    queryKey: ['recent-operations'],
    queryFn: () => getRecentOperations(10),
  });
  
  const { data: organizeJobs, isLoading: organizeJobsLoading } = useQuery({
    queryKey: ['organize-jobs'],
    queryFn: listOrganizeJobs,
  });
  
  const { data: duplicateJobs, isLoading: duplicateJobsLoading } = useQuery({
    queryKey: ['duplicate-jobs'],
    queryFn: listDuplicateJobs,
  });

  const allJobs = [
    ...(organizeJobs?.jobs || []),
    ...(duplicateJobs?.jobs || []),
  ];

  const stats = {
    totalFiles: files?.length || 0,
    duplicates: 0, // Will be calculated from duplicates API
    activeJobs: allJobs.filter((job: any) => 
      job.state === 'active' || job.state === 'waiting'
    ).length,
    schedules: 0, // Will be calculated from schedules API
  };

  const isLoading = filesLoading || organizeJobsLoading || duplicateJobsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your file management system
        </p>
      </div>

      <StatsCards stats={stats} isLoading={isLoading} />
      
      <div className="grid gap-6 md:grid-cols-2">
        <QuickActions />
        <ActiveJobsWidget jobs={allJobs} isLoading={organizeJobsLoading || duplicateJobsLoading} />
      </div>

      <RecentActivity operations={operations || null} isLoading={operationsLoading} />
    </div>
  );
}

