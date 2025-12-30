// src/types/clamscan.d.ts
declare module 'clamscan' {
  interface ClamScanOptions {
    clamdscan?: {
      host?: string;
      port?: number | string;
      timeout?: number;
    };
    preference?: 'clamdscan' | 'clamscan';
  }

  interface ScanResult {
    isInfected: boolean;
    viruses?: string[];
    file?: string;
  }

  class ClamScan {
    constructor(options?: ClamScanOptions);
    scanFile(filepath: string): Promise<ScanResult>;
    scanDir(dirPath: string): Promise<ScanResult>;
  }

  export = ClamScan;
}