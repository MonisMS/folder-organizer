'use client';

import { SchedulesList } from '@/components/schedules/SchedulesList';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSchedules,
  startSchedule,
  stopSchedule,
  triggerSchedule,
} from '@/lib/api/schedules';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';

export default function SchedulesPage() {
  const queryClient = useQueryClient();

  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ['schedules'],
    queryFn: getSchedules,
  });

  const startMutation = useMutation({
    mutationFn: startSchedule,
    onSuccess: () => {
      toast.success('Schedule started');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to start schedule');
    },
  });

  const stopMutation = useMutation({
    mutationFn: stopSchedule,
    onSuccess: () => {
      toast.success('Schedule stopped');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to stop schedule');
    },
  });

  const triggerMutation = useMutation({
    mutationFn: triggerSchedule,
    onSuccess: () => {
      toast.success('Schedule triggered');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to trigger schedule');
    },
  });

  const handleToggle = (name: string, enabled: boolean) => {
    if (enabled) {
      startMutation.mutate(name);
    } else {
      stopMutation.mutate(name);
    }
  };

  const handleTrigger = (name: string) => {
    triggerMutation.mutate(name);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading schedules..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedules</h1>
          <p className="text-muted-foreground">Manage scheduled tasks</p>
        </div>
        <div className="text-center text-destructive">
          Error loading schedules: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedules</h1>
          <p className="text-muted-foreground">
            Manage automated tasks ({schedules?.length || 0} schedules)
          </p>
        </div>
      </div>

      {schedules && schedules.length > 0 && (
        <SchedulesList
          schedules={schedules}
          onToggle={handleToggle}
          onTrigger={handleTrigger}
        />
      )}
    </div>
  );
}

