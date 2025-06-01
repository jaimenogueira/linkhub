
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import type { LinkEntry } from './constants';
import { USERS_FILE_PATH, LINKS_FILE_PATH, PUBLIC_IMAGES_PATH, PUBLIC_DATA_PATH } from './constants';

export function ensureDirectoryExistence(filePath: string): void {
  const dirname = path.dirname(filePath);
  if (fsSync.existsSync(dirname)) {
    return;
  }
  ensureDirectoryExistence(dirname);
  fsSync.mkdirSync(dirname, { recursive: true });
}

export async function getUsers(): Promise<Record<string, string>> {
  const usersFilePath = USERS_FILE_PATH;
  try {
    await fs.stat(path.dirname(usersFilePath));
  } catch (error) {
    ensureDirectoryExistence(usersFilePath);
  }
  
  try {
    const data = await fs.readFile(usersFilePath, 'utf-8');
    const users: Record<string, string> = {};
    data.split('\n').forEach(line => {
      if (line.trim()) {
        const [username, password] = line.split(':');
        if (username && password) {
          users[username.trim()] = password.trim();
        }
      }
    });
    return users;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        ensureDirectoryExistence(usersFilePath);
        await fs.writeFile(usersFilePath, 'admin:admin123\n');
        return { admin: 'admin123' };
    }
    console.error('Error reading users file:', error);
    return {};
  }
}

export async function getLinks(): Promise<LinkEntry[]> {
  const linksFilePath = LINKS_FILE_PATH;
  try {
    await fs.stat(path.dirname(linksFilePath));
  } catch (error) {
    ensureDirectoryExistence(linksFilePath);
  }

  try {
    const data = await fs.readFile(linksFilePath, 'utf-8');
    return data.split('\n')
      .filter(line => line.trim() !== '')
      .map((line, index) => {
        const parts = line.split(' | ');
        const name = parts.length > 0 ? parts[0].trim() : `Untitled Link ${index + 1}`;
        const url = parts.length > 1 ? parts[1].trim() : '#';
        // Ensure iconPath is trimmed. If parts[2] is undefined (e.g. line ends with " | "), it becomes empty string.
        const iconPath = parts.length > 2 && parts[2] ? parts[2].trim() : ''; 
        return { id: `${index}-${name.replace(/\s+/g, '-')}`, name, url, iconPath };
      });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error('Error reading links file:', error);
    return [];
  }
}

export async function addLinkEntry(name: string, url: string, iconPath: string): Promise<void> {
  const linksFilePath = LINKS_FILE_PATH;
  // Ensure all parts are trimmed before writing to prevent issues with extra spaces
  const newLine = `${name.trim()} | ${url.trim()} | ${iconPath.trim()}\n`;
  ensureDirectoryExistence(linksFilePath);
  await fs.appendFile(linksFilePath, newLine);
}

export async function saveUploadedFile(file: File, fileName: string): Promise<string> {
  const publicImagesPath = PUBLIC_IMAGES_PATH;
  await fs.mkdir(publicImagesPath, { recursive: true });
  
  const filePath = path.join(publicImagesPath, fileName);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await fs.writeFile(filePath, buffer);
  return `/images/${fileName}`; 
}
