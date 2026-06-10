import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';


export default function AccountScreen() {
  const { username, setIsLoggedIn, setUsername, token, setToken } = useAuth();
  const router = useRouter();
  const { theme, isDark, toggleTheme} = useTheme();

  const user = {
    username: username,
    email: "student@university.edu",  //mock data that needs to be gotten from database eventually
    level: 42,
    fishCaught: 12,
  };

  const handleSignOut = async () => {
  try {
    // tell the server to invalidate the token
    await fetch(`${API_URL}/api/Logout`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(token)  // send the token to delete
    });
  } catch (error) {
    console.log('Logout error:', error);
  }

  // clear local storage regardless of server response
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
        <Text style={[styles.email, { color: theme.subtext }]}>student@university.edu</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile Details</Text>
        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.subtext }]}>Level:</Text>
          <Text style={[styles.value, { color: theme.text }]}>42</Text>
        </View>
        <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.subtext }]}>Fish in Dex:</Text>
          <Text style={[styles.value, { color: theme.text }]}>12</Text>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  email: {
    color: '#666',
    fontSize: 16,
  },
  infoSection: {
    padding: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    color: '#555',
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