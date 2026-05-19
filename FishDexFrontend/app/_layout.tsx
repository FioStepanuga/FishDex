import { AuthProvider } from '@/context/auth';
import { ThemeProvider } from '@/context/theme';
import { Stack } from 'expo-router';


export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Stack>
          {/* Add this so the Redirect knows where to go */}
          <Stack.Screen name="index" options={{ headerShown: false }} /> 
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="account" options={{ presentation: 'modal', title: 'My Profile' }} />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}

