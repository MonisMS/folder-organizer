'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { undoOrganization, getUndoableFiles, type UndoableFile } from '@/lib/api/files';
import { Undo2, CheckCircle2, AlertCircle, Loader2, FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UndoOrganizationCardProps {
  onUndoComplete?: () => void;
}

export function UndoOrganizationCard({ onUndoComplete }: UndoOrganizationCardProps) {
  const [undoableFiles, setUndoableFiles] = useState<UndoableFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUndoing, setIsUndoing] = useState(false);
  const [completedState, setCompletedState] = useState<{
    undoneCount: number;
    failedCount: number;
  } | null>(null);

  const loadUndoableFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getUndoableFiles();
      setUndoableFiles(result.files);
      // Clear completed state if new files appear
      if (result.files.length > 0) {
        setCompletedState(null);
      }
    } catch (error) {
      console.error('Failed to load undoable files:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUndoableFiles();
  }, [loadUndoableFiles]);

  const handleUndoAll = async () => {
    setIsUndoing(true);
    try {
      const result = await undoOrganization();
      setCompletedState({
        undoneCount: result.undoneCount,
        failedCount: result.failedCount,
      });
      setUndoableFiles([]); // Clear the list immediately
      
      if (result.success) {
        if (result.undoneCount > 0) {
          toast.success(`Successfully restored ${result.undoneCount} files to original locations`);
        } else if (result.skippedCount && result.skippedCount > 0) {
          toast.info(`${result.skippedCount} files were already at their original locations`);
        } else {
          toast.info('No files needed to be restored');
        }
      } else {
        toast.warning(`Restored ${result.undoneCount} files, ${result.failedCount} failed`);
      }
      
      onUndoComplete?.();
    } catch (error) {
      toast.error('Failed to undo organization');
      console.error(error);
    } finally {
      setIsUndoing(false);
    }
  };

  const handleUndoSingle = async (fileId: number, fileName: string) => {
    try {
      const result = await undoOrganization({ fileId });
      if (result.success) {
        toast.success(`Restored: ${fileName}`);
        // Remove this file from the local list
        setUndoableFiles(prev => prev.filter(f => f.id !== fileId));
        onUndoComplete?.();
      } else {
        toast.error(`Failed to restore: ${fileName}`);
      }
    } catch {
      toast.error(`Failed to restore: ${fileName}`);
    }
  };

  const handleDismiss = () => {
    setCompletedState(null);
  };

  if (isLoading) {
    return null; // Don't show loading state, just hide the card
  }

  // Show success/completion state
  if (completedState && undoableFiles.length === 0) {
    return (
      <Card className="w-full border-green-200 bg-green-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {completedState.failedCount === 0 ? (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-amber-600" />
              )}
              <div>
                <p className="font-medium text-green-800">
                  {completedState.failedCount === 0 
                    ? 'All files restored successfully!' 
                    : 'Undo completed with some errors'}
                </p>
                <p className="text-sm text-green-600">
                  {completedState.undoneCount} file{completedState.undoneCount !== 1 ? 's' : ''} moved back to original location
                  {completedState.failedCount > 0 && `, ${completedState.failedCount} failed`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show card if nothing to undo
  if (undoableFiles.length === 0) {
    return null;
  }

  return (
    <Card className="w-full border-amber-200 bg-amber-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Undo2 className="h-5 w-5" />
              Undo Recent Organization
            </CardTitle>
            <CardDescription>
              {undoableFiles.length} file{undoableFiles.length !== 1 ? 's' : ''} can be restored to original location
            </CardDescription>
          </div>
          <Button 
            onClick={handleUndoAll} 
            disabled={isUndoing}
            variant="outline"
            className="border-amber-300 hover:bg-amber-100"
          >
            {isUndoing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <Undo2 className="mr-2 h-4 w-4" />
                Undo All
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {undoableFiles.slice(0, 10).map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-2 rounded-lg bg-white border"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {file.category} • {formatRelativeTime(file.organizedAt)}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleUndoSingle(file.id, file.name)}
                  className="shrink-0"
                >
                  <Undo2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {undoableFiles.length > 10 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                +{undoableFiles.length - 10} more files
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
