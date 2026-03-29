import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/scannerInfo.js', () => ({ scanInfo: vi.fn() }));
vi.mock('../services/hashService.js', () => ({ findDuplicates: vi.fn() }));
vi.mock('../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { processDuplicateJob } from '../workers/duplicateProcessor.js';
import { scanInfo } from '../services/scannerInfo.js';
import { findDuplicates } from '../services/hashService.js';
import type { FileInfo } from '../types/type.js';

function makeMockJob(data: { sourcePath: string }) {
  return {
    id: 'test-dup-job-1',
    data,
    updateProgress: vi.fn().mockResolvedValue(undefined),
    log: vi.fn().mockResolvedValue(undefined),
  };
}

function makeFileInfo(name: string, size: number): FileInfo {
  return {
    name,
    path: `/source/${name}`,
    size,
    extension: '.pdf',
    createdAt: new Date(),
    modifiedAt: new Date(),
  };
}

describe('processDuplicateJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns zero duplicates when no files share a hash', async () => {
    const files = [makeFileInfo('a.pdf', 100), makeFileInfo('b.pdf', 200)];
    vi.mocked(scanInfo).mockResolvedValue({
      files,
      totalFiles: 2,
      scannedPath: '/source',
      scannedAt: new Date(),
    });
    // Empty map = no duplicates found
    vi.mocked(findDuplicates).mockResolvedValue(new Map());

    const job = makeMockJob({ sourcePath: '/source' });
    const result = await processDuplicateJob(job as any);

    expect(result.scannedFiles).toBe(2);
    expect(result.duplicateGroups).toBe(0);
    expect(result.totalDuplicates).toBe(0);
    expect(result.wastedSpace).toBe(0);
    expect(result.duplicates).toHaveLength(0);
  });

  it('correctly calculates wasted space for a group of 3 identical files', async () => {
    // 3 copies of a 10 MB file → 2 copies wasted = 20 MB
    const FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    const files = [
      makeFileInfo('copy1.pdf', FILE_SIZE),
      makeFileInfo('copy2.pdf', FILE_SIZE),
      makeFileInfo('copy3.pdf', FILE_SIZE),
    ];
    vi.mocked(scanInfo).mockResolvedValue({
      files,
      totalFiles: 3,
      scannedPath: '/source',
      scannedAt: new Date(),
    });
    vi.mocked(findDuplicates).mockResolvedValue(
      new Map([
        [
          'abc123hash',
          [
            { path: '/source/copy1.pdf', name: 'copy1.pdf' },
            { path: '/source/copy2.pdf', name: 'copy2.pdf' },
            { path: '/source/copy3.pdf', name: 'copy3.pdf' },
          ],
        ],
      ])
    );

    const job = makeMockJob({ sourcePath: '/source' });
    const result = await processDuplicateJob(job as any);

    expect(result.duplicateGroups).toBe(1);
    expect(result.totalDuplicates).toBe(2); // 3 copies - 1 original = 2 wasted
    expect(result.wastedSpace).toBe(FILE_SIZE * 2); // 2 wasted copies × 10 MB
  });

  it('correctly calculates wasted space for 2 copies (simplest duplicate case)', async () => {
    const FILE_SIZE = 5000;
    const files = [
      makeFileInfo('orig.pdf', FILE_SIZE),
      makeFileInfo('copy.pdf', FILE_SIZE),
    ];
    vi.mocked(scanInfo).mockResolvedValue({
      files,
      totalFiles: 2,
      scannedPath: '/source',
      scannedAt: new Date(),
    });
    vi.mocked(findDuplicates).mockResolvedValue(
      new Map([
        [
          'hash456',
          [
            { path: '/source/orig.pdf', name: 'orig.pdf' },
            { path: '/source/copy.pdf', name: 'copy.pdf' },
          ],
        ],
      ])
    );

    const job = makeMockJob({ sourcePath: '/source' });
    const result = await processDuplicateJob(job as any);

    expect(result.wastedSpace).toBe(FILE_SIZE); // 1 wasted copy × 5000 bytes
    expect(result.totalDuplicates).toBe(1);
  });

  it('handles multiple duplicate groups independently', async () => {
    const files = [
      makeFileInfo('a1.pdf', 1000),
      makeFileInfo('a2.pdf', 1000),
      makeFileInfo('b1.jpg', 2000),
      makeFileInfo('b2.jpg', 2000),
    ];
    vi.mocked(scanInfo).mockResolvedValue({
      files,
      totalFiles: 4,
      scannedPath: '/source',
      scannedAt: new Date(),
    });
    vi.mocked(findDuplicates).mockResolvedValue(
      new Map([
        ['hashA', [{ path: '/source/a1.pdf', name: 'a1.pdf' }, { path: '/source/a2.pdf', name: 'a2.pdf' }]],
        ['hashB', [{ path: '/source/b1.jpg', name: 'b1.jpg' }, { path: '/source/b2.jpg', name: 'b2.jpg' }]],
      ])
    );

    const job = makeMockJob({ sourcePath: '/source' });
    const result = await processDuplicateJob(job as any);

    expect(result.duplicateGroups).toBe(2);
    expect(result.totalDuplicates).toBe(2); // 1 wasted per group
    expect(result.wastedSpace).toBe(1000 + 2000); // 1000 + 2000 wasted
  });

  it('reaches 100% progress', async () => {
    vi.mocked(scanInfo).mockResolvedValue({
      files: [],
      totalFiles: 0,
      scannedPath: '/source',
      scannedAt: new Date(),
    });
    vi.mocked(findDuplicates).mockResolvedValue(new Map());

    const job = makeMockJob({ sourcePath: '/source' });
    await processDuplicateJob(job as any);

    const progressCalls = vi.mocked(job.updateProgress).mock.calls.map((c) => c[0]);
    expect(progressCalls[0]).toBe(10);
    expect(progressCalls.at(-1)).toBe(100);
  });

  it('throws and logs if scanInfo fails', async () => {
    vi.mocked(scanInfo).mockRejectedValue(new Error('Access denied'));

    const job = makeMockJob({ sourcePath: '/protected' });
    await expect(processDuplicateJob(job as any)).rejects.toThrow('Access denied');

    const logs: string[] = vi.mocked(job.log).mock.calls.map((c) => c[0] as string);
    expect(logs.some((l) => l.includes('Access denied'))).toBe(true);
  });
});
