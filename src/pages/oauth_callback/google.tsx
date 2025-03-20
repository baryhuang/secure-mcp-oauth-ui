import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Spinner, Center, VStack, Text } from '@chakra-ui/react';

export default function GoogleOAuthCallback() {
  const router = useRouter();
  
  useEffect(() => {
    const { code } = router.query;
    
    if (code) {
      // Store provider identifier in localStorage for callback handling
      localStorage.setItem('oauth_pending_provider', 'gmail');
      
      // Redirect to home page with the code and provider state
      router.replace({
        pathname: '/',
        query: { code, state: 'gmail' }
      });
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