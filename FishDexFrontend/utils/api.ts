import { API_URL } from '@/constants/api';

export const authFetch = async (
  url: string,
  token: string,
  options: RequestInit = {},
  onUnauthorized: () => void
): Promise<Response> => {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    }
  });

  if (response.status === 401) {
    onUnauthorized();  // ← called when token is rejected
  }

  return response;
};