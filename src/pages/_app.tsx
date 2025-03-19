import type { AppProps } from 'next/app';
import { ChakraProvider, extendTheme, Box } from '@chakra-ui/react';
import { SessionProvider } from 'next-auth/react';
import Navigation from '../components/Navigation';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
});

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <ChakraProvider theme={theme}>
        <Navigation />
        <Box pt="16">
          <Component {...pageProps} />
        </Box>
      </ChakraProvider>
    </SessionProvider>
  );
}
