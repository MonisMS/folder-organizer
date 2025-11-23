import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import bytes from 'bytes';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format file size
export function formatFileSize(size: number): string {
  return bytes(size);
}

// Format date
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'PPp'); // e.g., "Jan 1, 2024 at 12:00 PM"
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true }); // e.g., "2 hours ago"
}

// Get file icon based on extension
export function getFileIcon(extension: string): string {
  const ext = extension.toLowerCase().replace('.', '');
  
  const iconMap: Record<string, string> = {
    // Documents
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    txt: '📄',
    xlsx: '📊',
    pptx: '📊',
    
    // Images
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    
    // Videos
    mp4: '🎬',
    mkv: '🎬',
    avi: '🎬',
    
    // Audio
    mp3: '🎵',
    wav: '🎵',
    
    // Archives
    zip: '📦',
    rar: '📦',
    
    // Code
    js: '💻',
    ts: '💻',
    py: '💻',
    
    // Default
    default: '📄',
  };
  
  return iconMap[ext] || iconMap.default;
}