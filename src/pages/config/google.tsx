import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  useToast,
  Card,
  CardBody,
  Switch,
  Link,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  OrderedList,
  ListItem,
  HStack,
} from '@chakra-ui/react';
import { ExternalLinkIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { saveProviderConfig, getProviderConfig } from '../../lib/config/providerConfig';
import dynamic from 'next/dynamic';

// Import the CallbackUrls component with no SSR
const CallbackUrls = dynamic(() => import('../../components/CallbackUrls'), {
  ssr: false,
});

export default function GoogleConfig() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const config = getProviderConfig('google');
    if (config) {
      setClientId(config.clientId);
      setClientSecret(config.clientSecret);
      setEnabled(config.enabled);
    }
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      saveProviderConfig('google', {
        clientId,
        clientSecret,
        enabled,
      });

      toast({
        title: 'Configuration saved',
        description: 'Google OAuth configuration has been updated successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error saving configuration',
        description: 'There was an error saving the configuration. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    setIsLoading(false);
  };

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="stretch">
        <Box>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading size="lg">Google OAuth Configuration</Heading>
            <Link href="/" _hover={{ textDecoration: 'none' }}>
              <Button
                leftIcon={<ArrowBackIcon />}
                variant="ghost"
                colorScheme="blue"
              >
                Back to Home
              </Button>
            </Link>
          </HStack>
          <Text color="gray.600">
            Configure your Google OAuth credentials for authentication.
          </Text>
        </Box>

        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>How to get Google OAuth credentials:</AlertTitle>
            <AlertDescription>
              <OrderedList spacing={2} mt={2}>
                <ListItem>
                  Go to the{' '}
                  <Link
                    href="https://console.cloud.google.com/apis/credentials"
                    isExternal
                    color="blue.500"
                  >
                    Google Cloud Console <ExternalLinkIcon mx="2px" />
                  </Link>
                </ListItem>
                <ListItem>Create a new project or select an existing one</ListItem>
                <ListItem>Click "Create Credentials" and select "OAuth client ID"</ListItem>
                <ListItem>Set up the OAuth consent screen if you haven't already</ListItem>
                <ListItem>
                  Add these authorized redirect URIs:
                  <CallbackUrls />
                </ListItem>
              </OrderedList>
            </AlertDescription>
          </Box>
        </Alert>

        <Card>
          <CardBody>
            <VStack spacing={6}>
              <FormControl>
                <FormLabel>Enable Google OAuth</FormLabel>
                <Switch
                  size="lg"
                  isChecked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Client ID</FormLabel>
                <Input
                  placeholder="Enter your Google OAuth client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Client Secret</FormLabel>
                <Input
                  type="password"
                  placeholder="Enter your Google OAuth client secret"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </FormControl>

              <Button
                colorScheme="blue"
                size="lg"
                width="full"
                onClick={handleSave}
                isLoading={isLoading}
                loadingText="Saving..."
                bgGradient="linear-gradient(135deg, #0077FF 0%, #00C6FF 100%)"
                _hover={{
                  bgGradient: 'linear-gradient(135deg, #0066DD 0%, #00B4FF 100%)',
                }}
              >
                Save Configuration
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}
