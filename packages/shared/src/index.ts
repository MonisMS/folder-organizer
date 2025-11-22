// Types from backend
export interface FileInfo {
    name: string;
    path: string;
    size: number;
    extension: string;
    createdAt: Date;
    modifiedAt: Date;
}

export interface ScanResult {
    files: FileInfo[];
    totalFiles: number;
    scannedAt: Date;
    scannedPath: string;
}

export interface FileCategory {
    name: string;
    extensions: string[];
    targetFolder: string;
}

export interface AppConfig {
    organizedRoot: string;
    sourceFolder: string;
    categories: FileCategory[];
    ignoredFolders: string[];
    onlyOrganizeRootFiles: boolean;
}