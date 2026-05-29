import { useAuth } from '@/context/auth';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isLoggedIn, isLoading } = useAuth();
  if(isLoading){ // render nothing if the app is still loading
    return null;
  }
  
  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }
  return <Redirect href="/(tabs)" />;
}