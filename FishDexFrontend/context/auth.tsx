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
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) setToken(storedToken);
      const storedValue = await AsyncStorage.getItem('isLoggedIn');
      const storedUsername = await AsyncStorage.getItem('username');

      console.log('storedValue:', storedValue);
      console.log('storedUsername:', storedUsername);

      if (storedValue === 'true') {
        setIsLoggedIn(true);
        setUsername(storedUsername ?? '');
      }
      setIsLoading(false); //done loading
    };
    loadAuthState();
  }, []);

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
    <AuthContext.Provider value={{ username, setUsername: handleSetUsername, password, setPassword, isLoggedIn, setIsLoggedIn: handleSetIsLoggedIn, isLoading, token, setToken: handleSetToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}