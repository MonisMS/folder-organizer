'use client';

import React, { useState } from 'react';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { OrganizeFilesHero } from '@/components/dashboard/OrganizeFilesHero';
import { OrganizationPreview } from '@/components/dashboard/OrganizationPreview';
import { ActiveOrganizationCard } from '@/components/dashboard/ActiveOrganizationCard';
import { UndoOrganizationCard } from '@/components/dashboard/UndoOrganizationCard';
import { useAllFiles } from '@/lib/hooks/useFiles';
import { getRecentOperations, classifyFiles, organizeFiles } from '@/lib/api/files';
import { listOrganizeJobs, listDuplicateJobs } from '@/lib/api/jobs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileInfo } from '@file-manager/shared';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [previewData, setPreviewData] = useState<{
    totalFiles: number;
    categories: Record<string, FileInfo[]>;
  } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [sourcePath, setSourcePath] = useState<string>('');
  const [targetPath, setTargetPath] = useState<string>('');

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
    duplicates: 0, 
    activeJobs: allJobs.filter((job: any) => 
      job.state === 'active' || job.state === 'waiting'
    ).length,
    schedules: 0, 
  };

  const handlePreview = async (source: string, target: string) => {
    setIsPreviewLoading(true);
    setSourcePath(source);
    setTargetPath(target);
    try {
      const data = await classifyFiles(source);
      setPreviewData(data);
      toast.success('Files analyzed successfully');
    } catch (error) {
      toast.error('Failed to analyze files');
      console.error(error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleOrganize = async () => {
    if (!sourcePath || !targetPath) return;
    
    try {
      const result = await organizeFiles(sourcePath, targetPath);
      if (result.jobId) {
        setActiveJobId(result.jobId);
        setPreviewData(null); // Hide preview
        toast.success('Organization started');
        queryClient.invalidateQueries({ queryKey: ['organize-jobs'] });
      }
    } catch (error) {
      toast.error('Failed to start organization');
      console.error(error);
    }
  };

  const handleJobComplete = () => {
    setActiveJobId(null);
    toast.success('Organization completed!');
    queryClient.invalidateQueries({ queryKey: ['recent-operations'] });
    queryClient.invalidateQueries({ queryKey: ['files'] });
    queryClient.invalidateQueries({ queryKey: ['organize-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['undoable-files'] });
  };

  const handleUndoComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['recent-operations'] });
    queryClient.invalidateQueries({ queryKey: ['files'] });
  };

  const handleCancelPreview = () => {
    setPreviewData(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Organize and manage your files efficiently
        </p>
      </div>

      <OrganizeFilesHero 
        onPreview={handlePreview} 
        isLoading={isPreviewLoading} 
      />

      {previewData && (
        <OrganizationPreview 
          data={previewData} 
          onOrganize={handleOrganize}
          onCancel={handleCancelPreview}
          isOrganizing={!!activeJobId}
        />
      )}

      {activeJobId && (
        <ActiveOrganizationCard 
          jobId={activeJobId} 
          onComplete={handleJobComplete} 
        />
      )}

      <UndoOrganizationCard onUndoComplete={handleUndoComplete} />

      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        <StatsCards stats={stats} isLoading={filesLoading || organizeJobsLoading} />
      </div>

      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <RecentActivity operations={operations || null} isLoading={operationsLoading} />
      </div>
    </div>
  );
}

