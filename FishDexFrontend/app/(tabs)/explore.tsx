import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';

// USFWS Region boundaries (simplified polygons)
const USFWS_REGIONS = [
  {
    id: 1,
    name: 'Northeast',
    color: '#FF6B6B',
    coordinates: [
      { latitude: 47.5, longitude: -76.5 },
      { latitude: 47.5, longitude: -66.9 },
      { latitude: 40.5, longitude: -66.9 },
      { latitude: 38.9, longitude: -74.9 },
      { latitude: 40.5, longitude: -76.5 },
    ],
  },
  {
    id: 2,
    name: 'Southeast',
    color: '#4ECDC4',
    coordinates: [
      { latitude: 40.5, longitude: -84.8 },
      { latitude: 40.5, longitude: -75.0 },
      { latitude: 38.9, longitude: -75.0 },
      { latitude: 24.5, longitude: -75.0 },
      { latitude: 24.5, longitude: -97.0 },
      { latitude: 29.5, longitude: -97.0 },
      { latitude: 36.5, longitude: -84.8 },
    ],
  },
  {
    id: 3,
    name: 'Midwest',
    color: '#45B7D1',
    coordinates: [
      { latitude: 49.0, longitude: -97.0 },
      { latitude: 49.0, longitude: -82.0 },
      { latitude: 40.5, longitude: -82.0 },
      { latitude: 40.5, longitude: -84.8 },
      { latitude: 36.5, longitude: -84.8 },
      { latitude: 36.5, longitude: -97.0 },
    ],
  },
  {
    id: 4,
    name: 'Southwest',
    color: '#96CEB4',
    coordinates: [
      { latitude: 37.0, longitude: -114.0 },
      { latitude: 37.0, longitude: -97.0 },
      { latitude: 29.5, longitude: -97.0 },
      { latitude: 25.8, longitude: -97.0 },
      { latitude: 25.8, longitude: -114.0 },
    ],
  },
  {
    id: 5,
    name: 'Mountain-Prairie',
    color: '#FFEAA7',
    coordinates: [
      { latitude: 49.0, longitude: -111.0 },
      { latitude: 49.0, longitude: -97.0 },
      { latitude: 36.5, longitude: -97.0 },
      { latitude: 37.0, longitude: -111.0 },
    ],
  },
  {
    id: 6,
    name: 'Pacific',
    color: '#DDA0DD',
    coordinates: [
      { latitude: 49.0, longitude: -124.5 },
      { latitude: 49.0, longitude: -111.0 },
      { latitude: 37.0, longitude: -111.0 },
      { latitude: 32.5, longitude: -114.0 },
      { latitude: 32.5, longitude: -117.1 },
      { latitude: 38.0, longitude: -122.5 },
      { latitude: 46.2, longitude: -124.5 },
    ],
  },
  {
    id: 7,
    name: 'Alaska',
    color: '#98D8C8',
    coordinates: [
      { latitude: 71.5, longitude: -141.0 },
      { latitude: 71.5, longitude: -168.0 },
      { latitude: 54.5, longitude: -168.0 },
      { latitude: 54.5, longitude: -141.0 },
    ],
  },
  {
    id: 8,
    name: 'Pacific Southwest',
    color: '#F7DC6F',
    coordinates: [
      { latitude: 37.0, longitude: -114.0 },
      { latitude: 37.0, longitude: -117.1 },
      { latitude: 32.5, longitude: -117.1 },
      { latitude: 32.5, longitude: -114.0 },
    ],
  },
];

type FishEntry = {
  fishId: number;
  fishName: string;
  habitat: string;
  description: string;
  isCaught: boolean;
};

export default function ExploreScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<typeof USFWS_REGIONS[0] | null>(null);
  const [activeRegionId, setActiveRegionId] = useState<number | null>(null);
  const [regionFish, setRegionFish] = useState<FishEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get user location on load
  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed to show your region');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      // Auto-highlight the region the user is in
      const userRegion = findRegionForLocation(latitude, longitude);
      if (userRegion) {
        setActiveRegionId(userRegion.id);
      }

      // Pan map to user location
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 20,
        longitudeDelta: 20,
      });
    };

    getLocation();
  }, []);

  // Simple point-in-polygon check
  const pointInPolygon = (lat: number, lng: number, polygon: { latitude: number; longitude: number }[]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].longitude, yi = polygon[i].latitude;
      const xj = polygon[j].longitude, yj = polygon[j].latitude;
      const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const findRegionForLocation = (lat: number, lng: number) => {
    return USFWS_REGIONS.find(region =>
      pointInPolygon(lat, lng, region.coordinates)
    ) || null;
  };

  const handleRegionPress = async (region: typeof USFWS_REGIONS[0]) => {
    setSelectedRegion(region);
    setModalVisible(true);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/Explore/region/${region.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRegionFish(data);
      } else {
        Alert.alert('Error', 'Failed to load fish for this region');
      }
    } catch (error) {
      Alert.alert('Error', String(error));
    } finally {
      setLoading(false);
    }
  };

  const renderFishItem = ({ item }: { item: FishEntry }) => (
    <View style={[
      styles.fishCard,
      {
        backgroundColor: item.isCaught ? '#e8f5e9' : theme.card,
        borderColor: item.isCaught ? '#4CAF50' : theme.border
      }
    ]}>
      <View style={styles.fishCardHeader}>
        <Text style={[styles.fishName, { color: theme.text }]}>{item.fishName}</Text>
        {item.isCaught && <Text style={styles.caughtBadge}>✓ Caught</Text>}
      </View>
      <Text style={[styles.fishHabitat, { color: theme.subtext }]}>{item.habitat}</Text>
      <Text style={[styles.fishDescription, { color: theme.subtext }]} numberOfLines={2}>
        {item.description}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 39.5,
          longitude: -98.35,
          latitudeDelta: 60,
          longitudeDelta: 60,
        }}
      >
        {/* Draw region polygons */}
        {USFWS_REGIONS.map(region => (
          <Polygon
            key={region.id}
            coordinates={region.coordinates}
            fillColor={
              activeRegionId === region.id
                ? `${region.color}99`  // ← more opaque when active
                : `${region.color}44`  // ← semi transparent normally
            }
            strokeColor={region.color}
            strokeWidth={2}
            tappable={true}
            onPress={() => handleRegionPress(region)}
          />
        ))}

        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You are here"
            pinColor="#007AFF"
          />
        )}
      </MapView>

      {/* Region label overlay */}
      {activeRegionId && (
        <View style={[styles.regionLabel, { backgroundColor: theme.card }]}>
          <Text style={[styles.regionLabelText, { color: theme.text }]}>
            📍 You are in the {USFWS_REGIONS.find(r => r.id === activeRegionId)?.name} region
          </Text>
        </View>
      )}

      {/* Fish Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedRegion?.name} Region
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={{ color: theme.subtext, fontSize: 16 }}>Close</Text>
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
            ) : (
              <>
                <Text style={[styles.fishCount, { color: theme.subtext }]}>
                  {regionFish.filter(f => f.isCaught).length}/{regionFish.length} species caught
                </Text>
                <FlatList
                  data={regionFish}
                  keyExtractor={(item) => item.fishId.toString()}
                  renderItem={renderFishItem}
                  contentContainerStyle={styles.fishList}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  map:             { flex: 1 },
  regionLabel:     { position: 'absolute', top: 50, left: 20, right: 20, padding: 12, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  regionLabelText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  modalOverlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent:    { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '75%' },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle:      { fontSize: 22, fontWeight: 'bold' },
  fishCount:       { fontSize: 14, marginBottom: 16 },
  fishList:        { paddingBottom: 20 },
  fishCard:        { borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1 },
  fishCardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  fishName:        { fontSize: 16, fontWeight: 'bold' },
  caughtBadge:     { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  fishHabitat:     { fontSize: 12, marginBottom: 4 },
  fishDescription: { fontSize: 13 },
});