import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import TwitterProvider from 'next-auth/providers/twitter';
import { getProviderConfig } from '../../../lib/config/providerConfig';

const getTwitterProvider = () => {
  // First try environment variables
  if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
    return TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      version: "2.0" // Use Twitter OAuth 2.0
    });
  }
  
  // Fallback to stored config if available
  const twitterConfig = getProviderConfig('twitter');
  if (twitterConfig?.enabled) {
    return TwitterProvider({
      clientId: twitterConfig.clientId,
      clientSecret: twitterConfig.clientSecret,
      version: "2.0" // Use Twitter OAuth 2.0
    });
  }
  
  // Return a disabled provider if no configuration is available
  return TwitterProvider({
    clientId: 'DISABLED',
    clientSecret: 'DISABLED',
    version: "2.0" // Use Twitter OAuth 2.0
  });
};

const getGoogleProvider = () => {
  // First try environment variables
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'https://www.googleapis.com/auth/drive.file email profile',
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    });
  }
  
  // Fallback to stored config if available
  const googleConfig = getProviderConfig('google');
  if (googleConfig?.enabled) {
    return GoogleProvider({
      clientId: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
      authorization: {
        params: {
          scope: 'https://www.googleapis.com/auth/drive.file email profile',
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    });
  }
  
  // Return a disabled provider if no configuration is available
  return GoogleProvider({
    clientId: 'DISABLED',
    clientSecret: 'DISABLED',
    authorization: {
      params: {
        scope: 'https://www.googleapis.com/auth/drive.file email profile',
        prompt: "consent",
        access_type: "offline",
        response_type: "code"
      }
    }
  });
};

export const authOptions = {
  providers: [getGoogleProvider(), getTwitterProvider()],
  callbacks: {
    async jwt({ token, account }: any) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    error: '/auth/error',
  },
};

export default NextAuth(authOptions);
