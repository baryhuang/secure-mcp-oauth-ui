import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Card,
  CardBody,
  Text,
  Button,
  Badge,
  useToast,
  Flex,
  Stack,
  Icon,
  SimpleGrid,
  useColorModeValue,
  Divider,
  Link,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Collapse,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, ViewIcon, ViewOffIcon, CopyIcon } from '@chakra-ui/icons';
import { useSession, signIn, signOut } from 'next-auth/react';
import { FiLock, FiRefreshCcw, FiShield } from 'react-icons/fi';
import { Session } from 'next-auth';
import NextLink from 'next/link';

// Augment the Session type to include accessToken
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}

// Define animations using style objects instead of keyframes
const fadeInAnimation = {
  hidden: { opacity: 0, transform: 'translateY(20px)' },
  visible: { opacity: 1, transform: 'translateY(0)' }
};

interface Integration {
  name: string;
  isConnected: boolean;
  description: string;
  scope: string;
}

interface FeatureProps {
  title: string;
  text: string;
  icon: any;
  delay: number;
}

const Feature = ({ title, text, icon, delay }: FeatureProps) => {
  return (
    <Stack
      align={'center'}
      textAlign={'center'}
      p={12}
      borderRadius="2xl"
      bg={useColorModeValue('white', 'gray.800')}
      position="relative"
      opacity={0}
      style={{
        animation: `0.6s ease-out ${delay}s forwards running slideFadeIn`,
      }}
      sx={{
        '@keyframes slideFadeIn': {
          '0%': {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '2xl',
        backdropFilter: 'blur(20px)',
        zIndex: 0,
      }}
    >
      <Flex
        w={24}
        h={24}
        align={'center'}
        justify={'center'}
        color={'white'}
        rounded={'full'}
        bg="linear-gradient(135deg, #0077FF 0%, #00C6FF 100%)"
        mb={4}
        position="relative"
        zIndex={1}
      >
        <Icon as={icon} w={12} h={12} />
      </Flex>
      <Text fontWeight={600} fontSize="2xl" mb={2} position="relative" zIndex={1}>
        {title}
      </Text>
      <Text color={'gray.500'} fontSize="lg" position="relative" zIndex={1}>
        {text}
      </Text>
    </Stack>
  );
};

export default function Home() {
  const { data: session } = useSession();
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      name: 'Google Drive',
      isConnected: false,
      description: 'Connect to access and manage your Google Drive files',
      scope: 'https://www.googleapis.com/auth/drive.file',
    },
    {
      name: 'Sketchfab',
      isConnected: false,
      description: 'Connect to access your Sketchfab 3D models',
      scope: 'read',
    },
  ]);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [tokenData, setTokenData] = useState<Record<string, any>>({});
  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)');

  // Handle OAuth callback with code parameter
  useEffect(() => {
    const handleSketchfabCallback = async () => {
      // Check if URL has code parameter (OAuth callback)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          console.log('Processing Sketchfab OAuth callback with code:', code);
          toast({
            title: 'Processing Authentication',
            description: 'Completing Sketchfab authentication...',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
          
          // Call backend to exchange code for token
          const response = await fetch(`http://localhost:8000/api/oauth/callback/sketchfab?code=${code}`);
          
          if (!response.ok) {
            throw new Error('Failed to exchange code for token');
          }
          
          const tokenData = await response.json();
          console.log('Token received:', tokenData);
          
          // Store token data
          if (tokenData.user_id) {
            localStorage.setItem(
              `oauth_token_sketchfab_${tokenData.user_id}`,
              JSON.stringify(tokenData)
            );
            
            // Get user info
            const userResponse = await fetch(
              `http://localhost:8000/api/oauth/me/sketchfab?user_id=${tokenData.user_id}`
            );
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              localStorage.setItem(
                `oauth_user_sketchfab_${tokenData.user_id}`,
                JSON.stringify(userData)
              );
            }
            
            // Update integrations state
            setIntegrations(prev => 
              prev.map(int => ({
                ...int,
                isConnected: int.name === 'Sketchfab' ? true : int.isConnected
              }))
            );
            
            toast({
              title: 'Authentication Successful',
              description: 'Connected to Sketchfab successfully',
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {
          console.error('Error processing Sketchfab callback:', error);
          toast({
            title: 'Authentication Error',
            description: 'Failed to complete Sketchfab authentication',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    };
    
    handleSketchfabCallback();
  }, [toast]);

  useEffect(() => {
    // Check localStorage for tokens on initial load
    const checkStoredTokens = () => {
      const localStorageKeys = Object.keys(localStorage);
      const sketchfabTokenKey = localStorageKeys.find(key => key.startsWith('oauth_token_sketchfab_'));
      
      // Update Sketchfab connection status based on localStorage
      if (sketchfabTokenKey) {
        try {
          const tokenData = JSON.parse(localStorage.getItem(sketchfabTokenKey) || '{}');
          if (tokenData.token_info?.access_token) {
            setIntegrations(prev => 
              prev.map(int => ({
                ...int,
                isConnected: int.name === 'Sketchfab' ? true : int.isConnected
              }))
            );
            
            // Store token data for display
            setTokenData(prev => ({
              ...prev,
              'Sketchfab': tokenData.token_info
            }));
          }
        } catch (error) {
          console.error('Error parsing Sketchfab token from localStorage:', error);
        }
      }
    };
    
    checkStoredTokens();
  }, []);

  useEffect(() => {
    if (session?.accessToken) {
      setIntegrations(prev => 
        prev.map(int => ({
          ...int,
          isConnected: int.name === 'Google Drive'
        }))
      );
      
      // Store Google token data for display
      setTokenData(prev => ({
        ...prev,
        'Google Drive': { 
          access_token: session.accessToken,
          token_type: 'Bearer'
        }
      }));
    } else {
      setIntegrations(prev => 
        prev.map(int => ({
          ...int,
          isConnected: int.name === 'Google Drive' ? false : int.isConnected
        }))
      );
      
      // Remove Google token data if disconnected
      setTokenData(prev => {
        const newTokenData = { ...prev };
        delete newTokenData['Google Drive'];
        return newTokenData;
      });
    }
  }, [session]);

  const handleToggleToken = (integrationName: string) => {
    setShowTokens(prev => ({
      ...prev,
      [integrationName]: !prev[integrationName]
    }));
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: 'Token Copied',
      description: 'Access token has been copied to clipboard',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleConnect = async (integration: Integration) => {
    if (integration.name === 'Google Drive') {
      if (!integration.isConnected) {
        try {
          await signIn('google', {
            callbackUrl: window.location.origin,
          });
        } catch (error) {
          toast({
            title: 'Connection Failed',
            description: 'Failed to connect to Google Drive',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        await signOut({ callbackUrl: window.location.origin });
      }
    } else if (integration.name === 'Sketchfab') {
      if (!integration.isConnected) {
        // Initiate Sketchfab OAuth flow directly
        try {
          toast({
            title: 'Connecting to Sketchfab',
            description: 'Initializing authentication...',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
          
          // Call backend to get OAuth URL
          const response = await fetch('http://localhost:8000/api/oauth/authorize/sketchfab');
          
          if (!response.ok) {
            throw new Error('Failed to initiate Sketchfab authentication');
          }
          
          const data = await response.json();
          
          // Redirect to Sketchfab authorization page
          if (data.authorization_url) {
            window.location.href = data.authorization_url;
          } else {
            throw new Error('No authorization URL received');
          }
        } catch (error) {
          console.error('Error initiating Sketchfab auth:', error);
          toast({
            title: 'Connection Failed',
            description: 'Failed to connect to Sketchfab',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        // Disconnect Sketchfab
        const localStorageKeys = Object.keys(localStorage);
        const sketchfabTokenKeys = localStorageKeys.filter(key => 
          key.startsWith('oauth_token_sketchfab_') || 
          key.startsWith('oauth_user_sketchfab_') || 
          key === 'sketchfab_direct_auth_response'
        );
        
        // Remove all Sketchfab tokens from localStorage
        sketchfabTokenKeys.forEach(key => localStorage.removeItem(key));
        
        // Update state
        setIntegrations(prev => 
          prev.map(int => ({
            ...int,
            isConnected: int.name === 'Sketchfab' ? false : int.isConnected
          }))
        );
        
        // Remove from tokenData
        setTokenData(prev => {
          const newTokenData = { ...prev };
          delete newTokenData['Sketchfab'];
          return newTokenData;
        });
        
        toast({
          title: 'Disconnected',
          description: 'Successfully disconnected from Sketchfab',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleExportConfig = () => {
    const mcpConfig = {
      version: '1.0',
      integrations: integrations.map(int => ({
        name: int.name,
        status: int.isConnected ? 'connected' : 'disconnected',
        scope: int.scope,
        accessToken: int.isConnected ? session?.accessToken : null,
      })),
    };

    const configStr = JSON.stringify(mcpConfig, null, 2);
    navigator.clipboard.writeText(configStr);
    
    toast({
      title: 'MCP Config Copied',
      description: 'Configuration has been copied to clipboard',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box bg={bgColor} minH="100vh" overflow="hidden">
      {/* Integrations Section */}
      <Box 
        bg="white" 
        py={32} 
        id="integrations"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 100%)',
          zIndex: 0,
        }}
      >
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <Heading 
            mb={20} 
            textAlign="center" 
            fontSize={{ base: '3xl', md: '5xl' }}
            fontWeight="bold"
          >
            Integrations
          </Heading>
          <VStack spacing={8} align="stretch">
            {integrations.map((integration) => (
              <Card
                key={integration.name}
                bg={cardBg}
                border="1px solid"
                borderColor={useColorModeValue('gray.100', 'gray.700')}
                backdropFilter="blur(20px)"
                shadow="xl"
                transition="all 0.3s ease"
                _hover={{ transform: 'scale(1.02)' }}
              >
                <CardBody p={8}>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Box>
                      <Heading size="lg" mb={4}>{integration.name}</Heading>
                      <Text fontSize="lg" color="gray.600" mb={4}>{integration.description}</Text>
                      <HStack spacing={4}>
                        <Badge
                          fontSize="md"
                          colorScheme={integration.isConnected ? 'green' : 'gray'}
                          rounded="full"
                          px={4}
                          py={2}
                        >
                          {integration.isConnected ? (
                            <HStack spacing={2}>
                              <CheckCircleIcon />
                              <Text>Connected</Text>
                            </HStack>
                          ) : (
                            <HStack spacing={2}>
                              <WarningIcon />
                              <Text>Not Connected</Text>
                            </HStack>
                          )}
                        </Badge>
                      </HStack>
                    </Box>
                    <VStack spacing={4} align="flex-end">
                      {integration.isConnected && tokenData[integration.name]?.access_token && (
                        <Box width="280px" mb={2}>
                          <Text fontSize="sm" fontWeight="bold" mb={1}>Access Token:</Text>
                          <InputGroup size="sm">
                            <Input 
                              value={showTokens[integration.name] 
                                ? tokenData[integration.name].access_token 
                                : tokenData[integration.name].access_token.replace(/./g, '*')}
                              isReadOnly
                              pr="4.5rem"
                              fontFamily="mono"
                            />
                            <InputRightElement width="4.5rem">
                              <HStack spacing={1}>
                                <IconButton
                                  h="1.5rem"
                                  size="sm"
                                  aria-label={showTokens[integration.name] ? "Hide token" : "Show token"}
                                  icon={showTokens[integration.name] ? <ViewOffIcon /> : <ViewIcon />}
                                  onClick={() => handleToggleToken(integration.name)}
                                />
                                <IconButton
                                  h="1.5rem"
                                  size="sm"
                                  aria-label="Copy token"
                                  icon={<CopyIcon />}
                                  onClick={() => handleCopyToken(tokenData[integration.name].access_token)}
                                />
                              </HStack>
                            </InputRightElement>
                          </InputGroup>
                        </Box>
                      )}
                      <Button
                        colorScheme={integration.isConnected ? 'red' : 'blue'}
                        size="lg"
                        fontSize="lg"
                        px={8}
                        py={6}
                        onClick={() => handleConnect(integration)}
                        rounded="full"
                        bgGradient={integration.isConnected 
                          ? 'linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%)'
                          : 'linear-gradient(135deg, #0077FF 0%, #00C6FF 100%)'}
                        _hover={{
                          transform: 'translateY(-2px)',
                          shadow: 'lg',
                        }}
                      >
                        {integration.isConnected ? 'Disconnect' : 'Connect'}
                      </Button>
                    </VStack>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </VStack>

          <Box textAlign="center" mt={16}>
            <Button
              size="lg"
              fontSize="xl"
              px={12}
              py={8}
              onClick={handleExportConfig}
              rounded="full"
              bgGradient="linear-gradient(135deg, #00C6FF 0%, #0077FF 100%)"
              color="white"
              _hover={{
                transform: 'translateY(-2px)',
                shadow: 'lg',
                bgGradient: 'linear-gradient(135deg, #00B4FF 0%, #0065FF 100%)',
              }}
              shadow="md"
            >
              Export MCP Config
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        position="relative"
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          opacity: 0.9,
          zIndex: 0,
        }}
      >
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <VStack spacing={8} textAlign="center">
            <Heading
              fontSize={{ base: '4xl', md: '7xl' }}
              fontWeight="bold"
              color="white"
              lineHeight="shorter"
              letterSpacing="tight"
              sx={{
                opacity: 0,
                animation: '1s ease-out forwards slideFadeIn',
                '@keyframes slideFadeIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(20px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              Secure OAuth
              <br />
              Integration Hub
            </Heading>
            <Text
              fontSize={{ base: 'xl', md: '2xl' }}
              color="gray.300"
              maxW="3xl"
              sx={{
                opacity: 0,
                animation: '1s ease-out 0.2s forwards slideFadeIn',
              }}
            >
              Enterprise-grade authentication management.
              <br />
              Designed for the modern web.
            </Text>
            <Button
              size="lg"
              fontSize="xl"
              px={12}
              py={8}
              bg="white"
              color="black"
              _hover={{ bg: 'gray.100' }}
              rounded="full"
              onClick={() => window.location.href = '#features'}
              sx={{
                opacity: 0,
                animation: '1s ease-out 0.4s forwards slideFadeIn',
              }}
            >
              Learn More
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={32} bg="black" position="relative" id="features">
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={16}>
            <Feature
              icon={FiLock}
              title="Secure Authentication"
              text="Enterprise-grade OAuth 2.0 implementation with industry-standard security"
              delay={0}
            />
            <Feature
              icon={FiRefreshCcw}
              title="MCP Compatible"
              text="Built on the Model Context Protocol for seamless integration"
              delay={0.2}
            />
            <Feature
              icon={FiShield}
              title="Token Management"
              text="Automatic token refresh and secure credential storage"
              delay={0.4}
            />
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  );
}
