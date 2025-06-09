
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
    await fs.access(path.dirname(usersFilePath));
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
        // Ensure a default user if file is created
        const defaultUserContent = 'admin:admin123\n';
        await fs.writeFile(usersFilePath, defaultUserContent);
        return { admin: 'admin123' };
    }
    console.error('Error reading users file:', error);
    return {};
  }
}

export async function getLinks(): Promise<LinkEntry[]> {
  const linksFilePath = LINKS_FILE_PATH;
  try {
    await fs.access(path.dirname(linksFilePath));
  } catch (error) {
    ensureDirectoryExistence(linksFilePath);
  }

  try {
    const data = await fs.readFile(linksFilePath, 'utf-8');
    return data.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const parts = line.split(' | ');
        return {
          id: parts[0]?.trim() || `fallback-id-${Date.now()}-${Math.random()}`, // Fallback for safety
          name: parts[1]?.trim() || 'Untitled Link',
          url: parts[2]?.trim() || '#',
          iconPath: parts[3]?.trim() || '',
        };
      });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If file doesn't exist, ensure it's created (empty)
      await fs.writeFile(linksFilePath, '');
      return [];
    }
    console.error('Error reading links file:', error);
    return [];
  }
}

export async function addLinkEntry(id: string, name: string, url: string, iconPath: string): Promise<void> {
  const linksFilePath = LINKS_FILE_PATH;
  const newLine = `${id.trim()} | ${name.trim()} | ${url.trim()} | ${iconPath.trim()}\n`;
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

export async function deleteLinkFromFile(linkIdToDelete: string): Promise<{deleted: boolean, iconPathToDelete?: string}> {
  const linksFilePath = LINKS_FILE_PATH;
  ensureDirectoryExistence(linksFilePath); // Ensure file and dir exist
  const currentLinks = await getLinks();
  const linkToDeleteDetails = currentLinks.find(link => link.id === linkIdToDelete);

  const updatedLinks = currentLinks.filter(link => link.id !== linkIdToDelete);

  if (currentLinks.length === updatedLinks.length && currentLinks.length > 0) {
    // This condition means the link was not found, but there were links.
    // If currentLinks is empty, this is fine.
    console.warn(`Link with ID ${linkIdToDelete} not found for deletion.`);
    return {deleted: false};
  }
  
  if (currentLinks.length === 0 && updatedLinks.length === 0) {
    // No links to delete from, effectively no change.
    return {deleted: false};
  }


  const updatedContent = updatedLinks
    .map(link => `${link.id} | ${link.name} | ${link.url} | ${link.iconPath}`)
    .join('\n') + (updatedLinks.length > 0 ? '\n' : ''); // Add trailing newline if not empty

  try {
    await fs.writeFile(linksFilePath, updatedContent, 'utf-8');
    return {deleted: true, iconPathToDelete: linkToDeleteDetails?.iconPath};
  } catch (error) {
    console.error('Error writing updated links file:', error);
    return {deleted: false};
  }
}

export async function deleteIconFile(iconPath: string): Promise<void> {
  if (!iconPath || !iconPath.startsWith('/images/') || iconPath.includes('placehold.co')) {
    // Not a local, managed image or it's a placeholder
    return;
  }
  // iconPath is like /images/filename.png. We need just filename.png
  const fileName = path.basename(iconPath);
  const filePath = path.join(PUBLIC_IMAGES_PATH, fileName);
  try {
    await fs.unlink(filePath);
    console.log(`Deleted icon file: ${filePath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`Icon file not found for deletion, or already deleted: ${filePath}`);
    } else {
      console.error(`Error deleting icon file ${filePath}:`, error);
    }
  }
}
