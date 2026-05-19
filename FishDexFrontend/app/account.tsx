import { useAuth } from '@/context/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';


export default function AccountScreen() {
  const { username, setIsLoggedIn, setUsername } = useAuth();
  const router = useRouter();

  const user = {
    username: username,
    email: "student@university.edu",  //mock data that needs to be gotten from database eventually
    level: 42,
    fishCaught: 12,
  };

  const handleSignOut = async () => {
    setIsLoggedIn(false);
    setUsername('');
    // AsyncStorage is cleared automatically via the wrapped functions above
    router.replace('/signup');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={100} color="#007AFF" />
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Profile Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Level:</Text>
          <Text style={styles.value}>{user.level}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Fish in Dex:</Text>
          <Text style={styles.value}>{user.fishCaught}</Text>
        </View>
      </View>

      <Pressable 
        style={styles.logoutButton} 
        onPress={handleSignOut}
      >
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