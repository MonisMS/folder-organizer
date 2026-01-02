import type { ElectronAPI } from '../preload/index';

declare global {
  interface Window {
    electron: typeof import('@electron-toolkit/preload').electronAPI;
    api: ElectronAPI;
  }
}

export {};
