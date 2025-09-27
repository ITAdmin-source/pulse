import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const SESSION_COOKIE_NAME = "pulse_session_id";
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (existingSessionId) {
    return existingSessionId;
  }

  const newSessionId = uuidv4();

  cookieStore.set(SESSION_COOKIE_NAME, newSessionId, {
    maxAge: SESSION_COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return newSessionId;
}

/**
 * Clear session ID - used when user signs up to become authenticated
 */
export async function clearSessionId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Restore session ID - used when authenticated user logs out
 */
export async function restoreSessionId(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    maxAge: SESSION_COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export async function getSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}