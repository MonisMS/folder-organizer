'use client';

import { useState, useEffect } from 'react';
import { JobsList } from '@/components/jobs/JobsList';
import { JobLogs } from '@/components/jobs/JobLogs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listOrganizeJobs, listDuplicateJobs, cancelJob } from '@/lib/api/jobs';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { JobStatus } from '@/lib/api/jobs';

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [electronStatus, setElectronStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const queryClient = useQueryClient();

  // Check if Electron API is available
  useEffect(() => {
    const checkElectron = () => {
      const api = (window as any).api;
      if (api?.jobs) {
        console.log('[Jobs Page] ✅ Electron API is available');
        setElectronStatus('available');
      } else {
        console.log('[Jobs Page] ❌ Electron API NOT available. window.api =', api);
        setElectronStatus('unavailable');
      }
    };
    
    // Check immediately and after a short delay (in case preload is slow)
    checkElectron();
    const timer = setTimeout(checkElectron, 1000);
    return () => clearTimeout(timer);
  }, []);

  const { data: organizeJobs, isLoading: organizeLoading, error: organizeError, isError: isOrganizeError } = useQuery({
    queryKey: ['organize-jobs'],
    queryFn: async () => {
      console.log('[Jobs Page] Fetching organize jobs...');
      try {
        const result = await listOrganizeJobs();
        console.log('[Jobs Page] Organize jobs result:', result);
        return result;
      } catch (err) {
        console.error('[Jobs Page] Failed to fetch organize jobs:', err);
        throw err;
      }
    },
    refetchInterval: 5000,
    retry: false,
  });

  const { data: duplicateJobs, isLoading: duplicateLoading, error: duplicateError, isError: isDuplicateError } = useQuery({
    queryKey: ['duplicate-jobs'],
    queryFn: async () => {
      console.log('[Jobs Page] Fetching duplicate jobs...');
      try {
        const result = await listDuplicateJobs();
        console.log('[Jobs Page] Duplicate jobs result:', result);
        return result;
      } catch (err) {
        console.error('[Jobs Page] Failed to fetch duplicate jobs:', err);
        throw err;
      }
    },
    refetchInterval: 5000,
    retry: false,
  });

  // Log errors for debugging
  if (organizeError) {
    console.error('Failed to load organize jobs:', organizeError);
  }
  if (duplicateError) {
    console.error('Failed to load duplicate jobs:', duplicateError);
  }

  const cancelMutation = useMutation({
    mutationFn: cancelJob,
    onSuccess: () => {
      toast.success('Job cancelled');
      queryClient.invalidateQueries({ queryKey: ['organize-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['duplicate-jobs'] });
    },
    onError: (error: any) => {
      const errorMsg = error.message || error.response?.data?.error || 'Failed to cancel job';
      toast.error(errorMsg);
    },
  });

  const allJobs: JobStatus[] = [
    ...(organizeJobs?.jobs || []),
    ...(duplicateJobs?.jobs || []),
  ].sort((a, b) => {
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

  const statusCounts = {
    all: allJobs.length,
    waiting: allJobs.filter(j => j.state === 'waiting').length,
    active: allJobs.filter(j => j.state === 'active').length,
    completed: allJobs.filter(j => j.state === 'completed').length,
    failed: allJobs.filter(j => j.state === 'failed').length,
  };

  return (
    <div className="space-y-6">
      {/* Debug: Electron API Status */}
      <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
        electronStatus === 'available' 
          ? 'bg-green-50 text-green-700 border border-green-200' 
          : electronStatus === 'unavailable'
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      }`}>
        {electronStatus === 'available' ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>Desktop mode: Using Electron IPC for job management</span>
          </>
        ) : electronStatus === 'unavailable' ? (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>⚠️ Electron API not detected - jobs won&apos;t work in browser mode. Run the desktop app.</span>
          </>
        ) : (
          <span>Checking Electron API...</span>
        )}
      </div>

      {/* Show errors if any */}
      {(isOrganizeError || isDuplicateError) && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <div className="font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Error loading jobs
          </div>
          {organizeError && <p className="text-sm mt-1">Organize: {(organizeError as Error).message}</p>}
          {duplicateError && <p className="text-sm mt-1">Duplicate: {(duplicateError as Error).message}</p>}
        </div>
      )}

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

