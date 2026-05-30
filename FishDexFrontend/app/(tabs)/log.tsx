import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

type Log = {
  species: string;
  weight: number;
  length: number;
  location: string;
  description: string;
  caughtAt: string;
};

export default function LogScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [logs, setLogs] = useState<Log[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [species, setSpecies] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Fetch logs on screen load
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('http://10.0.2.2:5177/api/Log', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`  // ← send token with request
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        Alert.alert('Error', 'Failed to fetch logs');
      }
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  const handleAddLog = async () => {
    // Basic validation
    if (!species || !weight || !length || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('http://10.0.2.2:5177/api/Log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`  // ← send token with request
        },
        body: JSON.stringify({
          species,
          weight: parseFloat(weight),
          length: parseFloat(length),
          location,
          description,
          caughtAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Clear form
        setSpecies('');
        setWeight('');
        setLength('');
        setLocation('');
        setDescription('');
        setModalVisible(false);
        fetchLogs();  // ← refresh the list
        Alert.alert('Success', 'Log added!');
      } else {
        Alert.alert('Error', 'Failed to add log');
      }
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  const renderLog = ({ item }: { item: Log }) => (
    <View style={[styles.logCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.logHeader}>
        <Text style={[styles.species, { color: theme.text }]}>{item.species}</Text>
        <Text style={[styles.date, { color: theme.subtext }]}>
          {new Date(item.caughtAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.logDetails}>
        <Text style={[styles.detail, { color: theme.subtext }]}>⚖️ {item.weight} lbs</Text>
        <Text style={[styles.detail, { color: theme.subtext }]}>📏 {item.length} in</Text>
        <Text style={[styles.detail, { color: theme.subtext }]}>📍 {item.location}</Text>
      </View>
      {item.description ? (
        <Text style={[styles.description, { color: theme.subtext }]}>{item.description}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Add Log Button at the top */}
      <Pressable
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
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

      {/* Add Log Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>New Log</Text>

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

            <Pressable style={styles.submitButton} onPress={handleAddLog}>
              <Text style={styles.submitButtonText}>Save Log</Text>
            </Pressable>

            <Pressable style={[styles.cancelButton, { borderColor: theme.border }]} onPress={() => setModalVisible(false)}>
              <Text style={[styles.cancelButtonText, { color: theme.subtext }]}>Cancel</Text>
            </Pressable>

          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, padding: 15 },
  addButton:        { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15, marginTop: 40 },
  addButtonText:    { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  list:             { paddingBottom: 20 },
  logCard:          { borderRadius: 10, padding: 15, marginBottom: 12, borderWidth: 1 },
  logHeader:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  species:          { fontSize: 18, fontWeight: 'bold' },
  date:             { fontSize: 14 },
  logDetails:       { flexDirection: 'row', gap: 12, marginBottom: 6 },
  detail:           { fontSize: 14 },
  description:      { fontSize: 14, fontStyle: 'italic', marginTop: 4 },
  emptyText:        { textAlign: 'center', marginTop: 40, fontSize: 16 },
  modalOverlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent:     { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalTitle:       { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input:            { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12, fontSize: 16 },
  submitButton:     { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton:     { padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  cancelButtonText: { fontSize: 16 },
});