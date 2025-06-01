
'use server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from './constants';

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function createSession(username: string) {
  cookies().set(SESSION_COOKIE_NAME, username, {
    httpOnly: true,
    secure: false, // FOR DEBUGGING IN HTTP ENV - Was: process.env.NODE_ENV === 'production'
    maxAge: SESSION_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  });
}

export async function getSession(): Promise<{ username: string } | null> {
  const sessionValue = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (sessionValue) {
    return { username: sessionValue };
  }
  return null;
}

export async function clearSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
