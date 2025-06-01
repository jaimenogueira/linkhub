import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import type { LinkEntry } from './constants';

export function ensureDirectoryExistence(filePath: string): void {
  const dirname = path.dirname(filePath);
  if (fsSync.existsSync(dirname)) {
    return;
  }
  ensureDirectoryExistence(dirname);
  fsSync.mkdirSync(dirname, { recursive: true });
}

export async function getUsers(): Promise<Record<string, string>> {
  try {
    await fs.stat(path.dirname(process.env.USERS_FILE_PATH || './data/users.txt')); // Check if directory exists
  } catch (error) {
     // Ensure directory exists or handle error appropriately
    ensureDirectoryExistence(process.env.USERS_FILE_PATH || './data/users.txt');
  }
  
  try {
    const data = await fs.readFile(process.env.USERS_FILE_PATH || './data/users.txt', 'utf-8');
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
    // If file doesn't exist or other error, return empty users object or handle appropriately
    // For this app, we expect users.txt to be provisioned.
    // Create a default user if file doesn't exist for easier setup
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        ensureDirectoryExistence(process.env.USERS_FILE_PATH || './data/users.txt');
        await fs.writeFile(process.env.USERS_FILE_PATH || './data/users.txt', 'admin:admin123\n');
        return { admin: 'admin123' };
    }
    console.error('Error reading users file:', error);
    return {};
  }
}

export async function getLinks(): Promise<LinkEntry[]> {
  try {
    await fs.stat(path.dirname(process.env.LINKS_FILE_PATH || './public/data/links.txt'));
  } catch (error) {
    ensureDirectoryExistence(process.env.LINKS_FILE_PATH || './public/data/links.txt');
  }

  try {
    const data = await fs.readFile(process.env.LINKS_FILE_PATH || './public/data/links.txt', 'utf-8');
    return data.split('\n')
      .filter(line => line.trim() !== '')
      .map((line, index) => {
        const parts = line.split(' | ');
        // Ensure that there are enough parts before trying to access them
        const name = parts.length > 0 ? parts[0] : `Untitled Link ${index + 1}`;
        const url = parts.length > 1 ? parts[1] : '#';
        const iconPath = parts.length > 2 ? parts[2] : '/images/placeholder.png';
        return { id: `${index}-${name.replace(/\s+/g, '-')}`, name, url, iconPath };
      });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If file doesn't exist, return empty array
      return [];
    }
    console.error('Error reading links file:', error);
    return [];
  }
}

export async function addLinkEntry(name: string, url: string, iconPath: string): Promise<void> {
  const newLine = `${name} | ${url} | ${iconPath}\n`;
  ensureDirectoryExistence(process.env.LINKS_FILE_PATH || './public/data/links.txt');
  await fs.appendFile(process.env.LINKS_FILE_PATH || './public/data/links.txt', newLine);
}

export async function saveUploadedFile(file: File, fileName: string): Promise<string> {
  ensureDirectoryExistence(process.env.PUBLIC_IMAGES_PATH || './public/images/');
  const filePath = path.join(process.env.PUBLIC_IMAGES_PATH || './public/images/', fileName);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await fs.writeFile(filePath, buffer);
  return `/images/${fileName}`; // Path relative to /public
}
