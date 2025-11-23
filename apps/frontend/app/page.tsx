'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useScanFiles } from '@/lib/hooks/useFiles';
import { FileList } from '@/components/files/FileList';

export default function HomePage() {
  const [path, setPath] = useState('');
  const [scanPath, setScanPath] = useState('');

  const { data, isLoading, error } = useScanFiles(scanPath);

  const handleScan = () => {
    if (path.trim()) {
      setScanPath(path);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>File Scanner</CardTitle>
          <CardDescription>Scan a directory to see all files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter directory path (e.g., C:\Users\YourName\Documents)"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            />
            <Button onClick={handleScan} disabled={!path.trim()}>
              Scan
            </Button>
          </div>

          {error && (
            <div className="mt-4 text-red-500">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          )}

          {isLoading && <div className="mt-4">Scanning...</div>}

          {data && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Found {data.totalFiles} files in {data.scannedPath}
              </p>
              <FileList files={data.files} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}