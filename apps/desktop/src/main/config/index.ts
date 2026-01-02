import { app } from 'electron';
import { join } from 'path';
import type { AppConfig, FileCategory } from '@file-manager/shared';

// Get user's documents folder as default organized root
const defaultOrganizedRoot = join(app.getPath('documents'), 'Organized Files');

export const config: AppConfig = {
  organizedRoot: defaultOrganizedRoot,
  sourceFolder: '',
  onlyOrganizeRootFiles: true,
  ignoredFolders: [
    'node_modules',
    'Program Files',
    'Program Files (x86)',
    'Windows',
    'System32',
    '.git',
    'AppData',
    '$Recycle.Bin',
    'Recovery',
  ],
  categories: [
    {
      name: 'Documents',
      extensions: ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx', '.csv', '.rtf', '.odt', '.xls'],
      targetFolder: 'Documents',
    },
    {
      name: 'Images',
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.webp', '.ico', '.tiff', '.raw'],
      targetFolder: 'Images',
    },
    {
      name: 'Videos',
      extensions: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg'],
      targetFolder: 'Videos',
    },
    {
      name: 'Audio',
      extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.opus'],
      targetFolder: 'Audio',
    },
    {
      name: 'Archives',
      extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
      targetFolder: 'Archives',
    },
    {
      name: 'Code',
      extensions: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml', '.md'],
      targetFolder: 'Code',
    },
    {
      name: 'Executables',
      extensions: ['.exe', '.msi', '.dmg', '.deb', '.rpm', '.app', '.bat', '.sh'],
      targetFolder: 'Executables',
    },
  ],
};
