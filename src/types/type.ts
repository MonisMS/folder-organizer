export interface FileInfo {
    name:string;
    path:string;
    size:number;
    extension:string;
    createdAt:Date;
    modifiedAt:Date;
}

export interface ScanResult{
    files:FileInfo[];
    totalFiles:number;
    scannedAt:Date;
    scannedPath:string;
}