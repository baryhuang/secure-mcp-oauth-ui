import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { provider, code, state, error, error_description } = req.query;
  
  // Construct the frontend callback URL with all query parameters
  const callbackParams = new URLSearchParams();
  if (provider) callbackParams.append('provider', provider as string);
  if (code) callbackParams.append('code', code as string);
  if (state) callbackParams.append('state', state as string);
  if (error) callbackParams.append('error', error as string);
  if (error_description) callbackParams.append('error_description', error_description as string);
  
  // Redirect to the frontend callback page
  res.redirect(`/auth/callback?${callbackParams.toString()}`);
} 