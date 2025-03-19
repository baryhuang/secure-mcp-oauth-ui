const API_BASE_URL = 'http://localhost:8000';

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
  [key: string]: any;
}

export interface UserInfo {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  [key: string]: any;
}

/**
 * Initiates OAuth flow by redirecting to the provider's authorization page
 */
export const authorizeOAuth = (provider: string): void => {
  window.location.href = `${API_BASE_URL}/api/oauth/authorize/${provider}`;
};

/**
 * Handles the OAuth callback with the authorization code
 */
export const handleOAuthCallback = async (
  provider: string,
  code: string,
  state?: string
): Promise<OAuthTokenResponse> => {
  const params = new URLSearchParams({ code });
  if (state) params.append('state', state);
  
  const response = await fetch(
    `${API_BASE_URL}/api/oauth/callback/${provider}?${params.toString()}`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to complete OAuth flow');
  }
  
  return response.json();
};

/**
 * Refreshes an OAuth access token
 */
export const refreshOAuthToken = async (
  provider: string,
  userId: string,
  refreshToken: string
): Promise<OAuthTokenResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/oauth/refresh/${provider}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      refresh_token: refreshToken,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to refresh token');
  }
  
  return response.json();
};

/**
 * Gets user information from the OAuth provider
 */
export const getUserInfo = async (
  provider: string,
  userId: string
): Promise<UserInfo> => {
  const response = await fetch(
    `${API_BASE_URL}/api/oauth/me/${provider}?user_id=${userId}`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get user info');
  }
  
  return response.json();
};

/**
 * Gets the list of supported OAuth providers
 */
export const getOAuthProviders = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/api/oauth/providers`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get providers');
  }
  
  return response.json();
};

/**
 * Initiates Sketchfab OAuth flow using the direct authorization URL
 */
export const authorizeSketchfab = (): void => {
  const clientId = 'tpZqqaJJn5iFTPc2EBVDP4l62qchGxrTEKzS4yFO';
  const redirectUri = 'http://localhost:5173';
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  
  window.location.href = `https://sketchfab.com/oauth2/authorize/?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirectUri}`;
}; 