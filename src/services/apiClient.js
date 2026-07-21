import { auth } from "../firebase";

const sendAuthenticatedRequest = async (url, options, forceRefresh) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Please sign in to use OrbitalAI.");
  }

  const token = await user.getIdToken(forceRefresh);
  const headers = new Headers(options?.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, {
    ...options,
    headers,
  });
};

export const apiFetch = async (url, options = {}) => {
  let response = await sendAuthenticatedRequest(url, options, false);

  if (response.status === 401 && auth.currentUser) {
    response = await sendAuthenticatedRequest(url, options, true);
  }

  return response;
};

