import { Stack } from 'expo-router';
import { AuthProvider } from './context/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        {/* Add this so the Redirect knows where to go */}
        <Stack.Screen name="index" options={{ headerShown: false }} /> 
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ presentation: 'modal', title: 'My Profile' }} />
      </Stack>
    </AuthProvider>
  );
}

