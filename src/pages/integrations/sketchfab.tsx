import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Divider,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  Code,
  IconButton,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import SketchfabOAuthProvider, { useSketchfabAuth } from '../../components/SketchfabOAuthProvider';

// Wrap the main content with the provider
const SketchfabIntegration = () => {
  return (
    <SketchfabOAuthProvider>
      <SketchfabIntegrationContent />
    </SketchfabOAuthProvider>
  );
};

// Use the provider's context in the content component
const SketchfabIntegrationContent = () => {
  const router = useRouter();
  const toast = useToast();
  const [directAuthResponse, setDirectAuthResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showToken, setShowToken] = useState(false);
  const { 
    isAuthenticated, 
    isLoading, 
    userInfo, 
    tokenInfo,
    login, 
    logout, 
    refreshToken 
  } = useSketchfabAuth();
  
  // Check for direct auth response
  useEffect(() => {
    // Check for saved direct auth response in localStorage
    const savedResponse = localStorage.getItem('sketchfab_direct_auth_response');
    if (savedResponse) {
      try {
        setDirectAuthResponse(JSON.parse(savedResponse));
        // Switch to the Direct Auth Response tab if we have a response
        setActiveTab(1);
      } catch (error) {
        console.error('Error parsing saved auth response:', error);
      }
    }
    
    // Handle OAuth code in URL
    if (router.isReady) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        // Fetch OAuth response from server
        fetch(`http://localhost:8000/api/oauth/callback/sketchfab?code=${code}`)
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to exchange code for token');
            }
            return response.json();
          })
          .then(data => {
            // Save the actual response to localStorage
            localStorage.setItem('sketchfab_direct_auth_response', JSON.stringify(data));
            setDirectAuthResponse(data);
            
            // Switch to the Direct Auth Response tab
            setActiveTab(1);
            
            toast({
              title: 'Authentication Successful',
              description: 'Successfully authenticated with Sketchfab',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
            
            // Clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch(error => {
            console.error('Error processing OAuth code:', error);
            toast({
              title: 'Authentication Error',
              description: 'Failed to process authentication code',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          });
      }
    }
  }, [router.isReady, toast, router]);
  
  // Check for successful authentication from callback
  useEffect(() => {
    if (router.isReady) {
      const { auth_success, provider } = router.query;
      
      if (auth_success === 'true' && provider === 'sketchfab') {
        toast({
          title: 'Authentication Successful',
          description: 'You have successfully connected to Sketchfab',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Clear query parameters
        router.replace('/integrations/sketchfab', undefined, { shallow: true });
      }
    }
  }, [router.isReady, router.query, toast, router]);

  // Check if connected based on localStorage
  const isConnected = Boolean(directAuthResponse?.token_info?.access_token);
  
  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>
            Sketchfab Integration
          </Heading>
          <Text color="gray.600">
            Connect your Sketchfab account to access 3D models and resources
          </Text>
        </Box>
        
        <Tabs 
          variant="enclosed" 
          colorScheme="blue" 
          index={activeTab} 
          onChange={(index) => setActiveTab(index)}
        >
          <TabList>
            <Tab>Connection</Tab>
            <Tab>OAuth Response</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading as="h2" size="md" mb={2}>
                    Connection Status
                  </Heading>
                  <Divider mb={4} />
                  
                  {isLoading ? (
                    <Box textAlign="center" py={6}>
                      <Spinner size="xl" mb={4} />
                      <Text>Loading authentication status...</Text>
                    </Box>
                  ) : !isConnected ? (
                    <Box textAlign="center" py={6}>
                      <Text mb={4}>
                        Connect your Sketchfab account to access your 3D models and resources.
                      </Text>
                      <Button 
                        colorScheme="blue" 
                        onClick={() => {
                          window.location.href = '/api/sketchfab-auth';
                        }}
                      >
                        Connect to Sketchfab
                      </Button>
                    </Box>
                  ) : null}
                  
                  {isConnected && (
                    <Box
                      borderWidth="1px"
                      borderRadius="lg"
                      p={4}
                      boxShadow="md"
                      bg="white"
                      width="100%"
                    >
                      <VStack spacing={4} align="stretch">
                        <Box>
                          <Heading size="md">Connected to Sketchfab</Heading>
                          <Text color="gray.600">
                            User ID: {directAuthResponse?.user_id || "Unknown"}
                          </Text>
                        </Box>
                        
                        {directAuthResponse?.token_info && (
                          <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            Token expires in: {directAuthResponse.token_info.expires_in ? `${directAuthResponse.token_info.expires_in} seconds` : 'Unknown'}
                          </Alert>
                        )}
                        
                        <Box>
                          <Button
                            variant="outline"
                            colorScheme="red"
                            onClick={() => {
                              localStorage.removeItem('sketchfab_direct_auth_response');
                              setDirectAuthResponse(null);
                              toast({
                                title: 'Disconnected',
                                description: 'You have been disconnected from Sketchfab',
                                status: 'info',
                                duration: 3000,
                                isClosable: true,
                              });
                            }}
                          >
                            Disconnect
                          </Button>
                        </Box>
                      </VStack>
                    </Box>
                  )}
                </Box>
                
                {isConnected && (
                  <Box>
                    <Heading as="h2" size="md" mb={2}>
                      Account Information
                    </Heading>
                    <Divider mb={4} />
                    <Text>
                      Your Sketchfab account is now connected. You can use the API to access your models
                      and resources.
                    </Text>
                  </Box>
                )}
              </VStack>
            </TabPanel>
            
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading as="h2" size="md" mb={2}>
                    OAuth Response
                  </Heading>
                  <Divider mb={4} />
                  
                  {directAuthResponse ? (
                    <Box>
                      <Alert status="success" mb={4}>
                        <AlertIcon />
                        {directAuthResponse.message}
                      </Alert>
                      
                      <Box 
                        p={4} 
                        bg="gray.50" 
                        borderRadius="md" 
                        borderWidth="1px" 
                        mb={4}
                        overflowX="auto"
                      >
                        <Heading size="sm" mb={2}>Response Data:</Heading>
                        <Code display="block" whiteSpace="pre" p={2}>
                          {JSON.stringify(directAuthResponse, null, 2)}
                        </Code>
                      </Box>
                      
                      {directAuthResponse.token_info && (
                        <Box 
                          p={4} 
                          bg="blue.50" 
                          borderRadius="md" 
                          borderWidth="1px" 
                          mb={4}
                        >
                          <Heading size="sm" mb={2} display="flex" alignItems="center">
                            Access Token:
                            <IconButton
                              aria-label={showToken ? "Hide token" : "Show token"}
                              icon={showToken ? <ViewOffIcon /> : <ViewIcon />}
                              size="sm"
                              ml={2}
                              onClick={() => setShowToken(!showToken)}
                            />
                          </Heading>
                          
                          <Text fontWeight="bold" wordBreak="break-all">
                            {showToken 
                              ? directAuthResponse.token_info.access_token 
                              : directAuthResponse.token_info.access_token.replace(/./g, '*')}
                          </Text>
                          
                          <Text mt={2}>
                            <strong>Type:</strong> {directAuthResponse.token_info.token_type}
                          </Text>
                          <Text>
                            <strong>Expires In:</strong> {directAuthResponse.token_info.expires_in} seconds
                          </Text>
                          <Text>
                            <strong>Scope:</strong> {directAuthResponse.token_info.scope}
                          </Text>
                        </Box>
                      )}
                      
                      <Box
                        mt={4}
                        display="flex"
                        gap={4}
                      >
                        <Button
                          colorScheme="red"
                          variant="outline"
                          onClick={() => {
                            localStorage.removeItem('sketchfab_direct_auth_response');
                            setDirectAuthResponse(null);
                            setActiveTab(0);
                            toast({
                              title: 'Disconnected',
                              description: 'You have been disconnected from Sketchfab',
                              status: 'info',
                              duration: 3000,
                              isClosable: true,
                            });
                          }}
                        >
                          Disconnect
                        </Button>
                        
                        <Button
                          colorScheme="green"
                          onClick={() => {
                            // Use the token for Sketchfab API calls
                            toast({
                              title: 'Using Token',
                              description: 'The token would be used for API calls',
                              status: 'info',
                              duration: 3000,
                              isClosable: true,
                            });
                          }}
                        >
                          Use This Token
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={6}>
                      <Text mb={4}>
                        No OAuth response available. Please connect to Sketchfab first.
                      </Text>
                      <Button 
                        colorScheme="blue" 
                        onClick={() => {
                          window.location.href = '/api/sketchfab-auth';
                        }}
                      >
                        Connect to Sketchfab
                      </Button>
                    </Box>
                  )}
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default SketchfabIntegration; 