'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Copy, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: 'Scan Files',
      description: 'Scan a directory to see all files',
      icon: FolderOpen,
      onClick: () => router.push('/dashboard/files'),
      variant: 'default' as const,
    },
    {
      title: 'Find Duplicates',
      description: 'Detect duplicate files in a directory',
      icon: Copy,
      onClick: () => router.push('/dashboard/duplicates'),
      variant: 'outline' as const,
    },
    {
      title: 'View Jobs',
      description: 'Monitor background tasks',
      icon: Zap,
      onClick: () => router.push('/dashboard/jobs'),
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant}
                className="h-auto flex-col items-start gap-2 p-4"
                onClick={action.onClick}
              >
                <Icon className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

