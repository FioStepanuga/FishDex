import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

type Progress = {
  total: number;
  caught: number;
};

export default function AccountScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { username, setIsLoggedIn, setUsername, token, setToken } = useAuth();
  const router = useRouter();

  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/Explore/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch (error) {
      console.log('Progress fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch(`${API_URL}/api/Logout`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token)
      });
    } catch (error) {
      console.log('Logout error:', error);
    }

    setIsLoggedIn(false);
    setUsername('');
    setToken('');
    router.replace('/login');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Ionicons name="person-circle" size={100} color={theme.primary} />
        <Text style={[styles.username, { color: theme.text }]}>{username}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile Details</Text>

        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.subtext }]}>Level:</Text>
          <Text style={[styles.value, { color: theme.text }]}>Coming Soon</Text>
        </View>

        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.subtext }]}>Fish in Dex:</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[styles.value, { color: theme.text }]}>
              {progress ? `${progress.caught} / ${progress.total}` : '0 / 0'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.subtext }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ddd', true: '#007AFF' }}
            thumbColor={'#ffffff'}
          />
        </View>
      </View>

      <Pressable style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 40,
    borderBottomWidth: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  infoSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    margin: 20,
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});