import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Container, Heading, Spinner, Text, Alert, AlertIcon, Link as ChakraLink } from '@chakra-ui/react';
import NextLink from 'next/link';
import { handleOAuthCallback, getUserInfo } from '../../lib/api';

const OAuthCallback = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Only process the callback once router is ready and we have query params
    if (!router.isReady) return;
    
    const processCallback = async () => {
      try {
        // Extract parameters from URL
        const { provider, code, state, error, error_description } = router.query;
        
        // Check for errors from OAuth provider
        if (error) {
          throw new Error(error_description as string || error as string);
        }
        
        // Ensure we have the required parameters
        if (!provider || !code) {
          throw new Error('Missing required parameters');
        }
        
        // Handle the OAuth callback
        const tokenResponse = await handleOAuthCallback(
          provider as string,
          code as string,
          state as string | undefined
        );
        
        // Get user info if we have a user ID
        if (tokenResponse.user_id) {
          const userInfo = await getUserInfo(provider as string, tokenResponse.user_id);
          
          // Store token information in localStorage or state management system
          localStorage.setItem(
            `oauth_token_${provider}`,
            JSON.stringify(tokenResponse)
          );
          
          // Store user information
          localStorage.setItem(
            `oauth_user_${provider}_${tokenResponse.user_id}`,
            JSON.stringify(userInfo)
          );
        }
        
        // Redirect back to the appropriate page
        const redirectPath = '/';
        
        router.push({
          pathname: redirectPath,
          query: {
            auth_success: 'true',
            provider: provider as string,
            user_id: tokenResponse.user_id
          }
        });
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setIsLoading(false);
      }
    };
    
    processCallback();
  }, [router.isReady, router.query]);
  
  if (isLoading) {
    return (
      <Container centerContent py={10}>
        <Box textAlign="center" py={10} px={6}>
          <Heading mb={4}>Processing Authentication</Heading>
          <Spinner size="xl" mb={4} />
          <Text>Please wait while we complete your authentication...</Text>
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container centerContent py={10}>
        <Box textAlign="center" py={10} px={6}>
          <Heading mb={4}>Authentication Error</Heading>
          <Alert status="error" borderRadius="md" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
          <Text mb={4}>
            Please try again or contact support if the problem persists.
          </Text>
          <Text>
            <NextLink href="/" legacyBehavior>
              <ChakraLink color="blue.500" textDecoration="underline">
                Return to home page
              </ChakraLink>
            </NextLink>
          </Text>
        </Box>
      </Container>
    );
  }
  
  return null;
};

export default OAuthCallback; 