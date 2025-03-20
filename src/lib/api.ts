const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.secure-mcp-oauth.com';
export { API_BASE_URL };

// OAuth configuration - these should ideally come from environment variables
const OAUTH_CONFIG = {
  sketchfab: {
    clientId: process.env.NEXT_PUBLIC_SKETCHFAB_CLIENT_ID || 'tpZqqaJJn5iFTPc2EBVDP4l62qchGxrTEKzS4yFO'
  },
  gmail: {
    clientId: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || '594074475192-56d8c2dg020cvvtpq6ujp5rkd7urkm60.apps.googleusercontent.com'
  }
};

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
 * Get the redirect URI for a specific OAuth provider
 */
const getRedirectUri = (provider: string): string => {
  return `http://localhost:5173/oauth_callback/${provider === 'gmail' ? 'google' : provider}`;
};

/**
 * Initiates Sketchfab OAuth flow using the direct authorization URL
 */
export const authorizeSketchfab = (): void => {
  const clientId = OAUTH_CONFIG.sketchfab.clientId;
  const redirectUri = getRedirectUri('sketchfab');
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  
  window.location.href = `https://sketchfab.com/oauth2/authorize/?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirectUri}`;
};

/**
 * Initiates Gmail OAuth flow using the direct authorization URL
 */
export const authorizeGmail = (): void => {
  const clientId = OAUTH_CONFIG.gmail.clientId;
  const redirectUri = getRedirectUri('gmail');
  const scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  const encodedScope = encodeURIComponent(scope);
  
  window.location.href = `https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=${encodedScope}&access_type=offline&prompt=consent`;
}; 