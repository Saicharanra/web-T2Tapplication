import { auth } from "@/lib/firebase-client";

/**
 * Helper to wait for the Firebase Auth state observer to initialize.
 * Prevents race conditions during initial page paint where auth.currentUser is null.
 */
function waitForAuthInit(): Promise<any> {
  return new Promise((resolve) => {
    // If Firebase Auth is already initialized, resolve immediately
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    // Otherwise, listen for the first authentication state transition
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let token = null;
  
  // 1. Wait for Auth to initialize if auth.currentUser is not yet populated
  let currentUser = auth.currentUser;
  if (!currentUser) {
    currentUser = await waitForAuthInit();
  }

  // 2. Refresh and fetch standard ID token
  if (currentUser) {
    try {
      token = await currentUser.getIdToken(true);
    } catch (tokenErr) {
      console.warn("⚠️ Failed to refresh Firebase ID token:", tokenErr);
      // Fallback to standard non-refreshed token
      token = await currentUser.getIdToken().catch(() => null);
    }
  }

  // 3. Attach Bearer authorization header
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
