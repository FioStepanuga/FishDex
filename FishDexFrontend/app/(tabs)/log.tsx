import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

type Log = {
  logId: number;
  species: string;
  weight: number;
  length: number;
  location: string;
  description: string;
  caughtAt: string;
  photoBase64: string | null;
};

export default function LogScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const params = useLocalSearchParams();

  const [logs, setLogs] = useState<Log[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState<Log | null>(null);  // ← null = adding, Log = editing

  // Form state
  const [species, setSpecies] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState('image/jpeg');

  // Fetch logs on screen load
  useEffect(() => {
    fetchLogs();
  }, []);

  // Pre-fill form if arriving from identify screen
  useEffect(() => {
    if (params.species) {
      setSpecies(params.species as string);
      setLocation(params.location as string ?? '');
      if (params.photoBase64) {
        setPhotoBase64(params.photoBase64 as string);
        setPhotoMime(params.photoMime as string ?? 'image/jpeg');
      }
      setEditingLog(null);
      setModalVisible(true);
    }
  }, [params.species]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Log`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  const openAddModal = () => {
    // Clear form for new log
    setEditingLog(null);
    setSpecies('');
    setWeight('');
    setLength('');
    setLocation('');
    setDescription('');
    setPhotoBase64(null);
    setModalVisible(true);
  };

  const openEditModal = (log: Log) => {
    // Pre-fill form with existing log data
    setEditingLog(log);
    setSpecies(log.species);
    setWeight(log.weight.toString());
    setLength(log.length.toString());
    setLocation(log.location);
    setDescription(log.description === 'No description' ? '' : log.description);
    setPhotoBase64(log.photoBase64);
    setModalVisible(true);
  };

  const handleSaveLog = async () => {
    if (!species || !weight || !length || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const logData = {
      species,
      weight: parseFloat(weight),
      length: parseFloat(length),
      location,
      description,
      caughtAt: new Date().toISOString(),
      photoBase64: photoBase64 ?? null
    };

    try {
      const isEditing = editingLog !== null;
      const url = isEditing
        ? `${API_URL}/api/Log/${editingLog.logId}`  // ← PUT for edit
        : `${API_URL}/api/Log`;                      // ← POST for new

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(logData)
      });

      if (response.ok) {
        setModalVisible(false);
        fetchLogs();
        Alert.alert('Success', isEditing ? 'Log updated!' : 'Log added!');
      } else {
        Alert.alert('Error', isEditing ? 'Failed to update log' : 'Failed to add log');
      }
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  const handleDeleteLog = async (logId: number) => {
    Alert.alert(
      'Delete Log',
      'Are you sure you want to delete this log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/Log/${logId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                fetchLogs();
              } else {
                Alert.alert('Error', 'Failed to delete log');
              }
            } catch (error) {
              Alert.alert('Error', String(error));
            }
          }
        }
      ]
    );
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Gallery access is needed');
      return;
    }

    const photo = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,  // ← lower quality to keep base64 size manageable
      base64: true,
    });

    if (!photo.canceled && photo.assets[0].base64) {
      setPhotoBase64(photo.assets[0].base64);
      setPhotoMime(photo.assets[0].mimeType ?? 'image/jpeg');
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Camera access is needed');
      return;
    }

    const photo = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
    });

    if (!photo.canceled && photo.assets[0].base64) {
      setPhotoBase64(photo.assets[0].base64);
      setPhotoMime(photo.assets[0].mimeType ?? 'image/jpeg');
    }
  };

  const renderLog = ({ item }: { item: Log }) => (
    <Pressable
      style={[styles.logCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => openEditModal(item)}  // ← tap to edit
    >
      {/* Photo thumbnail if exists */}
      {item.photoBase64 && (
        <Image
          source={{ uri: `data:image/jpeg;base64,${item.photoBase64}` }}
          style={styles.thumbnail}
        />
      )}

      <View style={styles.logHeader}>
        <Text style={[styles.species, { color: theme.text }]}>{item.species}</Text>
        <View style={styles.logHeaderRight}>
          <Text style={[styles.date, { color: theme.subtext }]}>
            {new Date(item.caughtAt).toLocaleDateString()}
          </Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();  // ← prevent opening edit when tapping trash
              handleDeleteLog(item.logId);
            }}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
          </Pressable>
        </View>
      </View>

      <View style={styles.logDetails}>
        <Text style={[styles.detail, { color: theme.subtext }]}>⚖️ {item.weight} lbs</Text>
        <Text style={[styles.detail, { color: theme.subtext }]}>📏 {item.length} in</Text>
        <Text style={[styles.detail, { color: theme.subtext }]}>📍 {item.location}</Text>
      </View>
      {item.description && item.description !== 'No description' ? (
        <Text style={[styles.description, { color: theme.subtext }]}>{item.description}</Text>
      ) : null}
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Add Log Button */}
      <Pressable style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addButtonText}>+ Add Log</Text>
      </Pressable>

      {/* Log List */}
      <FlatList
        data={logs}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderLog}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.subtext }]}>
            No logs yet. Catch something!
          </Text>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalContent, { backgroundColor: theme.card }]}>

            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingLog ? 'Edit Log' : 'New Log'}  
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="Species *"
              placeholderTextColor={theme.subtext}
              value={species}
              onChangeText={setSpecies}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="Weight (lbs) *"
              placeholderTextColor={theme.subtext}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="Length (in) *"
              placeholderTextColor={theme.subtext}
              value={length}
              onChangeText={setLength}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="Location *"
              placeholderTextColor={theme.subtext}
              value={location}
              onChangeText={setLocation}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="Notes (optional)"
              placeholderTextColor={theme.subtext}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Photo Section */}
            {photoBase64 ? (
              <View style={styles.photoPreviewContainer}>
                <Image
                  source={{ uri: `data:${photoMime};base64,${photoBase64}` }}
                  style={styles.photoPreview}
                />
                <Pressable
                  style={styles.removePhotoButton}
                  onPress={() => setPhotoBase64(null)}
                >
                  <Text style={styles.removePhotoText}>Remove Photo</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.photoButtons}>
                <Pressable
                  style={[styles.photoButton, { borderColor: theme.border }]}
                  onPress={handleTakePhoto}
                >
                  <Text style={[styles.photoButtonText, { color: theme.text }]}>📷 Camera</Text>
                </Pressable>
                <Pressable
                  style={[styles.photoButton, { borderColor: theme.border }]}
                  onPress={handlePickPhoto}
                >
                  <Text style={[styles.photoButtonText, { color: theme.text }]}>🖼️ Gallery</Text>
                </Pressable>
              </View>
            )}

            <Pressable style={styles.submitButton} onPress={handleSaveLog}>
              <Text style={styles.submitButtonText}>
                {editingLog ? 'Save Changes' : 'Save Log'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.subtext }]}>Cancel</Text>
            </Pressable>

          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, padding: 15 },
  addButton:            { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15, marginTop: 40 },
  addButtonText:        { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  list:                 { paddingBottom: 20 },
  logCard:              { borderRadius: 10, padding: 15, marginBottom: 12, borderWidth: 1 },
  thumbnail:            { width: '100%', height: 150, borderRadius: 8, marginBottom: 10 },
  logHeader:            { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  logHeaderRight:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  species:              { fontSize: 18, fontWeight: 'bold' },
  date:                 { fontSize: 14 },
  deleteButton:         { padding: 4 },
  logDetails:           { flexDirection: 'row', gap: 12, marginBottom: 6 },
  detail:               { fontSize: 14 },
  description:          { fontSize: 14, fontStyle: 'italic', marginTop: 4 },
  emptyText:            { textAlign: 'center', marginTop: 40, fontSize: 16 },
  modalOverlay:         { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent:         { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalTitle:           { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input:                { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12, fontSize: 16 },
  photoPreviewContainer:{ marginBottom: 12 },
  photoPreview:         { width: '100%', height: 200, borderRadius: 10, marginBottom: 8 },
  removePhotoButton:    { alignItems: 'center', padding: 8 },
  removePhotoText:      { color: '#ff3b30', fontSize: 14 },
  photoButtons:         { flexDirection: 'row', gap: 10, marginBottom: 12 },
  photoButton:          { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  photoButtonText:      { fontSize: 14 },
  submitButton:         { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  submitButtonText:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton:         { padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  cancelButtonText:     { fontSize: 16 },
});