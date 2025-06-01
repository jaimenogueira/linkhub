'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getUsers, addLinkEntry, saveUploadedFile, getLinks as fetchLinksFs } from './fs-utils';
import { createSession, getSession, clearSession } from './auth';
import type { LinkEntry } from './constants';
import { LINKS_FILE_PATH, USERS_FILE_PATH, PUBLIC_IMAGES_PATH, PUBLIC_DATA_PATH } from './constants';
import fs from 'fs/promises';
import path from 'path';

// Ensure essential directories and files exist on startup or first action
async function initializeDataFiles() {
  try {
    await fs.mkdir(path.dirname(USERS_FILE_PATH), { recursive: true });
    await fs.stat(USERS_FILE_PATH);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(USERS_FILE_PATH, 'admin:admin123\n'); // Default user
    }
  }

  try {
    await fs.mkdir(path.dirname(LINKS_FILE_PATH), { recursive: true });
    await fs.stat(LINKS_FILE_PATH);
  } catch (e) {
     if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(LINKS_FILE_PATH, ''); // Empty links file
    }
  }
  await fs.mkdir(PUBLIC_IMAGES_PATH, { recursive: true });
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
  icon: z.instanceof(File).refine(file => file.size > 0, "Icon is required")
                         .refine(file => file.size <= 5 * 1024 * 1024, "Icon must be less than 5MB")
                         .refine(file => ["image/jpeg", "image/png", "image/gif", "image/svg+xml"].includes(file.type), "Only JPEG, PNG, GIF, SVG images are allowed"),
});

export async function addLink(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized." };
  }

  const validatedFields = AddLinkSchema.safeParse({
    name: formData.get('name'),
    url: formData.get('url'),
    icon: formData.get('icon'),
  });
  
  if (!validatedFields.success) {
    return { error: "Invalid fields.", details: validatedFields.error.flatten().fieldErrors };
  }

  const { name, url, icon } = validatedFields.data;

  try {
    const uniqueFileName = `${Date.now()}-${icon.name.replace(/\s+/g, '_')}`;
    const iconPath = await saveUploadedFile(icon, uniqueFileName);
    await addLinkEntry(name, url, iconPath);
    revalidatePath('/');
    return { success: "Link added successfully!" };
  } catch (error) {
    console.error("Error adding link:", error);
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
