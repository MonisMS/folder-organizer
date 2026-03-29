import { describe, it, expect } from 'vitest';
import { classifyFile, classifyFiles } from '../services/fileClassifier.js';
import type { FileInfo } from '../types/type.js';

// Helper to build a minimal FileInfo for testing
function makeFile(name: string, extension: string): FileInfo {
  return {
    name,
    path: `/test/${name}`,
    size: 1000,
    extension,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };
}

describe('classifyFile', () => {
  it('classifies PDF as Documents', () => {
    expect(classifyFile(makeFile('report.pdf', '.pdf'))).toBe('Documents');
  });

  it('classifies Word doc as Documents', () => {
    expect(classifyFile(makeFile('doc.docx', '.docx'))).toBe('Documents');
  });

  it('classifies JPG as Images', () => {
    expect(classifyFile(makeFile('photo.jpg', '.jpg'))).toBe('Images');
  });

  it('classifies PNG as Images', () => {
    expect(classifyFile(makeFile('icon.png', '.png'))).toBe('Images');
  });

  it('classifies MP4 as Videos', () => {
    expect(classifyFile(makeFile('video.mp4', '.mp4'))).toBe('Videos');
  });

  it('classifies MP3 as Audio', () => {
    expect(classifyFile(makeFile('song.mp3', '.mp3'))).toBe('Audio');
  });

  it('classifies ZIP as Archives', () => {
    expect(classifyFile(makeFile('archive.zip', '.zip'))).toBe('Archives');
  });

  it('classifies TS as Code', () => {
    expect(classifyFile(makeFile('index.ts', '.ts'))).toBe('Code');
  });

  it('classifies EXE as Executables', () => {
    expect(classifyFile(makeFile('setup.exe', '.exe'))).toBe('Executables');
  });

  it('classifies unknown extension as Others', () => {
    expect(classifyFile(makeFile('data.xyz', '.xyz'))).toBe('Others');
  });

  it('is case-insensitive — .PDF should classify as Documents', () => {
    expect(classifyFile(makeFile('REPORT.PDF', '.PDF'))).toBe('Documents');
  });

  it('classifies file with no extension as Others', () => {
    expect(classifyFile(makeFile('Makefile', ''))).toBe('Others');
  });
});

describe('classifyFiles', () => {
  it('groups files by category', () => {
    const files = [
      makeFile('a.pdf', '.pdf'),
      makeFile('b.jpg', '.jpg'),
      makeFile('c.png', '.png'),
      makeFile('d.mp3', '.mp3'),
    ];

    const result = classifyFiles(files);

    expect(result.get('Documents')).toHaveLength(1);
    expect(result.get('Images')).toHaveLength(2);
    expect(result.get('Audio')).toHaveLength(1);
  });

  it('returns empty map for empty input', () => {
    expect(classifyFiles([])).toEqual(new Map());
  });

  it('puts all unknown files in Others', () => {
    const files = [
      makeFile('a.xyz', '.xyz'),
      makeFile('b.abc', '.abc'),
    ];

    const result = classifyFiles(files);
    expect(result.get('Others')).toHaveLength(2);
  });

  it('does not create empty categories', () => {
    const files = [makeFile('a.pdf', '.pdf')];
    const result = classifyFiles(files);

    // No Images, Videos, etc. keys should exist
    expect(result.has('Images')).toBe(false);
    expect(result.has('Videos')).toBe(false);
  });

  it('preserves all file metadata in the result', () => {
    const file = makeFile('report.pdf', '.pdf');
    const result = classifyFiles([file]);

    const docs = result.get('Documents');
    expect(docs?.[0]).toEqual(file);
  });
});
