'use client';

import type { FileInfo } from '@file-manager/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatFileSize, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FilePreviewProps {
  file: FileInfo;
  onClose: () => void;
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(
    file.extension.toLowerCase().replace('.', '')
  );

  return (
    <Dialog open={!!file} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{file.name}</DialogTitle>
          <DialogDescription>File details and preview</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isImage && (
            <div className="flex items-center justify-center rounded-md border bg-muted p-4">
              <img
                src={file.path}
                alt={file.name}
                className="max-h-96 max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-sm">{file.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <Badge variant="outline">{file.extension}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Size</p>
              <p className="text-sm">{formatFileSize(file.size)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Modified</p>
              <p className="text-sm">{formatDate(file.modifiedAt || null)}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Path</p>
              <p className="text-sm break-all">{file.path}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

