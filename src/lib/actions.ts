
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getUsers, addLinkEntry as addLinkToFile, saveUploadedFile, getLinks as fetchLinksFs, deleteLinkFromFile, deleteIconFile as deleteIconFileFs } from './fs-utils';
import { createSession, getSession, clearSession } from './auth';
import type { LinkEntry } from './constants';
import { LINKS_FILE_PATH, USERS_FILE_PATH, PUBLIC_IMAGES_PATH, PUBLIC_DATA_PATH } from './constants';
import fs from 'fs/promises';
import path from 'path';

async function initializeDataFiles() {
  const ensureDir = async (dirPath: string) => {
    try {
      await fs.access(dirPath);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
      } else {
        throw e;
      }
    }
  };

  const ensureFileWithDefaultContent = async (filePath: string, defaultContent: string) => {
    try {
      await fs.access(filePath);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.writeFile(filePath, defaultContent, 'utf-8');
      } else {
        throw e;
      }
    }
  };

  try {
    // Ensure base data directory exists
    const dataDir = path.dirname(USERS_FILE_PATH); // e.g., /path/to/project/data
    await ensureDir(dataDir);

    // Ensure public subdirectories for data and images exist
    await ensureDir(PUBLIC_DATA_PATH); // e.g., /path/to/project/public/data
    await ensureDir(PUBLIC_IMAGES_PATH); // e.g., /path/to/project/public/images

    // Ensure critical files exist with default content if they don't
    await ensureFileWithDefaultContent(USERS_FILE_PATH, 'admin:admin123\n');
    await ensureFileWithDefaultContent(LINKS_FILE_PATH, ''); // Empty links file initially

  } catch (error) {
    console.error("Critical error during application data file/directory initialization:", error);
    // Depending on the app's requirements, you might want to re-throw or handle this more gracefully
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
    revalidatePath('/'); // Revalidate to update auth status on page
    redirect('/');
  } else {
    return { error: "Invalid username or password." };
  }
}

export async function logoutUser() {
  await clearSession();
  revalidatePath('/'); // Revalidate to update auth status
  redirect('/login');
}

const AddLinkSchema = z.object({
  name: z.string().min(1, "Application name is required"),
  url: z.string().url("Invalid URL format. Please include http:// or https://"),
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
    icon: formData.get('icon') instanceof File && (formData.get('icon') as File).size > 0 ? formData.get('icon') : undefined,
  });
  
  if (!validatedFields.success) {
    return { error: "Invalid fields.", details: validatedFields.error.flatten().fieldErrors };
  }

  const { name, url, icon } = validatedFields.data;
  let iconPath = ''; 

  if (icon) { 
    try {
      const originalName = icon.name;
      const baseName = originalName.substring(0, originalName.lastIndexOf('.')).replace(/[^a-zA-Z0-9_.-]/g, '_');
      const extension = originalName.substring(originalName.lastIndexOf('.'));
      const uniqueFileName = `${Date.now()}-${baseName}${extension}`;
      
      iconPath = await saveUploadedFile(icon, uniqueFileName);
    } catch (uploadError) {
      console.error("Error saving uploaded icon:", uploadError);
      // Proceed with empty iconPath if upload fails, link can still be saved.
    }
  }
  const id = Date.now().toString(); // Generate unique ID

  try {
    await addLinkToFile(id, name, url, iconPath);
    revalidatePath('/');
    return { success: "Link added successfully!" };
  } catch (error) {
    console.error("Error adding link entry to file:", error);
    return { error: "Failed to add link." };
  }
}

export async function deleteLink(linkId: string): Promise<{ success?: string; error?: string }> {
  const session = await getSession();
  if (!session) { 
    return { error: "Unauthorized. Please login to delete links." };
  }

  try {
    const deleteResult = await deleteLinkFromFile(linkId);
    if (deleteResult.deleted) {
      if (deleteResult.iconPathToDelete) {
        await deleteIconFileFs(deleteResult.iconPathToDelete);
      }
      revalidatePath('/');
      return { success: "Link deleted successfully!" };
    } else {
      return { error: "Failed to find link for deletion or link already deleted." };
    }
  } catch (error) {
    console.error("Error deleting link:", error);
    return { error: "Failed to delete link due to a server error." };
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
