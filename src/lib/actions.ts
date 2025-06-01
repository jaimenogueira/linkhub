
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
      // Check if the directory exists. fs.stat will throw if path doesn't exist.
      // Ensure the directory for the file path exists before trying to access the file.
      const dirname = path.dirname(filePath);
      try {
        await fs.access(dirname);
      } catch (dirError) {
        if ((dirError as NodeJS.ErrnoException).code === 'ENOENT') {
          // If directory doesn't exist, create it recursively.
          await fs.mkdir(dirname, { recursive: true });
        } else {
          // For errors other than directory not found, rethrow.
          throw dirError;
        }
      }
      // Now, try to access the file.
      await fs.access(filePath);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        // If file doesn't exist, write the default content.
        await fs.writeFile(filePath, defaultContent);
      } else {
        // For errors other than file not found, rethrow to indicate a more serious issue.
        throw e;
      }
    }
  };

  try {
    // Ensure all necessary directories exist first by ensuring their deepest files are processed by ensureFileExistsWithDefaultContent.
    // This approach simplifies directory creation logic by tying it to file presence.
    // If a directory is solely needed without a specific file, fs.mkdir with { recursive: true } is more direct.
    // For this app, critical files imply their directories must exist.

    // Explicitly ensure base directories if they might not contain files handled by ensureFileExistsWithDefaultContent
    await fs.mkdir(path.dirname(USERS_FILE_PATH), { recursive: true });
    await fs.mkdir(path.dirname(LINKS_FILE_PATH), { recursive: true }); // This is PUBLIC_DATA_PATH
    await fs.mkdir(PUBLIC_IMAGES_PATH, { recursive: true });


    // Ensure critical files exist, creating them with default content if they don't.
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
    .optional(), // Icon is now optional
});

export async function addLink(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized." };
  }

  const validatedFields = AddLinkSchema.safeParse({
    name: formData.get('name'),
    url: formData.get('url'),
    // FormData.get returns File | string | null. If 'icon' is not in formData, it's null.
    // Zod's optional will handle undefined/null if 'icon' is not appended by client.
    // If client appends a file, it will be a File object.
    icon: formData.get('icon') instanceof File ? formData.get('icon') : undefined,
  });
  
  if (!validatedFields.success) {
    return { error: "Invalid fields.", details: validatedFields.error.flatten().fieldErrors };
  }

  const { name, url, icon } = validatedFields.data;
  let iconPath = ''; // Default to empty string if no icon or if icon processing fails

  if (icon && icon.size > 0) { // Check if an icon was provided and is not an empty file
    try {
      const uniqueFileName = `${Date.now()}-${icon.name.replace(/\s+/g, '_')}`;
      iconPath = await saveUploadedFile(icon, uniqueFileName);
    } catch (uploadError) {
      console.error("Error saving uploaded icon:", uploadError);
      // Decide if this should be a hard error or allow link saving without icon
      // For now, let's proceed with empty iconPath if upload fails
      // return { error: "Failed to save icon." }; 
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
