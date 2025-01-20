import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Link,
} from '@chakra-ui/react';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  const getErrorMessage = (error: string | string[] | undefined) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Provider Configuration Error',
          description: 'The OAuth provider is not properly configured. Please check your configuration settings.',
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You did not grant permission to access your account.',
        };
      case 'Callback':
        return {
          title: 'Callback Error',
          description: 'There was an error processing the authentication callback.',
        };
      default:
        return {
          title: 'Authentication Error',
          description: 'An error occurred during authentication. Please try again.',
        };
    }
  };

  const errorDetails = getErrorMessage(error);

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={8} align="stretch">
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          bg="red.50"
          rounded="xl"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            {errorDetails.title}
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {errorDetails.description}
          </AlertDescription>
        </Alert>

        <Box textAlign="center">
          <Text mb={4}>
            Need to configure your OAuth provider?{' '}
            <Link href="/config/google" color="blue.500">
              Go to configuration
            </Link>
          </Text>

          <Button
            onClick={() => router.push('/')}
            size="lg"
            colorScheme="blue"
            rounded="full"
            px={8}
            bgGradient="linear-gradient(135deg, #0077FF 0%, #00C6FF 100%)"
            _hover={{
              bgGradient: 'linear-gradient(135deg, #0066DD 0%, #00B4FF 100%)',
            }}
          >
            Return to Home
          </Button>
        </Box>
      </VStack>
    </Container>
  );
}
