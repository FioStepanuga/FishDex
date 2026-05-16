import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from './context/auth';

export default function SignUpScreen() {
  const { username, setUsername, password, setPassword, isLoggedIn, setIsLoggedIn } = useAuth(); 
  const router = useRouter();

  const handleSignUp = async () => {
    try {

      const response = await fetch('http://10.0.2.2:5177/api/SignUp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Username: username,
          Password: password
        })
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Signed up to FishDex!");
        setIsLoggedIn(true);
        router.replace('/');
      } else {
        Alert.alert("Error", result.message || "Invalid Username or Password");
      }
    } catch (error) {
      Alert.alert(String(error));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FishDex</Text>
      
      <TextInput 
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput 
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true} // This masks the password
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: '#2c3e50' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  button: { backgroundColor: '#3498db', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});