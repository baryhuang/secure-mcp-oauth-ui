import { Box, Flex, HStack, Button, useColorModeValue } from '@chakra-ui/react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Link as ChakraLink } from '@chakra-ui/react';

const Navigation = () => {
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
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
      </Flex>
    </Box>
  );
};

export default Navigation; 