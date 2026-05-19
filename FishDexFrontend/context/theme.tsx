import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type Theme = {
  background: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  primary: string;
};

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;  // ← add this
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceTheme = useColorScheme();
  const [isDark, setIsDark] = useState(deviceTheme === 'dark');

  // Load saved theme preference on app start
  useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem('isDark');
      if (saved !== null) {
        setIsDark(saved === 'true');  // use saved preference if it exists
      }
    };
    loadTheme();
  }, []);

  // Toggle and save preference
  const toggleTheme = async () => {
    const newValue = !isDark;
    setIsDark(newValue);
    await AsyncStorage.setItem('isDark', String(newValue));
  };

  const theme: Theme = {
    background: isDark ? '#1a1a1a' : '#f8f9fa',
    card:       isDark ? '#2c2c2c' : '#ffffff',
    text:       isDark ? '#ffffff' : '#333333',
    subtext:    isDark ? '#aaaaaa' : '#666666',
    border:     isDark ? '#444444' : '#eeeeee',
    primary:    '#007AFF',
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}