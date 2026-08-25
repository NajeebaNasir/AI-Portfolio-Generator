import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { GeneratedProjectFile } from '../generator/templateEngine';

export class SandboxManager {
  private sandboxPath: string;
  private id: string;

  constructor() {
    this.id = uuidv4();
    this.sandboxPath = path.join(os.tmpdir(), `portfolio_sandbox_${this.id}`);
  }

  public getPath(): string {
    return this.sandboxPath;
  }

  public getId(): string {
    return this.id;
  }

  public initialize(files: GeneratedProjectFile[]): void {
    if (fs.existsSync(this.sandboxPath)) {
      fs.rmSync(this.sandboxPath, { recursive: true, force: true });
    }
    fs.mkdirSync(this.sandboxPath, { recursive: true });

    for (const file of files) {
      const fullPath = path.join(this.sandboxPath, file.relativePath);
      const dirName = path.dirname(fullPath);
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
      }
      fs.writeFileSync(fullPath, file.content, 'utf-8');
    }
  }

  public updateFile(relativePath: string, newContent: string): void {
    const fullPath = path.join(this.sandboxPath, relativePath);
    const dirName = path.dirname(fullPath);
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }
    fs.writeFileSync(fullPath, newContent, 'utf-8');
  }

  public readFile(relativePath: string): string | null {
    const fullPath = path.join(this.sandboxPath, relativePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8');
    }
    return null;
  }

  public cleanup(): void {
    try {
      if (fs.existsSync(this.sandboxPath)) {
        fs.rmSync(this.sandboxPath, { recursive: true, force: true });
      }
    } catch (err) {
      console.warn(`[SandboxManager] Could not cleanup sandbox ${this.sandboxPath}:`, err);
    }
  }
}
