'use client';

import { DuplicateScanner } from '@/components/duplicates/DuplicateScanner';
import { DuplicateGroups } from '@/components/duplicates/DuplicateGroups';
import { useDuplicates } from '@/lib/hooks/useDuplicate';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteDuplicateFile } from '@/lib/api/duplicates';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function DuplicatesPage() {
  const { data, isLoading, error, refetch } = useDuplicates();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteDuplicateFile,
    onSuccess: () => {
      toast.success('File deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['duplicates'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete file');
    },
  });

  const handleDelete = (filePath: string) => {
    if (confirm(`Are you sure you want to delete this file?\n\n${filePath}\n\nThis action cannot be undone.`)) {
      deleteMutation.mutate(filePath);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading duplicates..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Duplicates</h1>
          <p className="text-muted-foreground">Find and manage duplicate files</p>
        </div>
        <div className="text-center text-destructive">
          Error loading duplicates: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  const groups = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Duplicates</h1>
        <p className="text-muted-foreground">
          Find and manage duplicate files to free up storage space
        </p>
      </div>

      <DuplicateScanner />

      <DuplicateGroups
        groups={groups}
        onDelete={handleDelete}
      />
    </div>
  );
}

