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
            
            const data = await response.json();
            console.log('Twitter OAuth response:', data);
            
            // Check if the response has the new format (success, user_info, token_info)
            if (data.success && data.user_info && data.token_info) {
              const userId = data.user_info.id;
              
              // Store token info
              localStorage.setItem(
                `oauth_token_twitter_${userId}`,
                JSON.stringify(data.token_info)
              );
              
              // Store user info
              localStorage.setItem(
                `oauth_user_twitter_${userId}`,
                JSON.stringify(data.user_info)
              );
              
              console.log('Stored Twitter user and token data for:', userId);
            } 
            // Fallback for older response format
            else if (data.user_id) {
              localStorage.setItem(
                `oauth_token_twitter_${data.user_id}`,
                JSON.stringify(data)
              );
            }
            
            // Store provider identifier for callback handling on home page
            localStorage.setItem('oauth_pending_provider', 'twitter');
            
            // Force navigate to the root URL with window.location instead of router.replace
            window.location.href = '/';
          } catch (error) {
            console.error('Error in token exchange:', error);
            // Use window.location for more reliable redirect on error
            window.location.href = '/?error=token_exchange_failed&state=twitter';
          }
        };
        
        exchangeCodeForToken();
      } else {
        console.error('No code verifier found in localStorage');
        // Store provider identifier for callback handling
        localStorage.setItem('oauth_pending_provider', 'twitter');
        
        // Use window.location for more reliable redirect
        window.location.href = `/?code=${code}&state=twitter&error=missing_code_verifier`;
      }
    } else {
      // If no code is present, just go back to the home page using window.location
      window.location.href = '/';
    }
    
    // Return a cleanup function
    return () => {
      console.log('Twitter OAuth callback component unmounting');
      // Any cleanup can be added here if needed
    };
  }, [router.query]);
  
  return (
    <Box height="100vh" width="100%">
      <Center height="100%">
        <VStack spacing={6}>
          <Spinner size="xl" color="blue.500" thickness="4px" speed="0.65s" />
          <Text fontSize="xl">Processing Twitter authorization...</Text>
          <Text fontSize="sm" color="gray.500">You will be redirected automatically...</Text>
        </VStack>
      </Center>
    </Box>
  );
} 