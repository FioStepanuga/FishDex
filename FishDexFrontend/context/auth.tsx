import { API_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  username: string;
  setUsername: (username: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  token: string;
  setToken: (token: string) => void; 
  isLoading: boolean;
  clearAuthState: () => Promise<void>;

};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');

  // loads saved login state when app starts
  useEffect(() => {
  const loadAuthState = async () => {
    try {
      const storedValue = await AsyncStorage.getItem('isLoggedIn');
      const storedUsername = await AsyncStorage.getItem('username');
      const storedToken = await AsyncStorage.getItem('token');

      console.log('storedValue:', storedValue);
      console.log('storedUsername:', storedUsername);

      if (storedValue === 'true' && storedToken) {
        // ← validate the token before trusting it
        const isValid = await validateToken(storedToken);

        if (isValid) {
          setIsLoggedIn(true);
          setUsername(storedUsername ?? '');
          setToken(storedToken);
        } else {
          // ← token is invalid, clear everything
          console.log('Token invalid, clearing auth state');
          await clearAuthState();
        }
      }
    } catch (error) {
      console.log('Auth load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  loadAuthState();
}, []);

const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/Log/validate`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 401) {
      return false;  // ← definitely invalid
    }
    
    // ← anything else (200, network error, timeout) = assume valid
    return true;
  } catch (error) {
    console.log('Token validation network error, assuming valid:', error);
    return true;  // ← network issue, don't log out
  }
};

const clearAuthState = async () => {
  await AsyncStorage.removeItem('isLoggedIn');
  await AsyncStorage.removeItem('username');
  await AsyncStorage.removeItem('token');
  setIsLoggedIn(false);
  setUsername('');
  setToken('');
};

  // saves to device storage when logging in
  const handleSetIsLoggedIn = async (value: boolean) => {
    setIsLoggedIn(value);
    await AsyncStorage.setItem('isLoggedIn', String(value));
  };

  // saves to device storage when username is set
  const handleSetUsername = async (value: string) => {
    setUsername(value);
    await AsyncStorage.setItem('username', value);
  };

  const handleSetToken = async (value: string) => {
    setToken(value);
    await AsyncStorage.setItem('token', value);
  };

  return (
    // using the wrapped handlers instead of the originals
    <AuthContext.Provider value={{ username, setUsername: handleSetUsername, password, setPassword, isLoggedIn, setIsLoggedIn: handleSetIsLoggedIn, isLoading, token, setToken: handleSetToken, clearAuthState }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}