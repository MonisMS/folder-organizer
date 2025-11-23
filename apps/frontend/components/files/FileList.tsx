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

interface FileListProps {
  files: FileInfo[];
}

export function FileList({ files }: FileListProps) {
  if (files.length === 0) {
    return <div className="text-muted-foreground">No files found</div>;
  }

  return (
    <div className="mt-4 rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Modified</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span>{getFileIcon(file.extension)}</span>
                  <span>{file.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{file.extension}</Badge>
              </TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(file.modifiedAt || null)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}