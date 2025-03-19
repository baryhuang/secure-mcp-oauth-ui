import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Avatar,
  Badge,
  Button,
  VStack,
  HStack,
  Heading,
  useToast,
} from '@chakra-ui/react';
import { refreshOAuthToken, getUserInfo, UserInfo, OAuthTokenResponse } from '../lib/api';

interface SketchfabUserInfoProps {
  userId: string;
  onDisconnect?: () => void;
}

const SketchfabUserInfo = ({ userId, onDisconnect }: SketchfabUserInfoProps) => {
  const toast = useToast();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<OAuthTokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Load user data from localStorage on component mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        // Load token data
        const tokenData = localStorage.getItem(`oauth_token_sketchfab_${userId}`);
        if (tokenData) {
          setToken(JSON.parse(tokenData));
        }
        
        // Load user data
        const userData = localStorage.getItem(`oauth_user_sketchfab_${userId}`);
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [userId, toast]);
  
  // Function to refresh the access token
  const handleRefreshToken = async () => {
    if (!token?.refresh_token) {
      toast({
        title: 'Error',
        description: 'No refresh token available',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsRefreshing(true);
    try {
      const newToken = await refreshOAuthToken('sketchfab', userId, token.refresh_token);
      
      // Update token in state and localStorage
      setToken(newToken);
      localStorage.setItem(
        `oauth_token_sketchfab_${userId}`,
        JSON.stringify(newToken)
      );
      
      toast({
        title: 'Success',
        description: 'Token refreshed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Fetch updated user info
      const updatedUser = await getUserInfo('sketchfab', userId);
      setUser(updatedUser);
      localStorage.setItem(
        `oauth_user_sketchfab_${userId}`,
        JSON.stringify(updatedUser)
      );
    } catch (error) {
      console.error('Error refreshing token:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh token',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Function to disconnect from Sketchfab
  const handleDisconnect = () => {
    // Remove tokens and user data from localStorage
    localStorage.removeItem(`oauth_token_sketchfab_${userId}`);
    localStorage.removeItem(`oauth_user_sketchfab_${userId}`);
    
    // Call parent's onDisconnect callback if provided
    if (onDisconnect) onDisconnect();
    
    toast({
      title: 'Disconnected',
      description: 'Successfully disconnected from Sketchfab',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  if (isLoading) {
    return <Box>Loading user information...</Box>;
  }
  
  if (!user) {
    return <Box>No user information available</Box>;
  }
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      boxShadow="md"
      bg="white"
      width="100%"
    >
      <VStack spacing={4} align="stretch">
        <Flex justify="space-between" align="center">
          <HStack>
            <Avatar 
              size="md" 
              name={user.name} 
              src={user.avatar_url} 
            />
            <VStack align="start" spacing={0}>
              <Heading size="md">{user.name}</Heading>
              <Text color="gray.600" fontSize="sm">
                ID: {user.id}
              </Text>
            </VStack>
          </HStack>
          <Badge colorScheme="green">Connected</Badge>
        </Flex>
        
        {token && (
          <Box>
            <Text fontSize="sm" fontWeight="bold">
              Token Expires In: {token.expires_in ? `${token.expires_in} seconds` : 'Unknown'}
            </Text>
          </Box>
        )}
        
        <HStack spacing={2}>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={handleRefreshToken}
            isLoading={isRefreshing}
            loadingText="Refreshing..."
            isDisabled={!token?.refresh_token}
          >
            Refresh Token
          </Button>
          <Button
            size="sm"
            colorScheme="red"
            variant="outline"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default SketchfabUserInfo; 