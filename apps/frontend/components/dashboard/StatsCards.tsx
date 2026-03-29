'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen, Copy, Briefcase, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardsProps {
  stats: {
    totalFiles: number;
    duplicates: number;
    activeJobs: number;
    schedules: number;
  } | null;
  isLoading: boolean;
}

const statItems = [
  {
    title: 'Total Files',
    key: 'totalFiles' as const,
    icon: FolderOpen,
    description: 'Organized files',
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-500',
  },
  {
    title: 'Duplicates',
    key: 'duplicates' as const,
    icon: Copy,
    description: 'Duplicate groups found',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
  {
    title: 'Active Jobs',
    key: 'activeJobs' as const,
    icon: Briefcase,
    description: 'Running tasks',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    title: 'Schedules',
    key: 'schedules' as const,
    icon: Calendar,
    description: 'Active schedules',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
  },
];

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <Card key={item.title} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        const value = stats?.[item.key] ?? 0;
        return (
          <Card
            key={item.title}
            className="overflow-hidden card-hover cursor-default border-border/60"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.title}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {value.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.iconBg}`}>
                  <Icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
