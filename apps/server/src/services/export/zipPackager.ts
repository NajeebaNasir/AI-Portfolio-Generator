import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
import { SandboxManager } from '../validation/sandboxManager';

export class ZipPackager {
  public static streamZipResponse(sandbox: SandboxManager, res: Response, zipFileName: string): void {
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    res.attachment(zipFileName);

    archive.on('error', (err) => {
      console.error('[ZipPackager] Error during archiving:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create ZIP package' });
      }
    });

    archive.pipe(res);

    // Append all files from sandbox directory
    archive.directory(sandbox.getPath(), false);

    archive.finalize();
  }
}
