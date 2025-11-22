import dotenv from 'dotenv';
import path from 'path';
import type { AppConfig, FileCategory } from '@file-manager/shared';

dotenv.config();

export const config: AppConfig = {
    organizedRoot: process.env.ORGANIZED_ROOT || path.join(
        process.cwd(), 'organized_files'
    ),
    // sourceFolder is optional - use empty string if not set
    // File operations should validate paths before use
    sourceFolder: process.env.SOURCE_FOLDER || '',
    onlyOrganizeRootFiles: true,
    ignoredFolders: [
        'node_modules',
        'Program Files',
        'Program Files (x86)',
        'Windows',
        'System32',
        '.git',
        'AppData',
    ],
    categories: [
        {
            name: 'Documents',
            extensions: ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.pptx', '.csv'],
            targetFolder: 'Documents'
        },
        {
            name: 'Images',
            extensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.webp'],
            targetFolder: 'Images'
        },
        {
            name: 'Videos',
            extensions: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'],
            targetFolder: 'Videos'
        },
        {
            name: 'Audio',
            extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'],
            targetFolder: 'Audio'
        },
        {
            name: 'Archives',
            extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'],
            targetFolder: 'Archives'
        },
        {
            name: 'Code',
            extensions: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.html', '.css'],
            targetFolder: 'Code'
        },
        {
            name: 'Executables',
            extensions: ['.exe', '.msi', '.dmg', '.deb', '.rpm'],
            targetFolder: 'Executables'
        },
    ]
};