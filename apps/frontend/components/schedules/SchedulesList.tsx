'use client';

import { ScheduleCard } from './ScheduleCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Calendar } from 'lucide-react';
import type { Schedule } from '@/lib/api/schedules';

interface SchedulesListProps {
  schedules: Schedule[];
  onToggle: (name: string, enabled: boolean) => void;
  onTrigger: (name: string) => void;
}

export function SchedulesList({
  schedules,
  onToggle,
  onTrigger,
}: SchedulesListProps) {
  if (schedules.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-12 w-12" />}
        title="No schedules found"
        description="No scheduled tasks configured"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {schedules.map((schedule) => (
        <ScheduleCard
          key={schedule.name}
          schedule={schedule}
          onToggle={onToggle}
          onTrigger={onTrigger}
        />
      ))}
    </div>
  );
}

