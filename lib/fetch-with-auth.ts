/**
 * Fetches a URL with the user ID from localStorage attached as Authorization header.
 * Replaces the Firebase token-based fetchWithAuth.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const userId = typeof window !== "undefined" ? localStorage.getItem("t2t_user_id") : null;

  const headers = new Headers(options.headers || {});
  if (userId) {
    headers.set("Authorization", `Bearer ${userId}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
