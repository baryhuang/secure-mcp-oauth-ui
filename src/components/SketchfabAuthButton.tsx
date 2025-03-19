import { useEffect, useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { authorizeSketchfab, getUserInfo, OAuthTokenResponse, UserInfo } from '../lib/api';
import { getProviderConfig } from '../lib/config/providerConfig';

interface SketchfabAuthButtonProps {
  onSuccess?: (tokenResponse: OAuthTokenResponse, userInfo: UserInfo) => void;
  onError?: (error: Error) => void;
}

const SketchfabAuthButton = ({ onSuccess, onError }: SketchfabAuthButtonProps) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if Sketchfab is configured
  const providerConfig = getProviderConfig('sketchfab');
  const isConfigured = providerConfig?.enabled && providerConfig?.clientId;
  
  const handleAuth = () => {
    if (!isConfigured) {
      toast({
        title: 'Configuration Error',
        description: 'Sketchfab integration is not configured properly',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Start the OAuth flow by redirecting to the Sketchfab's auth page directly
      authorizeSketchfab();
    } catch (error) {
      setIsLoading(false);
      if (onError) onError(error instanceof Error ? error : new Error(String(error)));
      toast({
        title: 'Authentication Error',
        description: 'Failed to initiate Sketchfab authentication',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Button
      colorScheme="blue"
      onClick={handleAuth}
      isLoading={isLoading}
      loadingText="Connecting..."
      isDisabled={!isConfigured}
    >
      Connect to Sketchfab
    </Button>
  );
};

export default SketchfabAuthButton; 