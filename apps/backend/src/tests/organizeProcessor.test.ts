import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies BEFORE importing the processor.
// This prevents any real filesystem or database calls during tests.
vi.mock('../services/scannerInfo.js', () => ({ scanInfo: vi.fn() }));
vi.mock('../services/fileClassifier.js', () => ({ classifyFiles: vi.fn() }));
vi.mock('../services/fileMover.js', () => ({ moveFile: vi.fn() }));
vi.mock('../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { processOrganizeJob } from '../workers/organizeProcessor.js';
import { scanInfo } from '../services/scannerInfo.js';
import { classifyFiles } from '../services/fileClassifier.js';
import { moveFile } from '../services/fileMover.js';
import type { FileInfo } from '../types/type.js';

// A mock BullMQ Job — mirrors the real Job interface for what our processor uses
function makeMockJob(data: { sourcePath: string; targetPath: string }) {
  return {
    id: 'test-job-1',
    data,
    updateProgress: vi.fn().mockResolvedValue(undefined),
    log: vi.fn().mockResolvedValue(undefined),
  };
}

function makeFileInfo(name: string, extension: string): FileInfo {
  return {
    name,
    path: `/source/${name}`,
    size: 1024,
    extension,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };
}

describe('processOrganizeJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct counts when all files move successfully', async () => {
    const files = [makeFileInfo('a.pdf', '.pdf'), makeFileInfo('b.jpg', '.jpg')];
    vi.mocked(scanInfo).mockResolvedValue({
      files,
      totalFiles: 2,
      scannedPath: '/source',
      scannedAt: new Date(),
    });
    vi.mocked(classifyFiles).mockReturnValue(
      new Map([
        ['Documents', [files[0]]],
        ['Images', [files[1]]],
      ])
    );
    vi.mocked(moveFile).mockResolvedValue({
      success: true,
      originalPath: '/source/a.pdf',
      newPath: '/target/Documents/a.pdf',
    });

    const job = makeMockJob({ sourcePath: '/source', targetPath: '/target' });
    const result = await processOrganizeJob(job as any);

    expect(result.totalFiles).toBe(2);
    expect(result.movedFiles).toBe(2);
    expect(result.failedFiles).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('counts failed files separately without stopping the job', async () => {
    const files = [
      makeFileInfo('good.pdf', '.pdf'),
      makeFileInfo('locked.pdf', '.pdf'),
    ];
    vi.mocked(scanInfo).mockResolvedValue({
      files,
      totalFiles: 2,
      scannedPath: '/source',
      scannedAt: new Date(),
    });
    vi.mocked(classifyFiles).mockReturnValue(new Map([['Documents', files]]));

    // First call succeeds, second throws
    vi.mocked(moveFile)
      .mockResolvedValueOnce({ success: true, originalPath: '/source/good.pdf', newPath: '/target/Documents/good.pdf' })
      .mockRejectedValueOnce(new Error('File is locked'));

    const job = makeMockJob({ sourcePath: '/source', targetPath: '/target' });
    const result = await processOrganizeJob(job as any);

    expect(result.movedFiles).toBe(1);
    expect(result.failedFiles).toBe(1);
    expect(result.errors[0]).toContain('locked.pdf');
    expect(result.errors[0]).toContain('File is locked');
  });

  it('reaches 100% progress when complete', async () => {
    const files = [makeFileInfo('a.pdf', '.pdf')];
    vi.mocked(scanInfo).mockResolvedValue({
      files,
      totalFiles: 1,
      scannedPath: '/source',
      scannedAt: new Date(),
    });
    vi.mocked(classifyFiles).mockReturnValue(new Map([['Documents', files]]));
    vi.mocked(moveFile).mockResolvedValue({
      success: true,
      originalPath: '/source/a.pdf',
      newPath: '/target/Documents/a.pdf',
    });

    const job = makeMockJob({ sourcePath: '/source', targetPath: '/target' });
    await processOrganizeJob(job as any);

    const progressCalls = vi.mocked(job.updateProgress).mock.calls.map((c) => c[0]);
    expect(progressCalls[0]).toBe(10);   // initial scan
    expect(progressCalls[1]).toBe(20);   // after classify
    expect(progressCalls.at(-1)).toBe(100); // final
  });

  it('logs progress messages throughout the job', async () => {
    const files = [makeFileInfo('a.pdf', '.pdf')];
    vi.mocked(scanInfo).mockResolvedValue({
      files,
      totalFiles: 1,
      scannedPath: '/source',
      scannedAt: new Date(),
    });
    vi.mocked(classifyFiles).mockReturnValue(new Map([['Documents', files]]));
    vi.mocked(moveFile).mockResolvedValue({
      success: true,
      originalPath: '/source/a.pdf',
      newPath: '/target/Documents/a.pdf',
    });

    const job = makeMockJob({ sourcePath: '/source', targetPath: '/target' });
    await processOrganizeJob(job as any);

    const logs: string[] = vi.mocked(job.log).mock.calls.map((c) => c[0] as string);
    expect(logs.some((l) => l.includes('Scanning'))).toBe(true);
    expect(logs.some((l) => l.includes('Classifying'))).toBe(true);
    expect(logs.some((l) => l.includes('a.pdf'))).toBe(true);
    expect(logs.some((l) => l.includes('completed'))).toBe(true);
  });

  it('caps errors array at 50 entries', async () => {
    // Create 60 files that will all fail
    const files = Array.from({ length: 60 }, (_, i) =>
      makeFileInfo(`file${i}.pdf`, '.pdf')
    );
    vi.mocked(scanInfo).mockResolvedValue({
      files,
      totalFiles: 60,
      scannedPath: '/source',
      scannedAt: new Date(),
    });
    vi.mocked(classifyFiles).mockReturnValue(new Map([['Documents', files]]));
    vi.mocked(moveFile).mockRejectedValue(new Error('permission denied'));

    const job = makeMockJob({ sourcePath: '/source', targetPath: '/target' });
    const result = await processOrganizeJob(job as any);

    expect(result.failedFiles).toBe(60);
    expect(result.errors).toHaveLength(50); // capped at 50
  });

  it('throws and logs if scanInfo fails', async () => {
    vi.mocked(scanInfo).mockRejectedValue(new Error('Directory not found'));

    const job = makeMockJob({ sourcePath: '/nonexistent', targetPath: '/target' });

    await expect(processOrganizeJob(job as any)).rejects.toThrow('Directory not found');
    const logs: string[] = vi.mocked(job.log).mock.calls.map((c) => c[0] as string);
    expect(logs.some((l) => l.includes('Directory not found'))).toBe(true);
  });
});
