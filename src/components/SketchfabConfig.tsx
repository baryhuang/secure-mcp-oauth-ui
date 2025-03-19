import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Switch,
  VStack,
  useToast,
  Heading,
  Text,
} from '@chakra-ui/react';
import { getProviderConfig, saveProviderConfig } from '../lib/config/providerConfig';

const SketchfabConfig = () => {
  const toast = useToast();
  const [clientId, setClientId] = useState('tpZqqaJJn5iFTPc2EBVDP4l62qchGxrTEKzS4yFO');
  const [clientSecret, setClientSecret] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load existing config on component mount
  useEffect(() => {
    const config = getProviderConfig('sketchfab');
    if (config) {
      setClientId(config.clientId || '');
      setClientSecret(config.clientSecret || '');
      setEnabled(config.enabled || false);
    } else {
      // Save default configuration if none exists
      saveProviderConfig('sketchfab', {
        clientId,
        clientSecret: '',
        enabled: true,
      });
    }
  }, [clientId]);
  
  const handleSave = () => {
    setIsLoading(true);
    try {
      saveProviderConfig('sketchfab', {
        clientId,
        clientSecret,
        enabled,
      });
      
      toast({
        title: 'Configuration Saved',
        description: 'Sketchfab OAuth configuration has been saved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={6}
      boxShadow="md"
      bg="white"
      width="100%"
    >
      <VStack spacing={4} align="stretch">
        <Heading size="md">Sketchfab OAuth Configuration</Heading>
        <Text fontSize="sm" color="gray.600">
          Configure your Sketchfab OAuth credentials to enable authentication.
          You can obtain these from your Sketchfab developer account.
        </Text>
        
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="enabled" mb="0">
            Enable Sketchfab OAuth
          </FormLabel>
          <Switch
            id="enabled"
            isChecked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>Client ID</FormLabel>
          <Input
            placeholder="Enter Sketchfab Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>Client Secret</FormLabel>
          <Input
            placeholder="Enter Sketchfab Client Secret"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
          />
        </FormControl>
        
        <Button
          colorScheme="blue"
          onClick={handleSave}
          isLoading={isLoading}
          loadingText="Saving..."
          isDisabled={!clientId || !clientSecret}
        >
          Save Configuration
        </Button>
      </VStack>
    </Box>
  );
};

export default SketchfabConfig; 