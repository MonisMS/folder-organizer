'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const statItems = [
    {
      title: 'Total Files',
      value: stats?.totalFiles ?? 0,
      icon: FolderOpen,
      description: 'Organized files',
      color: 'text-blue-500',
    },
    {
      title: 'Duplicates',
      value: stats?.duplicates ?? 0,
      icon: Copy,
      description: 'Duplicate groups found',
      color: 'text-orange-500',
    },
    {
      title: 'Active Jobs',
      value: stats?.activeJobs ?? 0,
      icon: Briefcase,
      description: 'Running tasks',
      color: 'text-green-500',
    },
    {
      title: 'Schedules',
      value: stats?.schedules ?? 0,
      icon: Calendar,
      description: 'Active schedules',
      color: 'text-purple-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="mt-2 h-4 w-32" />
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
        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <Icon className={`h-4 w-4 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

