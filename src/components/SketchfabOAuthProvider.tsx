import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@chakra-ui/react';
import { getUserInfo, refreshOAuthToken, OAuthTokenResponse, UserInfo } from '../lib/api';

interface SketchfabAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  userInfo: UserInfo | null;
  tokenInfo: OAuthTokenResponse | null;
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const SketchfabAuthContext = createContext<SketchfabAuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  userInfo: null,
  tokenInfo: null,
  login: () => {},
  logout: () => {},
  refreshToken: async () => false,
});

export const useSketchfabAuth = () => useContext(SketchfabAuthContext);

interface SketchfabOAuthProviderProps {
  children: ReactNode;
}

export const SketchfabOAuthProvider = ({ children }: SketchfabOAuthProviderProps) => {
  const toast = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [tokenInfo, setTokenInfo] = useState<OAuthTokenResponse | null>(null);
  
  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Look for any stored tokens for Sketchfab
        const keys = Object.keys(localStorage);
        let foundUserId = null;
        
        for (const key of keys) {
          if (key.startsWith('oauth_token_sketchfab_')) {
            foundUserId = key.replace('oauth_token_sketchfab_', '');
            const tokenData = localStorage.getItem(key);
            if (tokenData) {
              setTokenInfo(JSON.parse(tokenData));
            }
            break;
          }
        }
        
        if (foundUserId) {
          setUserId(foundUserId);
          setIsAuthenticated(true);
          
          // Load user data
          const userData = localStorage.getItem(`oauth_user_sketchfab_${foundUserId}`);
          if (userData) {
            setUserInfo(JSON.parse(userData));
          }
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = () => {
    window.location.href = '/api/sketchfab-auth';
  };
  
  // Logout function
  const logout = () => {
    if (userId) {
      localStorage.removeItem(`oauth_token_sketchfab_${userId}`);
      localStorage.removeItem(`oauth_user_sketchfab_${userId}`);
    }
    
    setIsAuthenticated(false);
    setUserId(null);
    setUserInfo(null);
    setTokenInfo(null);
    
    toast({
      title: 'Logged Out',
      description: 'You have been disconnected from Sketchfab',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Token refresh function
  const refreshToken = async (): Promise<boolean> => {
    if (!userId || !tokenInfo?.refresh_token) {
      toast({
        title: 'Error',
        description: 'No refresh token available',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
    
    try {
      const newToken = await refreshOAuthToken('sketchfab', userId, tokenInfo.refresh_token);
      
      // Update token in state and localStorage
      setTokenInfo(newToken);
      localStorage.setItem(
        `oauth_token_sketchfab_${userId}`,
        JSON.stringify(newToken)
      );
      
      // Fetch updated user info
      const updatedUser = await getUserInfo('sketchfab', userId);
      setUserInfo(updatedUser);
      localStorage.setItem(
        `oauth_user_sketchfab_${userId}`,
        JSON.stringify(updatedUser)
      );
      
      toast({
        title: 'Success',
        description: 'Token refreshed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh token',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };
  
  const value = {
    isAuthenticated,
    isLoading,
    userId,
    userInfo,
    tokenInfo,
    login,
    logout,
    refreshToken,
  };
  
  return (
    <SketchfabAuthContext.Provider value={value}>
      {children}
    </SketchfabAuthContext.Provider>
  );
};

export default SketchfabOAuthProvider; 