import { Box, Flex, HStack, Button, useColorModeValue } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Link as ChakraLink } from '@chakra-ui/react';

const Navigation = () => {
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const isActive = (path: string) => router.pathname === path;
  
  return (
    <Box
      as="nav"
      position="fixed"
      top="0"
      width="100%"
      zIndex="100"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      boxShadow="sm"
    >
      <Flex
        h={16}
        alignItems="center"
        justifyContent="space-between"
        mx="auto"
        px={6}
        maxW="container.xl"
      >
        <NextLink href="/" legacyBehavior>
          <ChakraLink fontWeight="bold" fontSize="xl" _hover={{ textDecoration: 'none' }}>
            Secure MCP OAuth
          </ChakraLink>
        </NextLink>
        
        <HStack spacing={4}>
          <NextLink href="/" legacyBehavior>
            <ChakraLink
              px={3}
              py={2}
              rounded="md"
              fontWeight={isActive('/') ? 'semibold' : 'normal'}
              color={isActive('/') ? 'blue.500' : undefined}
              _hover={{ textDecoration: 'none', bg: 'gray.100' }}
            >
              Home
            </ChakraLink>
          </NextLink>
          
          <NextLink href="/integrations/sketchfab" legacyBehavior>
            <ChakraLink
              px={3}
              py={2}
              rounded="md"
              fontWeight={isActive('/integrations/sketchfab') ? 'semibold' : 'normal'}
              color={isActive('/integrations/sketchfab') ? 'blue.500' : undefined}
              _hover={{ textDecoration: 'none', bg: 'gray.100' }}
            >
              Sketchfab
            </ChakraLink>
          </NextLink>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navigation; 