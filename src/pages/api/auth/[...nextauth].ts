import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getProviderConfig } from '../../../lib/config/providerConfig';

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
  providers: [getGoogleProvider()],
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
