import path from 'path';

export const USERS_FILE_PATH = path.join(process.cwd(), 'data', 'users.txt');
export const LINKS_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'links.txt');
export const PUBLIC_IMAGES_PATH = path.join(process.cwd(), 'public', 'images');
export const PUBLIC_DATA_PATH = path.join(process.cwd(), 'public', 'data');

export const SESSION_COOKIE_NAME = 'linkhub-session';

export interface LinkEntry {
  id: string;
  name: string;
  url: string;
  iconPath: string;
}
