import { useAuth } from '@/app/context/auth';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Redirect href="/signup" />;
  }

  return <Redirect href="/(tabs)" />;
}