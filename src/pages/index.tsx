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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Code,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, ViewIcon, ViewOffIcon, CopyIcon } from '@chakra-ui/icons';
import { FiLock, FiRefreshCcw, FiShield } from 'react-icons/fi';
import NextLink from 'next/link';
import { authorizeGmail, authorizeTwitter, authorizeZoom, API_BASE_URL } from '../lib/api';

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
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      name: 'Gmail',
      isConnected: false,
      description: 'Connect to access and send Gmail messages',
      scope: 'readonly,send',
    },
    {
      name: 'Twitter',
      isConnected: false,
      description: 'Connect to access your Twitter account',
      scope: 'tweet.read users.read',
    },
    {
      name: 'Zoom',
      isConnected: false,
      description: 'Connect to access your Zoom account information',
      scope: 'user:read',
    },
  ]);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [tokenData, setTokenData] = useState<Record<string, any>>({});
  const initializeRef = useRef(false);
  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)');
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Handle OAuth callback with code parameter
  useEffect(() => {
    const handleOAuthCallback = async () => {
      console.log('Handling OAuth callback, checking URL parameters');
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          // Determine which provider based on URL path or stored state
          let provider = 'google'; // Default provider
          let normalizedProvider = 'Gmail'; // For UI display and mapping
          
          // Check URL path for provider information
          const path = window.location.pathname;
          
          if (path.includes('/oauth_callback/')) {
            if (path.includes('/oauth_callback/google')) {
              provider = 'google';
              normalizedProvider = 'Gmail';
            } else if (path.includes('/oauth_callback/twitter')) {
              provider = 'twitter';
              normalizedProvider = 'Twitter';
            } else if (path.includes('/oauth_callback/zoom')) {
              provider = 'zoom';
              normalizedProvider = 'Zoom';
            }
          }
          // Fallback to state parameter or localStorage
          else if (urlParams.get('state') === 'gmail' || localStorage.getItem('oauth_pending_provider') === 'gmail') {
            provider = 'google';
            normalizedProvider = 'Gmail';
          } else if (urlParams.get('state') === 'twitter' || localStorage.getItem('oauth_pending_provider') === 'twitter') {
            provider = 'twitter';
            normalizedProvider = 'Twitter';
          } else if (urlParams.get('state') === 'zoom' || localStorage.getItem('oauth_pending_provider') === 'zoom') {
            provider = 'zoom';
            normalizedProvider = 'Zoom';
          }
          
          // For Twitter, include the code_verifier in the request
          let apiUrl = `${API_BASE_URL}/api/oauth/callback/${provider}?code=${code}`;
          if (provider === 'twitter') {
            const codeVerifier = localStorage.getItem('twitter_code_verifier');
            if (codeVerifier) {
              apiUrl += `&code_verifier=${codeVerifier}`;
            }
          }
          
          // Call backend to exchange code for token
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`Failed to exchange code for token for ${provider}`);
          }
          
          const data = await response.json();
          console.log('OAuth callback response:', data);

          // Handle the new response format (with success, user_info, token_info)
          if (data.success && data.user_info && data.token_info) {
            const userId = data.user_info.id;
            
            // Store token info with appropriate key based on provider
            localStorage.setItem(
              `oauth_token_${provider.toLowerCase()}_${userId}`,
              JSON.stringify(data.token_info)
            );
            
            // Store user info
            localStorage.setItem(
              `oauth_user_${provider.toLowerCase()}_${userId}`,
              JSON.stringify(data.user_info)
            );
            
            // Update integrations state
            await new Promise<void>(resolve => {
              setIntegrations(prev => {
                const updated = prev.map(int => ({
                  ...int,
                  isConnected: int.name === normalizedProvider ? true : int.isConnected
                }));
                resolve();
                return updated;
              });
            });
            
            // Store token data for display
            await new Promise<void>(resolve => {
              setTokenData(prev => {
                const updated = {
                  ...prev,
                  [normalizedProvider]: data.token_info
                };
                resolve();
                return updated;
              });
            });
          } 
          // Legacy format with direct token information
          else if (data.access_token) {
            // For legacy format, we don't have a user ID, so use a default
            const userId = data.user_id || 'default';
            
            // Store token info
            localStorage.setItem(
              `oauth_token_${provider.toLowerCase()}_${userId}`,
              JSON.stringify(data)
            );
            
            // Update integrations state
            await new Promise<void>(resolve => {
              setIntegrations(prev => {
                const updated = prev.map(int => ({
                  ...int,
                  isConnected: int.name === normalizedProvider ? true : int.isConnected
                }));
                resolve();
                return updated;
              });
            });
            
            // Store token data for display
            await new Promise<void>(resolve => {
              setTokenData(prev => {
                const updated = {
                  ...prev,
                  [normalizedProvider]: data
                };
                resolve();
                return updated;
              });
            });
          } else {
            throw new Error('Invalid response format from server');
          }

          // Clean up code verifier
          localStorage.removeItem('twitter_code_verifier');
          
          toast({
            title: 'Authentication Successful',
            description: `Connected to ${normalizedProvider} successfully`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          // Clean up URL and localStorage after successful data saving
          localStorage.removeItem('oauth_pending_provider');
          window.location.href = '/'; // Use window.location.href for a full page redirect
        } catch (error) {
          console.error('Error processing OAuth callback:', error);
          toast({
            title: 'Authentication Error',
            description: 'Failed to complete authentication',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          localStorage.removeItem('oauth_pending_provider');
          localStorage.removeItem('twitter_code_verifier');
          window.location.href = '/'; // Redirect on error as well
        }
      }
    };
    
    handleOAuthCallback();
  }, [toast]);

  useEffect(() => {
    // Only run once on mount
    if (initializeRef.current) return;
    initializeRef.current = true;

    // Check localStorage for tokens on initial load
    const checkStoredTokens = () => {
      const localStorageKeys = Object.keys(localStorage);
      
      // Create a copy of integrations to track changes
      const updatedIntegrations = [...integrations];
      const updatedTokenData: Record<string, any> = {};
      let hasChanges = false;
      
      // Check for each integration
      integrations.forEach((integration, index) => {
        // Get possible provider names for this integration
        let possibleProviderNames: string[] = [];
        
        if (integration.name === 'Gmail') {
          possibleProviderNames = ['google', 'gmail'];
        } else {
          possibleProviderNames = [integration.name.toLowerCase()];
        }
        
        // Try different possible key patterns for all possible provider names
        let tokenKey = null;
        let tokenData = null;
        
        for (const providerName of possibleProviderNames) {
          // For Gmail/Google, check the simple format first
          if (integration.name === 'Gmail') {
            const simpleKey = `oauth_token_${providerName}`;
            if (localStorageKeys.includes(simpleKey)) {
              tokenKey = simpleKey;
              break;
            }
          }
          
          // For Twitter, check for user-specific format
          if (integration.name === 'Twitter') {
            const userSpecificKeys = localStorageKeys.filter(key => 
              key.startsWith(`oauth_token_${providerName}_`) && 
              key !== 'twitter_code_verifier'
            );
            if (userSpecificKeys.length > 0) {
              tokenKey = userSpecificKeys[0]; // Use the first user's token if multiple exist
              break;
            }
          }
          
          // For other providers or as fallback
          const pattern = `oauth_token_${providerName}_`;
          const foundKey = localStorageKeys.find(key => key.startsWith(pattern));
          if (foundKey) {
            tokenKey = foundKey;
            break;
          }
        }
        
        if (tokenKey) {
          try {
            const rawTokenData = localStorage.getItem(tokenKey);
            tokenData = JSON.parse(rawTokenData || '{}');
            
            // Look for token in different possible locations in the structure
            const accessToken = 
              tokenData.token_info?.access_token || 
              tokenData.access_token || 
              tokenData.token;
            
            if (accessToken) {
              // Update integration status
              if (!updatedIntegrations[index].isConnected) {
                updatedIntegrations[index].isConnected = true;
                hasChanges = true;
              }
              
              // Normalize the token data structure
              const normalizedTokenInfo = {
                access_token: accessToken,
                refresh_token: tokenData.token_info?.refresh_token || tokenData.refresh_token || null,
                expires_in: tokenData.token_info?.expires_in || tokenData.expires_in || null,
                token_type: tokenData.token_info?.token_type || tokenData.token_type || 'Bearer'
              };
              
              // Store token data for display
              updatedTokenData[integration.name] = normalizedTokenInfo;
            }
          } catch (error) {
            console.error(`Error parsing ${integration.name} token from localStorage:`, error);
          }
        }
      });
      
      // Only update state if there were changes
      if (hasChanges) {
        setIntegrations(updatedIntegrations);
      }
      if (Object.keys(updatedTokenData).length > 0) {
        setTokenData(prev => ({...prev, ...updatedTokenData}));
      }
    };
    
    checkStoredTokens();
  }, []); // Empty dependency array since we use ref to ensure single execution

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
    let apiProviderName: string;
    if (integration.name === 'Gmail') {
      apiProviderName = 'google';
    } else if (integration.name === 'Twitter') {
      apiProviderName = 'twitter';
    } else if (integration.name === 'Zoom') {
      apiProviderName = 'zoom';
    } else {
      apiProviderName = integration.name.toLowerCase();
    }
    
    console.log(`Using API provider name: ${apiProviderName} for UI integration: ${integration.name}`);
    
    if (integration.name === 'Gmail') {
      if (!integration.isConnected) {
        // Initiate Gmail OAuth flow
        try {
          toast({
            title: 'Connecting to Gmail',
            description: 'Redirecting to Google authorization page...',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
          
          // Store provider name for callback handling
          localStorage.setItem('oauth_pending_provider', 'gmail');
          
          // Call Gmail authorization function
          authorizeGmail();
          
        } catch (error) {
          console.error('Error initiating Gmail auth:', error);
          toast({
            title: 'Connection Failed',
            description: 'Failed to connect to Gmail',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          localStorage.removeItem('oauth_pending_provider');
        }
      } else {
        // Disconnect Gmail - look for all possible key patterns
        const localStorageKeys = Object.keys(localStorage);
        const gmailTokenKeys = localStorageKeys.filter(key => 
          key.startsWith('oauth_token_google_') || 
          key.startsWith('oauth_user_google_') ||
          key.startsWith('oauth_token_gmail_') || 
          key.startsWith('oauth_user_gmail_')
        );
        
        // Remove all Gmail tokens from localStorage
        console.log('Removing Gmail tokens:', gmailTokenKeys);
        gmailTokenKeys.forEach(key => localStorage.removeItem(key));
        
        // Update state
        setIntegrations(prev => 
          prev.map(int => ({
            ...int,
            isConnected: int.name === 'Gmail' ? false : int.isConnected
          }))
        );
        
        // Remove from tokenData
        setTokenData(prev => {
          const newTokenData = { ...prev };
          delete newTokenData['Gmail'];
          return newTokenData;
        });
        
        toast({
          title: 'Disconnected',
          description: 'Successfully disconnected from Gmail',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } else if (integration.name === 'Twitter') {
      if (!integration.isConnected) {
        authorizeTwitter();
        toast({
          title: 'Connecting to Twitter',
          description: 'Redirecting to Twitter authorization page...',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Disconnect Twitter
        const localStorageKeys = Object.keys(localStorage);
        const twitterTokenKeys = localStorageKeys.filter(key => 
          key.startsWith('oauth_token_twitter_') || 
          key.startsWith('oauth_user_twitter_') || 
          key === 'twitter_code_verifier'
        );
        
        // Remove all Twitter tokens from localStorage
        console.log('Removing Twitter tokens:', twitterTokenKeys);
        twitterTokenKeys.forEach(key => localStorage.removeItem(key));
        
        // Update state
        setIntegrations(prev => 
          prev.map(int => ({
            ...int,
            isConnected: int.name === 'Twitter' ? false : int.isConnected
          }))
        );
        
        // Remove from tokenData
        setTokenData(prev => {
          const newTokenData = { ...prev };
          delete newTokenData['Twitter'];
          return newTokenData;
        });
        
        toast({
          title: 'Disconnected',
          description: 'Successfully disconnected from Twitter',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } else if (integration.name === 'Zoom') {
      if (!integration.isConnected) {
        // Initiate Zoom OAuth flow
        try {
          toast({
            title: 'Connecting to Zoom',
            description: 'Redirecting to Zoom authorization page...',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
          
          // Call Zoom authorization function
          authorizeZoom();
          
        } catch (error) {
          console.error('Error initiating Zoom auth:', error);
          toast({
            title: 'Connection Failed',
            description: 'Failed to connect to Zoom',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          localStorage.removeItem('oauth_pending_provider');
        }
      } else {
        // Disconnect Zoom
        const localStorageKeys = Object.keys(localStorage);
        const zoomTokenKeys = localStorageKeys.filter(key => 
          key.startsWith('oauth_token_zoom_') || 
          key.startsWith('oauth_user_zoom_')
        );
        
        // Remove all Zoom tokens from localStorage
        console.log('Removing Zoom tokens:', zoomTokenKeys);
        zoomTokenKeys.forEach(key => localStorage.removeItem(key));
        
        // Update state
        setIntegrations(prev => 
          prev.map(int => ({
            ...int,
            isConnected: int.name === 'Zoom' ? false : int.isConnected
          }))
        );
        
        // Remove from tokenData
        setTokenData(prev => {
          const newTokenData = { ...prev };
          delete newTokenData['Zoom'];
          return newTokenData;
        });
        
        toast({
          title: 'Disconnected',
          description: 'Successfully disconnected from Zoom',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleShowAllValues = () => {
    // Generate env variables for display
    let envText = '';
    
    integrations.forEach(integration => {
      if (integration.isConnected && tokenData[integration.name]) {
        const providerKey = integration.name.toUpperCase();
        
        if (tokenData[integration.name].access_token) {
          envText += `${providerKey}_ACCESS_TOKEN=${tokenData[integration.name].access_token}\n`;
        }
        
        if (tokenData[integration.name].refresh_token) {
          envText += `${providerKey}_REFRESH_TOKEN=${tokenData[integration.name].refresh_token}\n`;
        }
        
        if (tokenData[integration.name].expires_in) {
          envText += `${providerKey}_TOKEN_EXPIRES_IN=${tokenData[integration.name].expires_in}\n`;
        }
        
        if (tokenData[integration.name].token_type) {
          envText += `${providerKey}_TOKEN_TYPE=${tokenData[integration.name].token_type}\n`;
        }
      }
    });
    
    // If no tokens found
    if (!envText) {
      envText = "No connected integrations found.";
    }
    
    // Open modal with environment variables
    onOpen();
  };

  return (
    <Box bg={bgColor} minH="100vh" overflow="hidden">
      {/* Modal for showing all values */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader>Environment Variables</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Code
              p={4}
              borderRadius="md"
              w="100%"
              bg="gray.800"
              color="white"
              fontSize="sm"
              fontFamily="monospace"
              whiteSpace="pre"
              overflowX="auto"
            >
              {integrations.map(integration => {
                if (integration.isConnected && tokenData[integration.name]) {
                  const providerKey = integration.name.toUpperCase();
                  return (
                    <Box key={integration.name}>
                      {tokenData[integration.name].access_token && (
                        <Text>{`${providerKey}_ACCESS_TOKEN=${tokenData[integration.name].access_token}`}</Text>
                      )}
                      {tokenData[integration.name].refresh_token && (
                        <Text>{`${providerKey}_REFRESH_TOKEN=${tokenData[integration.name].refresh_token}`}</Text>
                      )}
                      {tokenData[integration.name].expires_in && (
                        <Text>{`${providerKey}_TOKEN_EXPIRES_IN=${tokenData[integration.name].expires_in}`}</Text>
                      )}
                      {tokenData[integration.name].token_type && (
                        <Text>{`${providerKey}_TOKEN_TYPE=${tokenData[integration.name].token_type}`}</Text>
                      )}
                      <Text mt={2}></Text>
                    </Box>
                  );
                }
                return null;
              })}
              {!integrations.some(int => int.isConnected && tokenData[int.name]) && (
                <Text>No connected integrations found.</Text>
              )}
            </Code>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                const envText = integrations.reduce((acc, integration) => {
                  if (integration.isConnected && tokenData[integration.name]) {
                    const providerKey = integration.name.toUpperCase();
                    let text = acc;
                    
                    if (tokenData[integration.name].access_token) {
                      text += `${providerKey}_ACCESS_TOKEN=${tokenData[integration.name].access_token}\n`;
                    }
                    if (tokenData[integration.name].refresh_token) {
                      text += `${providerKey}_REFRESH_TOKEN=${tokenData[integration.name].refresh_token}\n`;
                    }
                    if (tokenData[integration.name].expires_in) {
                      text += `${providerKey}_TOKEN_EXPIRES_IN=${tokenData[integration.name].expires_in}\n`;
                    }
                    if (tokenData[integration.name].token_type) {
                      text += `${providerKey}_TOKEN_TYPE=${tokenData[integration.name].token_type}\n`;
                    }
                    
                    return text;
                  }
                  return acc;
                }, '');
                
                navigator.clipboard.writeText(envText || "No connected integrations found.");
                toast({
                  title: 'Copied to Clipboard',
                  description: 'Environment variables have been copied to clipboard',
                  status: 'success',
                  duration: 3000,
                  isClosable: true,
                });
              }}
            >
              Copy to Clipboard
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
          <Flex justify="center" wrap="wrap" gap={8}>
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
                width={{ base: "100%", md: "350px" }}
                height={{ base: "450px", md: "450px" }}
                mx="auto"
              >
                <CardBody p={0} overflow="hidden">
                  <VStack h="100%" spacing={0}>
                    {/* Header Area */}
                    <Box 
                      w="100%" 
                      bgGradient={integration.isConnected 
                        ? 'linear-gradient(135deg, #0077FF 0%, #00C6FF 100%)'
                        : 'linear-gradient(135deg, #4A5568 0%, #2D3748 100%)'}
                      p={5}
                      color="white"
                    >
                      <Flex justify="space-between" align="center">
                        <Heading size="md">{integration.name}</Heading>
                        <Badge
                          fontSize="xs"
                          colorScheme={integration.isConnected ? 'green' : 'gray'}
                          bg={integration.isConnected ? 'green.100' : 'gray.100'}
                          color={integration.isConnected ? 'green.800' : 'gray.800'}
                          rounded="full"
                          px={3}
                          py={1}
                        >
                          {integration.isConnected ? (
                            <HStack spacing={1}>
                              <CheckCircleIcon boxSize="0.8em" />
                              <Text>Connected</Text>
                            </HStack>
                          ) : (
                            <HStack spacing={1}>
                              <WarningIcon boxSize="0.8em" />
                              <Text>Not Connected</Text>
                            </HStack>
                          )}
                        </Badge>
                      </Flex>
                      <Text fontSize="sm" mt={1} opacity={0.9}>{integration.description}</Text>
                      <Text fontSize="xs" mt={2} opacity={0.7}>Scope: {integration.scope}</Text>
                    </Box>
                    
                    {/* Content Area */}
                    <Box 
                      w="100%" 
                      p={5} 
                      flex="1"
                      bg={useColorModeValue('white', 'gray.700')}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="200px"
                    >
                      {integration.isConnected && tokenData[integration.name]?.access_token ? (
                        <VStack spacing={2} align="stretch" w="100%">
                          <Box width="100%">
                            <Flex justify="space-between" align="center" mb={1}>
                              <Text fontSize="xs" fontWeight="medium">Access Token:</Text>
                              <HStack spacing={1}>
                                <IconButton
                                  h="1.2rem"
                                  size="xs"
                                  aria-label={showTokens[integration.name] ? "Hide token" : "Show token"}
                                  icon={showTokens[integration.name] ? <ViewOffIcon /> : <ViewIcon />}
                                  onClick={() => handleToggleToken(integration.name)}
                                />
                                <IconButton
                                  h="1.2rem"
                                  size="xs"
                                  aria-label="Copy token"
                                  icon={<CopyIcon />}
                                  onClick={() => handleCopyToken(tokenData[integration.name].access_token)}
                                />
                              </HStack>
                            </Flex>
                            
                            <Text 
                              fontSize="xs" 
                              fontFamily="mono" 
                              p={2} 
                              bg={useColorModeValue("gray.50", "gray.800")} 
                              borderRadius="md"
                              wordBreak="break-all"
                              mb={2}
                              maxH="40px"
                              overflow="hidden"
                              textOverflow="ellipsis"
                            >
                              {showTokens[integration.name] 
                                ? `${tokenData[integration.name].access_token.substring(0, 40)}...` 
                                : `${tokenData[integration.name].access_token.substring(0, 10).replace(/./g, '*')}...`}
                            </Text>
                            
                            {tokenData[integration.name].expires_in && (
                              <Text fontSize="2xs" color="gray.500">
                                Expires in: {tokenData[integration.name].expires_in} seconds
                              </Text>
                            )}
                            
                            {tokenData[integration.name].refresh_token && (
                              <>
                                <Flex justify="space-between" align="center" mt={2} mb={1}>
                                  <Text fontSize="xs" fontWeight="medium">Refresh Token:</Text>
                                  <IconButton
                                    h="1.2rem"
                                    size="xs"
                                    aria-label="Copy token"
                                    icon={<CopyIcon />}
                                    onClick={() => handleCopyToken(tokenData[integration.name].refresh_token)}
                                  />
                                </Flex>
                                <Text 
                                  fontSize="xs" 
                                  fontFamily="mono" 
                                  p={2} 
                                  bg={useColorModeValue("gray.50", "gray.800")} 
                                  borderRadius="md"
                                  wordBreak="break-all"
                                  maxH="40px"
                                  overflow="hidden"
                                  textOverflow="ellipsis"
                                >
                                  {showTokens[integration.name] 
                                    ? `${tokenData[integration.name].refresh_token.substring(0, 40)}...` 
                                    : `${tokenData[integration.name].refresh_token.substring(0, 10).replace(/./g, '*')}...`}
                                </Text>
                              </>
                            )}
                            
                            <Text fontSize="2xs" color="gray.500" mt={1}>
                              Type: {tokenData[integration.name].token_type || 'Bearer'}
                            </Text>
                          </Box>
                          {integration.name === 'Twitter' && (
                            <Box mt={3} pt={2} borderTop="1px" borderColor={useColorModeValue('gray.100', 'gray.600')}>
                              {(() => {
                                // Get Twitter user info from localStorage
                                const localStorageKeys = Object.keys(localStorage);
                                const userInfoKey = localStorageKeys.find(key => 
                                  key.startsWith('oauth_user_twitter_')
                                );
                                
                                if (userInfoKey) {
                                  try {
                                    const userInfo = JSON.parse(localStorage.getItem(userInfoKey) || '{}');
                                    return (
                                      <VStack align="start" spacing={1}>
                                        <Text fontSize="xs" fontWeight="medium">Twitter Account:</Text>
                                        <HStack spacing={2} width="100%">
                                          {userInfo.avatar_url && (
                                            <Box overflow="hidden" borderRadius="full" width="24px" height="24px">
                                              <img 
                                                src={userInfo.avatar_url} 
                                                alt={userInfo.username || 'User'} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                              />
                                            </Box>
                                          )}
                                          <Box>
                                            <Text fontSize="xs" fontWeight="medium">@{userInfo.username || 'Unknown'}</Text>
                                            {userInfo.profile_url && (
                                              <Text fontSize="2xs" color="blue.400">
                                                <a href={userInfo.profile_url} target="_blank" rel="noopener noreferrer">
                                                  View Profile
                                                </a>
                                              </Text>
                                            )}
                                          </Box>
                                        </HStack>
                                      </VStack>
                                    );
                                  } catch (e) {
                                    return null;
                                  }
                                }
                                return null;
                              })()}
                            </Box>
                          )}
                        </VStack>
                      ) : (
                        <VStack spacing={4} h="100%" justify="center" align="center">
                          <Icon 
                            as={integration.name === 'Gmail' ? ViewIcon : FiShield} 
                            boxSize={12} 
                            color="gray.300" 
                          />
                          <Text color="gray.500" textAlign="center">
                            Connect to view your authentication tokens
                          </Text>
                        </VStack>
                      )}
                    </Box>
                    
                    {/* Button Area */}
                    <Box 
                      w="100%" 
                      p={4} 
                      borderTop="1px" 
                      borderColor={useColorModeValue('gray.100', 'gray.700')}
                      bg={useColorModeValue('gray.50', 'gray.800')}
                      display="flex"
                      justifyContent="center"
                    >
                      <Button
                        colorScheme={integration.isConnected ? 'red' : 'blue'}
                        size="md"
                        fontSize="sm"
                        px={6}
                        py={4}
                        width="200px"
                        mx="auto"
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
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Flex>

          <Box textAlign="center" mt={16}>
            <Button
              size="md"
              fontSize="md"
              px={8}
              py={5}
              onClick={handleShowAllValues}
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
              Show All Values
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
