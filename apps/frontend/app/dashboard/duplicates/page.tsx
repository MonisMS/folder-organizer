'use client';

import { DuplicateScanner } from '@/components/duplicates/DuplicateScanner';
import { DuplicateGroups } from '@/components/duplicates/DuplicateGroups';
import { useDuplicates } from '@/lib/hooks/useDuplicate';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { FilePreview } from '@/components/files/FilePreview';
import { useState } from 'react';
import type { FileInfo } from '@file-manager/shared';
import { toast } from 'sonner';

export default function DuplicatesPage() {
  const { data, isLoading, error } = useDuplicates();
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);

  const handleDelete = (filePath: string) => {
    // TODO: Implement delete API call
    toast.info('Delete functionality will be implemented');
  };

  const handlePreview = (file: FileInfo) => {
    setPreviewFile(file);
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
        onPreview={handlePreview}
      />

      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}

