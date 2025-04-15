const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.secure-mcp-oauth.com';
export { API_BASE_URL };

// OAuth configuration - these should ideally come from environment variables
const OAUTH_CONFIG = {
  gmail: {
    clientId: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || '594074475192-56d8c2dg020cvvtpq6ujp5rkd7urkm60.apps.googleusercontent.com'
  },
  twitter: {
    clientId: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID || 'dHVJeVFEYm56a2dOYzhFN211aUM6MTpjaQ'
  },
  zoom: {
    clientId: process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID || '1zz2ioOPQLWLQcXcaGdVg'
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
  if (provider === 'gmail') {
    return `http://localhost:5173/oauth_callback/google`;
  } else if (provider === 'twitter') {
    return `http://localhost:5173/oauth_callback/twitter`;
  } else if (provider === 'zoom') {
    return `http://localhost:5173/oauth_callback/zoom`;
  } else {
    return `http://localhost:5173/oauth_callback/${provider}`;
  }
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

/**
 * Generate a random string for PKCE code_verifier
 * Following the RFC 7636 spec for PKCE
 */
function generateCodeVerifier(length: number = 43): string {
  // Generate random bytes
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  
  // Convert to base64url encoding (URL-safe base64)
  let base64 = btoa(String.fromCharCode.apply(null, Array.from(randomBytes)));
  
  // Make base64 string URL safe: replace '+' with '-', '/' with '_', and remove '='
  base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  // Ensure we only use allowed characters per RFC 7636
  base64 = base64.replace(/[^A-Za-z0-9\-._~]/g, '');
  
  // Trim to requested length
  return base64.substring(0, length);
}

/**
 * Calculate the code challenge from a verifier using S256 method
 * Following the RFC 7636 spec for PKCE
 */
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  // Convert verifier string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  
  // Calculate SHA-256 hash
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  
  // Convert hash to base64url encoding
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(hash))));
  
  // Make base64 string URL safe: replace '+' with '-', '/' with '_', and remove '='
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Initiates Twitter OAuth flow using the direct authorization URL
 */
export const authorizeTwitter = async (): Promise<void> => {
  const clientId = OAUTH_CONFIG.twitter.clientId;
  const redirectUri = getRedirectUri('twitter');
  const scope = 'tweet.read users.read tweet.write offline.access';
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  const encodedScope = encodeURIComponent(scope);
  
  // Generate a code verifier
  const codeVerifier = generateCodeVerifier();
  localStorage.setItem('twitter_code_verifier', codeVerifier);
  
  // Generate code challenge using S256 method
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Redirect to Twitter authorization URL
  window.location.href = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=${encodedScope}&state=twitter&code_challenge=${codeChallenge}&code_challenge_method=S256`;
};

/**
 * Initiates Zoom OAuth flow using the direct authorization URL
 */
export const authorizeZoom = (): void => {
  const clientId = OAUTH_CONFIG.zoom.clientId;
  const redirectUri = getRedirectUri('zoom');
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  
  // Store provider name for callback handling
  localStorage.setItem('oauth_pending_provider', 'zoom');
  
  // Redirect to Zoom authorization URL
  window.location.href = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirectUri}`;
}; 