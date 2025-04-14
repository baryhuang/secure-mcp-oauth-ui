import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Spinner, Center, VStack, Text } from '@chakra-ui/react';
import { API_BASE_URL } from '../../lib/api';

export default function GoogleOAuthCallback() {
  const router = useRouter();
  
  useEffect(() => {
    const { code } = router.query;
    
    if (code) {
      // Store provider identifier in localStorage for callback handling
      localStorage.setItem('oauth_pending_provider', 'gmail');
      
      // Make direct API call to exchange the code for tokens
      const exchangeCodeForToken = async () => {
        try {
          const params = new URLSearchParams();
          params.append('code', code as string);
          params.append('grant_type', 'authorization_code');
          
          const url = `${API_BASE_URL}/api/oauth/callback/google?${params.toString()}`;
          
          const response = await fetch(url);
          
          if (!response.ok) {
            console.error('Error exchanging code for token:', response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            throw new Error('Failed to exchange code for token');
          }
          
          const data = await response.json();
          console.log('Google OAuth response:', data);
          
          // Check if the response has the new format (success, user_info, token_info)
          if (data.success && data.user_info && data.token_info) {
            const userId = data.user_info.id;
            
            // Store token info
            localStorage.setItem(
              `oauth_token_google_${userId}`,
              JSON.stringify(data.token_info)
            );
            
            // Store user info
            localStorage.setItem(
              `oauth_user_google_${userId}`,
              JSON.stringify(data.user_info)
            );
            
            console.log('Stored Google user and token data for:', userId);
          } 
          // Fallback for older response format
          else if (data.access_token) {
            // For older format, we might not have a user ID
            const userId = data.user_id || 'default';
            
            localStorage.setItem(
              `oauth_token_google_${userId}`,
              JSON.stringify(data)
            );
            
            console.log('Stored Google token data using legacy format');
          }
          
          // Redirect to home page after successful data storage
          window.location.href = '/';
        } catch (error) {
          console.error('Error in token exchange:', error);
          // Use window.location for more reliable redirect on error
          window.location.href = '/?error=token_exchange_failed&state=gmail';
        }
      };
      
      exchangeCodeForToken();
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
          <Text fontSize="xl">Processing Google authorization...</Text>
        </VStack>
      </Center>
    </Box>
  );
} 