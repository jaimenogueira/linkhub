
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getUsers, addLinkEntry, saveUploadedFile, getLinks as fetchLinksFs } from './fs-utils';
import { createSession, getSession, clearSession } from './auth';
import type { LinkEntry } from './constants';
import { LINKS_FILE_PATH, USERS_FILE_PATH, PUBLIC_IMAGES_PATH } from './constants';
import fs from 'fs/promises';
import path from 'path';

// Ensures essential directories and files exist on startup or first action
async function initializeDataFiles() {
  const ensureFileExistsWithDefaultContent = async (filePath: string, defaultContent: string) => {
    try {
      const dirname = path.dirname(filePath);
      try {
        await fs.access(dirname);
      } catch (dirError) {
        if ((dirError as NodeJS.ErrnoException).code === 'ENOENT') {
          await fs.mkdir(dirname, { recursive: true });
        } else {
          throw dirError;
        }
      }
      await fs.access(filePath);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.writeFile(filePath, defaultContent);
      } else {
        throw e;
      }
    }
  };

  try {
    // Ensure base directories first
    await fs.mkdir(path.dirname(USERS_FILE_PATH), { recursive: true });
    await fs.mkdir(PUBLIC_DATA_PATH, { recursive: true }); // Directory for links.txt
    await fs.mkdir(PUBLIC_IMAGES_PATH, { recursive: true }); // Directory for images

    // Ensure critical files exist
    await ensureFileExistsWithDefaultContent(USERS_FILE_PATH, 'admin:admin123\n');
    await ensureFileExistsWithDefaultContent(LINKS_FILE_PATH, ''); // Empty links file

  } catch (error) {
    console.error("Critical error during application data file/directory initialization:", error);
  }
}


initializeDataFiles();


const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function loginUser(formData: FormData) {
  const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return { error: "Invalid fields.", details: validatedFields.error.flatten().fieldErrors };
  }

  const { username, password } = validatedFields.data;
  const users = await getUsers();

  if (users[username] && users[username] === password) {
    await createSession(username);
    redirect('/');
  } else {
    return { error: "Invalid username or password." };
  }
}

export async function logoutUser() {
  await clearSession();
  redirect('/login');
}

const AddLinkSchema = z.object({
  name: z.string().min(1, "Application name is required"),
  url: z.string().url("Invalid URL format"),
  icon: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, "Icon must be less than 5MB")
    .refine(file => ["image/jpeg", "image/png", "image/gif", "image/svg+xml"].includes(file.type), "Only JPEG, PNG, GIF, SVG images are allowed")
    .optional(),
});

export async function addLink(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized." };
  }

  const validatedFields = AddLinkSchema.safeParse({
    name: formData.get('name'),
    url: formData.get('url'),
    icon: formData.get('icon') instanceof File ? formData.get('icon') : undefined,
  });
  
  if (!validatedFields.success) {
    return { error: "Invalid fields.", details: validatedFields.error.flatten().fieldErrors };
  }

  const { name, url, icon } = validatedFields.data;
  let iconPath = ''; 

  if (icon && icon.size > 0) { 
    try {
      const originalName = icon.name;
      // Sanitize the base name (remove extension, replace special chars)
      const baseName = originalName.substring(0, originalName.lastIndexOf('.')).replace(/[^a-zA-Z0-9_.-]/g, '_');
      // Get the original extension
      const extension = originalName.substring(originalName.lastIndexOf('.'));
      // Construct a unique and sanitized file name
      const uniqueFileName = `${Date.now()}-${baseName}${extension}`;
      
      iconPath = await saveUploadedFile(icon, uniqueFileName);
    } catch (uploadError) {
      console.error("Error saving uploaded icon:", uploadError);
      // Proceed with empty iconPath if upload fails, link can still be saved.
    }
  }

  try {
    await addLinkEntry(name, url, iconPath);
    revalidatePath('/');
    return { success: "Link added successfully!" };
  } catch (error) {
    console.error("Error adding link entry to file:", error);
    return { error: "Failed to add link." };
  }
}

export async function getLinks(): Promise<LinkEntry[]> {
  return fetchLinksFs();
}

export async function getAuthStatus(): Promise<{ isAuthenticated: boolean; username?: string }> {
  const session = await getSession();
  if (session) {
    return { isAuthenticated: true, username: session.username };
  }
  return { isAuthenticated: false };
}
