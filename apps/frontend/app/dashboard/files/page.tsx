'use client';

import { useState, useMemo } from 'react';
import { FileTable } from '@/components/files/FileTable';
import { FileFilters } from '@/components/files/FileFilters';
import { useAllFiles } from '@/lib/hooks/useFiles';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function FilesPage() {
  const { data: files, isLoading, error } = useAllFiles();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [extensionFilter, setExtensionFilter] = useState('');

  const filteredFiles = useMemo(() => {
    if (!files) return [];

    return files.filter((file) => {
      const matchesSearch =
        searchQuery === '' ||
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.path.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === '' || categoryFilter === 'all' || file.extension.toLowerCase() === categoryFilter.toLowerCase();

      const matchesExtension =
        extensionFilter === '' ||
        file.extension.toLowerCase().includes(extensionFilter.toLowerCase());

      return matchesSearch && matchesCategory && matchesExtension;
    });
  }, [files, searchQuery, categoryFilter, extensionFilter]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading files..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <EmptyState
          title="Error loading files"
          description={error instanceof Error ? error.message : 'An error occurred'}
        />
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Files</h1>
          <p className="text-muted-foreground">Browse and manage your organized files</p>
        </div>
        <EmptyState
          icon={<FolderOpen className="h-12 w-12" />}
          title="No files found"
          description="Start by organizing some files to see them here"
          action={{
            label: 'Go to Dashboard',
            onClick: () => router.push('/dashboard'),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Files</h1>
        <p className="text-muted-foreground">
          Browse and manage your organized files ({filteredFiles.length} files)
        </p>
      </div>

      <FileFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        extensionFilter={extensionFilter}
        onExtensionChange={setExtensionFilter}
      />

      <FileTable files={filteredFiles} />
    </div>
  );
}

