import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export class FileManager {
  private readonly baseDir = path.join(process.cwd(), 'user_websites');
  private readonly scriptsDir = path.join(process.cwd(), 'allscripts');
  private readonly profilesDir = path.join(process.cwd(), 'uploads', 'profiles');

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      await fs.mkdir(this.scriptsDir, { recursive: true });
      await fs.mkdir(this.profilesDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create directories:', error);
    }
  }

  // Get user's website directory path
  getUserWebsiteDir(userId: string, subdomain: string): string {
    return path.join(this.baseDir, userId, subdomain);
  }

  // Create user website directory
  async createUserWebsiteDir(userId: string, subdomain: string): Promise<string> {
    const websiteDir = this.getUserWebsiteDir(userId, subdomain);
    await fs.mkdir(websiteDir, { recursive: true });
    return websiteDir;
  }

  // Check if website directory exists
  async websiteExists(userId: string, subdomain: string): Promise<boolean> {
    try {
      const websiteDir = this.getUserWebsiteDir(userId, subdomain);
      await fs.access(websiteDir);
      return true;
    } catch {
      return false;
    }
  }

  // Delete website directory
  async deleteWebsiteDir(userId: string, subdomain: string): Promise<void> {
    const websiteDir = this.getUserWebsiteDir(userId, subdomain);
    try {
      await fs.rm(websiteDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to delete website directory:', error);
    }
  }

  // Clear website directory contents
  async clearWebsiteDir(userId: string, subdomain: string): Promise<void> {
    const websiteDir = this.getUserWebsiteDir(userId, subdomain);
    try {
      const items = await fs.readdir(websiteDir);
      for (const item of items) {
        await fs.rm(path.join(websiteDir, item), { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Failed to clear website directory:', error);
    }
  }

  // Get available scripts from allscripts directory
  async getAvailableScripts(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.scriptsDir);
      return files.filter(file => file.endsWith('.zip'));
    } catch (error) {
      console.error('Failed to read scripts directory:', error);
      return [];
    }
  }

  // Extract script to website directory
  async extractScript(userId: string, subdomain: string, scriptName: string): Promise<void> {
    const websiteDir = this.getUserWebsiteDir(userId, subdomain);
    const scriptPath = path.join(this.scriptsDir, scriptName);

    try {
      // Ensure the website directory exists
      await fs.mkdir(websiteDir, { recursive: true });

      // Clear existing files
      await this.clearWebsiteDir(userId, subdomain);

      // Extract the zip file
      execSync(`cd "${websiteDir}" && unzip -o "${scriptPath}"`, { stdio: 'pipe' });
      
      console.log(`Extracted script ${scriptName} to ${websiteDir}`);
    } catch (error) {
      console.error('Failed to extract script:', error);
      throw new Error(`Failed to extract script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Upload script zip file
  async uploadScript(fileName: string, fileBuffer: Buffer): Promise<void> {
    const scriptPath = path.join(this.scriptsDir, fileName);
    try {
      await fs.writeFile(scriptPath, fileBuffer);
      console.log(`Uploaded script: ${fileName}`);
    } catch (error) {
      console.error('Failed to upload script:', error);
      throw new Error(`Failed to upload script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check if script exists
  async scriptExists(scriptName: string): Promise<boolean> {
    try {
      const scriptPath = path.join(this.scriptsDir, scriptName);
      await fs.access(scriptPath);
      return true;
    } catch {
      return false;
    }
  }

  // Delete script file
  async deleteScript(scriptName: string): Promise<void> {
    const scriptPath = path.join(this.scriptsDir, scriptName);
    try {
      await fs.unlink(scriptPath);
      console.log(`Deleted script: ${scriptName}`);
    } catch (error) {
      console.error('Failed to delete script:', error);
    }
  }

  // Get website files and structure
  async getWebsiteFiles(userId: string, subdomain: string): Promise<any> {
    const websiteDir = this.getUserWebsiteDir(userId, subdomain);
    try {
      return await this.readDirRecursive(websiteDir);
    } catch (error) {
      console.error('Failed to read website files:', error);
      return null;
    }
  }

  private async readDirRecursive(dirPath: string): Promise<any> {
    const items = await fs.readdir(dirPath);
    const result: any = {};

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        result[item] = await this.readDirRecursive(itemPath);
      } else {
        result[item] = {
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      }
    }

    return result;
  }

  // Get website URL
  getWebsiteUrl(subdomain: string): string {
    // In a real deployment, this would be your actual domain
    // For now, we'll use a placeholder that shows the structure
    return `https://${subdomain}.yoursite.com`;
  }

  // Save profile picture
  async saveProfilePicture(userId: string, fileName: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(this.profilesDir, fileName);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  // Get profile picture path
  getProfilePicturePath(fileName: string): string {
    return path.join(this.profilesDir, fileName);
  }
}

export const fileManager = new FileManager();