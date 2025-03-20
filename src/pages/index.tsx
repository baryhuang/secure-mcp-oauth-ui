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
import { FiLock, FiRefreshCcw, FiShield } from 'react-icons/fi';
import NextLink from 'next/link';
import { authorizeSketchfab, authorizeGmail, API_BASE_URL } from '../lib/api';

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
    const handleOAuthCallback = async () => {
      console.log('Handling OAuth callback, checking URL parameters');
      // Check if URL has code parameter (OAuth callback)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      console.log('OAuth code from URL:', code);
      
      if (code) {
        try {
          // Determine which provider based on URL path or stored state
          let provider = 'sketchfab'; // Default provider
          let normalizedProvider = 'Sketchfab'; // For UI display and mapping
          
          // Check URL path for provider information
          const path = window.location.pathname;
          console.log('Current path:', path);
          
          if (path.includes('/oauth_callback/')) {
            if (path.includes('/oauth_callback/google')) {
              provider = 'google';
              normalizedProvider = 'Gmail';
            } else if (path.includes('/oauth_callback/sketchfab')) {
              provider = 'sketchfab';
              normalizedProvider = 'Sketchfab';
            }
          } 
          // Fallback to state parameter or localStorage
          else if (urlParams.get('state') === 'gmail' || localStorage.getItem('oauth_pending_provider') === 'gmail') {
            provider = 'google';
            normalizedProvider = 'Gmail';
          }
          
          console.log(`Identified provider: ${provider}, normalized: ${normalizedProvider}`);
          console.log(`Processing ${provider} OAuth callback with code:`, code);
          toast({
            title: 'Processing Authentication',
            description: `Completing ${normalizedProvider} authentication...`,
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
          
          // Call backend to exchange code for token
          const response = await fetch(`${API_BASE_URL}/api/oauth/callback/${provider}?code=${code}`);
          
          if (!response.ok) {
            console.error(`Error response from API: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            throw new Error(`Failed to exchange code for token for ${provider}`);
          }
          
          const tokenData = await response.json();
          console.log('Token data received from API:', tokenData);
          
          // Store token data
          if (tokenData.user_id) {
            const storageKey = `oauth_token_${provider}_${tokenData.user_id}`;
            console.log(`Storing token data in localStorage with key: ${storageKey}`);
            localStorage.setItem(
              storageKey,
              JSON.stringify(tokenData)
            );
            
            // Get user info
            const userResponse = await fetch(
              `${API_BASE_URL}/api/oauth/me/${provider}?user_id=${tokenData.user_id}`
            );
            
            console.log(`User info response status: ${userResponse.status}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              console.log('User data received:', userData);
              localStorage.setItem(
                `oauth_user_${provider}_${tokenData.user_id}`,
                JSON.stringify(userData)
              );
            } else {
              console.error('Failed to fetch user info');
              const errorText = await userResponse.text();
              console.error('User info error details:', errorText);
            }
            
            // Update integrations state
            console.log('Updating integrations state to reflect connection');
            setIntegrations(prev => {
              const updated = prev.map(int => ({
                ...int,
                isConnected: int.name === normalizedProvider ? true : int.isConnected
              }));
              console.log('Updated integrations:', updated);
              return updated;
            });
            
            // Store token data for display
            console.log('Updating tokenData state with received tokens');
            setTokenData(prev => {
              const updated = {
                ...prev,
                [normalizedProvider]: tokenData.token_info
              };
              console.log('Updated tokenData state:', updated);
              return updated;
            });
            
            toast({
              title: 'Authentication Successful',
              description: `Connected to ${normalizedProvider} successfully`,
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
            
            // Clean up URL and localStorage
            localStorage.removeItem('oauth_pending_provider');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
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
        }
      }
    };
    
    handleOAuthCallback();
  }, [toast]);

  useEffect(() => {
    // Check localStorage for tokens on initial load
    const checkStoredTokens = () => {
      console.log('Checking stored tokens in localStorage');
      const localStorageKeys = Object.keys(localStorage);
      console.log('Available localStorage keys:', localStorageKeys);
      
      // Check for each integration
      integrations.forEach(integration => {
        // Get possible provider names for this integration
        let possibleProviderNames: string[] = [];
        
        if (integration.name === 'Gmail') {
          possibleProviderNames = ['google', 'gmail'];
        } else if (integration.name === 'Sketchfab') {
          possibleProviderNames = ['sketchfab'];
        } else {
          possibleProviderNames = [integration.name.toLowerCase()];
        }
        
        console.log(`Checking for ${integration.name} token with possible provider names:`, possibleProviderNames);
        
        // Try different possible key patterns for all possible provider names
        let tokenKey = null;
        let foundProviderName = null;
        
        for (const providerName of possibleProviderNames) {
          const pattern = `oauth_token_${providerName}_`;
          const foundKey = localStorageKeys.find(key => key.startsWith(pattern));
          if (foundKey) {
            tokenKey = foundKey;
            foundProviderName = providerName;
            console.log(`Found token key with pattern ${pattern}:`, tokenKey);
            break;
          }
        }
        
        console.log(`Final token key found for ${integration.name}:`, tokenKey);
        
        if (tokenKey) {
          try {
            const rawTokenData = localStorage.getItem(tokenKey);
            console.log(`Raw token data for ${integration.name} (${foundProviderName}):`, rawTokenData);
            const tokenData = JSON.parse(localStorage.getItem(tokenKey) || '{}');
            console.log(`Parsed token data for ${integration.name}:`, tokenData);
            
            // Look for token in different possible locations in the structure
            const accessToken = 
              tokenData.token_info?.access_token || 
              tokenData.access_token || 
              tokenData.token;
            
            if (accessToken) {
              console.log(`Valid access token found for ${integration.name}`);
              setIntegrations(prev => 
                prev.map(int => ({
                  ...int,
                  isConnected: int.name === integration.name ? true : int.isConnected
                }))
              );
              
              // Normalize the token data structure
              const normalizedTokenInfo = {
                access_token: accessToken,
                refresh_token: tokenData.token_info?.refresh_token || tokenData.refresh_token || null,
                expires_in: tokenData.token_info?.expires_in || tokenData.expires_in || null,
                token_type: tokenData.token_info?.token_type || tokenData.token_type || 'Bearer'
              };
              
              // Store token data for display - use UI integration name
              setTokenData(prev => ({
                ...prev,
                [integration.name]: normalizedTokenInfo
              }));
              console.log(`Updated tokenData state for ${integration.name}:`, normalizedTokenInfo);
            } else {
              console.log(`No valid access token for ${integration.name} in token data:`, tokenData);
            }
          } catch (error) {
            console.error(`Error parsing ${integration.name} token from localStorage:`, error);
          }
        } else {
          console.log(`No token found for ${integration.name}`);
        }
      });
    };
    
    checkStoredTokens();
  }, [integrations]);

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
    console.log(`handleConnect called for ${integration.name}, current status: ${integration.isConnected}`);
    
    // Get the correct API provider name based on UI integration name
    let apiProviderName: string;
    if (integration.name === 'Gmail') {
      apiProviderName = 'google';
    } else if (integration.name === 'Sketchfab') {
      apiProviderName = 'sketchfab';
    } else {
      apiProviderName = integration.name.toLowerCase();
    }
    
    console.log(`Using API provider name: ${apiProviderName} for UI integration: ${integration.name}`);
    
    if (integration.name === 'Sketchfab') {
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
          
          // Directly call the Sketchfab authorization function
          authorizeSketchfab();
          
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
        console.log('Removing Sketchfab tokens:', sketchfabTokenKeys);
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
    } else if (integration.name === 'Gmail') {
      if (!integration.isConnected) {
        // Initiate Gmail OAuth flow
        try {
          toast({
            title: 'Connecting to Gmail',
            description: 'Initializing authentication...',
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
    }
  };

  const handleExportConfig = () => {
    const mcpConfig = {
      version: '1.0',
      integrations: integrations.map(int => ({
        name: int.name,
        status: int.isConnected ? 'connected' : 'disconnected',
        scope: int.scope,
        accessToken: int.isConnected && tokenData[int.name]?.access_token 
          ? tokenData[int.name].access_token 
          : null,
        refreshToken: int.isConnected && tokenData[int.name]?.refresh_token
          ? tokenData[int.name].refresh_token
          : null
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
                height={{ base: "370px", md: "370px" }}
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
