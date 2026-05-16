import { auth } from "@/lib/firebase-client";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let token = null;
  
  if (auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  }

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
