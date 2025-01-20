import { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { useSession, signIn, signOut } from 'next-auth/react';
import { FiLock, FiRefreshCcw, FiShield } from 'react-icons/fi';

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
  ]);
  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)');

  useEffect(() => {
    if (session?.accessToken) {
      setIntegrations(prev => 
        prev.map(int => ({
          ...int,
          isConnected: int.name === 'Google Drive'
        }))
      );
    } else {
      setIntegrations(prev => 
        prev.map(int => ({
          ...int,
          isConnected: false
        }))
      );
    }
  }, [session]);

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
              onClick={() => window.location.href = '#integrations'}
              sx={{
                opacity: 0,
                animation: '1s ease-out 0.4s forwards slideFadeIn',
              }}
            >
              Get Started
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={32} bg="black" position="relative">
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
            Available Integrations
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
                    </Box>
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
    </Box>
  );
}
