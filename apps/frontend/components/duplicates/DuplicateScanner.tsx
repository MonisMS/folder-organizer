'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useScanDuplicates } from '@/lib/hooks/useDuplicate';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function DuplicateScanner() {
  const [path, setPath] = useState('');
  const { mutate: scan, isPending } = useScanDuplicates();
  const router = useRouter();

  const handleScan = () => {
    if (!path.trim()) {
      toast.error('Please enter a directory path');
      return;
    }

    scan(path, {
      onSuccess: (data) => {
        toast.success('Duplicate scan job created');
        if (data.jobId) {
          router.push(`/dashboard/jobs?jobId=${data.jobId}`);
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to start scan');
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Scan for Duplicates
        </CardTitle>
        <CardDescription>
          Enter a directory path to scan for duplicate files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="path">Directory Path</Label>
          <Input
            id="path"
            placeholder="C:\Users\YourName\Documents"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            disabled={isPending}
          />
        </div>
        <Button onClick={handleScan} disabled={isPending || !path.trim()} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting scan...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Start Scan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

