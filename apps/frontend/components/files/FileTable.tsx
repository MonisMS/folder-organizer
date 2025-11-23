'use client';

import type { FileInfo } from '@file-manager/shared';
import { formatFileSize, formatDate, getFileIcon } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { FilePreview } from './FilePreview';

interface FileTableProps {
  files: FileInfo[];
  onPreview?: (file: FileInfo) => void;
}

export function FileTable({ files, onPreview }: FileTableProps) {
  const [previewFile, setPreviewFile] = useState<FileInfo | null>(null);

  const handlePreview = (file: FileInfo) => {
    setPreviewFile(file);
    if (onPreview) {
      onPreview(file);
    }
  };

  if (files.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No files found
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{getFileIcon(file.extension)}</span>
                    <span className="truncate max-w-xs">{file.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{file.extension}</Badge>
                </TableCell>
                <TableCell>{formatFileSize(file.size)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(file.modifiedAt || null)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreview(file)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  );
}

