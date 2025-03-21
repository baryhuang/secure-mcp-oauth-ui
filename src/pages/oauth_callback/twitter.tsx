import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Spinner, Center, VStack, Text } from '@chakra-ui/react';
import { API_BASE_URL } from '../../lib/api';

export default function TwitterOAuthCallback() {
  const router = useRouter();
  
  useEffect(() => {
    const { code } = router.query;
    
    if (code) {
      // Retrieve the code verifier from localStorage
      const codeVerifier = localStorage.getItem('twitter_code_verifier');
      
      if (codeVerifier) {
        // Make direct API call to exchange the code for tokens
        const exchangeCodeForToken = async () => {
          try {
            // Add the code_verifier to the request
            const params = new URLSearchParams();
            params.append('code', code as string);
            params.append('code_verifier', codeVerifier);
            params.append('grant_type', 'authorization_code');
            
            const url = `${API_BASE_URL}/api/oauth/callback/twitter?${params.toString()}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
              console.error('Error exchanging code for token:', response.statusText);
              const errorText = await response.text();
              console.error('Error details:', errorText);
              throw new Error('Failed to exchange code for token');
            }
            
            const tokenData = await response.json();
            
            // Store the token data in localStorage
            if (tokenData.user_id) {
              localStorage.setItem(
                `oauth_token_twitter_${tokenData.user_id}`,
                JSON.stringify(tokenData)
              );
            }
            
            // Store provider identifier for callback handling on home page
            localStorage.setItem('oauth_pending_provider', 'twitter');
            
            // Navigate to home page with code
            router.replace({
              pathname: '/',
              query: { code, state: 'twitter' }
            });
          } catch (error) {
            console.error('Error in token exchange:', error);
            // Still redirect to home to show error there
            router.replace('/');
          }
        };
        
        exchangeCodeForToken();
      } else {
        console.error('No code verifier found in localStorage');
        // Store provider identifier for callback handling
        localStorage.setItem('oauth_pending_provider', 'twitter');
        
        // Redirect to home page with the code and state
        router.replace({
          pathname: '/',
          query: { code, state: 'twitter', error: 'missing_code_verifier' }
        });
      }
    } else {
      // If no code is present, just go back to the home page
      router.replace('/');
    }
  }, [router.query, router]);
  
  return (
    <Box height="100vh" width="100%">
      <Center height="100%">
        <VStack spacing={6}>
          <Spinner size="xl" color="blue.500" thickness="4px" speed="0.65s" />
          <Text fontSize="xl">Processing Twitter authorization...</Text>
        </VStack>
      </Center>
    </Box>
  );
} 