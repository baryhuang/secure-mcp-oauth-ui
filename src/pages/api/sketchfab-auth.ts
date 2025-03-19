import type { NextApiRequest, NextApiResponse } from 'next';
import { getProviderConfig } from '../../lib/config/providerConfig';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const config = getProviderConfig('sketchfab');
  const clientId = config?.clientId || 'tpZqqaJJn5iFTPc2EBVDP4l62qchGxrTEKzS4yFO';
  const redirectUri = 'http://localhost:5173';
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  
  // Redirect to the Sketchfab OAuth authorization page directly
  res.redirect(`https://sketchfab.com/oauth2/authorize/?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirectUri}`);
} 