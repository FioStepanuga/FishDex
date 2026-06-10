import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function IdentifyScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

const takePhoto = async () => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission required', 'Camera access is needed to take a photo');
    return;
  }

  const photo = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],  // ← updated
    quality: 0.7,
    base64: true,
  });

  if (!photo.canceled && photo.assets[0].base64) {
    setImage(photo.assets[0].uri);
    setMimeType(photo.assets[0].mimeType ?? 'image/jpeg');
    setResult(null);
    identifyFish(photo.assets[0].base64, photo.assets[0].mimeType ?? 'image/jpeg');
  }
};


const pickFromGallery = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission required', 'Gallery access is needed to pick a photo');
    return;
  }

  const photo = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    base64: true,
  });

  if (!photo.canceled && photo.assets[0].base64) {
    setImage(photo.assets[0].uri);
    setMimeType(photo.assets[0].mimeType ?? 'image/jpeg');
    setResult(null);
    identifyFish(photo.assets[0].base64, photo.assets[0].mimeType ?? 'image/jpeg');
  }
};

  const identifyFish = async (base64: string, mime: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/Identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: mime
        })
      });

      const data = await response.json();

      Alert.alert('Debug', JSON.stringify(data)); //TEMPORARY

      if (response.ok && data.success) {
        setResult(data.species);
      } else {
        setResult(null);
        Alert.alert('Could not identify', 'Try a clearer photo of the fish');
      }
    } catch (error) {
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Identify Fish</Text>
      <Text style={[styles.subtitle, { color: theme.subtext }]}>
        Take or upload a photo of your catch
      </Text>

      {/* Photo preview */}
      {image ? (
        <Image source={{ uri: image }} style={styles.preview} />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.subtext, fontSize: 48 }}>🐟</Text>
          <Text style={{ color: theme.subtext, marginTop: 10 }}>No photo yet</Text>
        </View>
      )}

      {/* Loading spinner */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: theme.subtext }]}>Identifying fish...</Text>
        </View>
      )}

      {/* Result */}
      {result && !loading && (
        <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.resultLabel, { color: theme.subtext }]}>Identified as:</Text>
          <Text style={[styles.resultSpecies, { color: theme.text }]}>{result}</Text>
          <Pressable
            style={styles.logButton}
            onPress={() => router.push({ pathname: '/log', params: { species: result } })}
          >
            <Text style={styles.logButtonText}>Log this catch</Text>
          </Pressable>
        </View>
      )}

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <Pressable style={[styles.button, { opacity: loading ? 0.5 : 1 }]} onPress={takePhoto} disabled={loading}>
          <Text style={styles.buttonText}>📷 Take Photo</Text>
        </Pressable>
        <Pressable style={[styles.button, { opacity: loading ? 0.5 : 1 }]} onPress={pickFromGallery} disabled={loading}>
          <Text style={styles.buttonText}>🖼️ Gallery</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, padding: 20, alignItems: 'center' },
  title:            { fontSize: 28, fontWeight: 'bold', marginTop: 40, marginBottom: 8 },
  subtitle:         { fontSize: 16, marginBottom: 24 },
  preview:          { width: '100%', height: 280, borderRadius: 16, marginBottom: 20 },
  placeholder:      { width: '100%', height: 280, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  loadingContainer: { alignItems: 'center', marginBottom: 16 },
  loadingText:      { marginTop: 8, fontSize: 16 },
  resultCard:       { width: '100%', padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 20 },
  resultLabel:      { fontSize: 14, marginBottom: 4 },
  resultSpecies:    { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  logButton:        { backgroundColor: '#007AFF', padding: 12, borderRadius: 10, width: '100%', alignItems: 'center' },
  logButtonText:    { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonRow:        { flexDirection: 'row', gap: 12, width: '100%' },
  button:           { flex: 1, backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText:       { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});