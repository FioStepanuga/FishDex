import regionsData from '@/assets/FWS_National_Regional_Boundaries.json';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { authFetch } from '@/utils/api';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';

// Region colors mapped by region number
const REGION_COLORS: { [key: number]: string } = {
  1: '#FF6B6B',
  2: '#4ECDC4',
  3: '#45B7D1',
  4: '#96CEB4',
  5: '#FFEAA7',
  6: '#DDA0DD',
  7: '#98D8C8',
  8: '#F7DC6F',
};


// Convert GeoJSON coordinates to react-native-maps format
const convertCoordinates = (coords: number[][]) => {
  return coords.map(coord => ({
    latitude: coord[1],
    longitude: coord[0]
  }));
};

// Build regions array from GeoJSON
const USFWS_REGIONS = (regionsData as any).features.map((feature: any) => {
  const regionId = feature.properties.Region_Number;
  const polygons: { latitude: number; longitude: number }[][] = [];

  if (feature.geometry.type === 'Polygon') {
    polygons.push(convertCoordinates(feature.geometry.coordinates[0]));
  } else if (feature.geometry.type === 'MultiPolygon') {
    feature.geometry.coordinates.forEach((polygon: number[][][]) => {
      polygons.push(convertCoordinates(polygon[0]));
    });
  }

  return {
    id: regionId,
    name: feature.properties.REGNAME,
    color: REGION_COLORS[regionId] ?? '#007AFF',
    polygons  // ← array of polygons since regions can have multiple shapes
  };
});

type FishEntry = {
  fishId: number;
  fishName: string;
  habitat: string;
  description: string;
  isCaught: boolean;
};

export default function ExploreScreen() {
  const router = useRouter();
  const { clearAuthState } = useAuth();
  const { token } = useAuth();
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<typeof USFWS_REGIONS[0] | null>(null);
  const [activeRegionId, setActiveRegionId] = useState<number | null>(null);
  const [regionFish, setRegionFish] = useState<FishEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [selectedFish, setSelectedFish] = useState<FishEntry | null>(null);
  const [fishDetailVisible, setFishDetailVisible] = useState(false);


  // Get user location on load
useEffect(() => {
  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed to show your region');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      const userRegion = findRegionForLocation(latitude, longitude);
      if (userRegion) {
        setActiveRegionId(userRegion.id);
      }

      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 20,
        longitudeDelta: 20,
      });
    } catch (error) {
      console.log('Location error:', error);
    } finally {
      setLocationLoading(false);  // ← always runs regardless of success or failure
    }
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
  return USFWS_REGIONS.find((region: any) =>
    region.polygons.some((polygon: any) =>
      pointInPolygon(lat, lng, polygon)
    )
  ) || null;
};


const handleRegionPress = async (region: typeof USFWS_REGIONS[0]) => {
  setSelectedRegion(region);
  setModalVisible(true);
  setLoading(true);

  try {
    const response = await authFetch(
      `/api/Explore/region/${region.id}`,
      token,
      { method: 'GET' },
      async () => { await clearAuthState(); router.replace('/login'); }
    );

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
  <Pressable
    style={[
      styles.fishCard,
      {
        backgroundColor: item.isCaught ? '#e8f5e9' : theme.card,
        borderColor: item.isCaught ? '#4CAF50' : theme.border
      }
    ]}
    onPress={() => {
      setModalVisible(false);       // ← close region modal first
      setTimeout(() => {            // ← wait for it to close
        setSelectedFish(item);
        setFishDetailVisible(true); // ← then open fish detail
      }, 400);
    }}
  >
    <View style={styles.fishCardHeader}>
      <Text style={[styles.fishName, { color: theme.text }]}>{item.fishName}</Text>
      {item.isCaught && <Text style={styles.caughtBadge}>✓ Caught</Text>}
    </View>
    <Text style={[styles.fishHabitat, { color: theme.subtext }]}>{item.habitat}</Text>
    <Text style={[styles.fishDescription, { color: theme.subtext }]} numberOfLines={2}>
      {item.description}
    </Text>
  </Pressable>
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
        {USFWS_REGIONS.map((region: any) =>
          region.polygons.map((polygonCoords: any, index: number) => (
            <Polygon
              key={`${region.id}-${index}`}
              coordinates={polygonCoords}
              fillColor={
                activeRegionId === region.id
                  ? `${region.color}99`
                  : `${region.color}44`
              }
              strokeColor={region.color}
              strokeWidth={2}
              tappable={true}
              onPress={() => handleRegionPress(region)}
            />
          ))
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You are here"
            pinColor="#007AFF"
          />
        )}
      </MapView>

      {/* ← moved outside MapView */}
      {locationLoading && (
        <View style={styles.locationLoadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {/* Region label overlay */}
      {activeRegionId && (
        <View style={[styles.regionLabel, { backgroundColor: theme.card }]}>
          <Text style={[styles.regionLabelText, { color: theme.text }]}>
            📍 You are in the {USFWS_REGIONS.find((r: any) => r.id === activeRegionId)?.name} region
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

      {/* Fish Detail Modal */}
      <Modal
        visible={fishDetailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFishDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedFish?.fishName}
              </Text>
              <Pressable onPress={() => setFishDetailVisible(false)}>
                <Text style={{ color: theme.subtext, fontSize: 16 }}>Close</Text>
              </Pressable>
            </View>

            {/* Caught badge */}
            {selectedFish?.isCaught && (
              <View style={styles.caughtBadgeContainer}>
                <Text style={styles.caughtBadgeText}>✓ Caught</Text>
              </View>
            )}

            {/* Fish emoji */}
            <Text style={styles.fishDetailEmoji}>🐟</Text>

            {/* Habitat */}
            <View style={[styles.detailSection, { borderBottomColor: theme.border }]}>
              <Text style={[styles.detailLabel, { color: theme.subtext }]}>HABITAT</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {selectedFish?.habitat || 'Unknown'}
              </Text>
            </View>

            {/* Description */}
            <View style={[styles.detailSection, { borderBottomColor: theme.border }]}>
              <Text style={[styles.detailLabel, { color: theme.subtext }]}>DESCRIPTION</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {selectedFish?.description || 'No description available'}
              </Text>
            </View>
          </ScrollView>
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
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },  fishCount:       { fontSize: 14, marginBottom: 16 },
  fishList:        { paddingBottom: 20 },
  fishCard:        { borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1 },
  fishCardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  fishName:        { fontSize: 16, fontWeight: 'bold' },
  caughtBadge:     { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  fishHabitat:     { fontSize: 12, marginBottom: 4 },
  fishDescription: { fontSize: 13 },
  locationLoadingOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)'  //slight dim while loading
  },
  fishDetailEmoji:      { fontSize: 80, textAlign: 'center', marginVertical: 20 },
  caughtBadgeContainer: { backgroundColor: '#e8f5e9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  caughtBadgeText:      { color: '#4CAF50', fontWeight: '600', fontSize: 14 },
  detailSection:        { paddingVertical: 14, borderBottomWidth: 1, marginBottom: 4 },
  detailLabel:          { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  detailValue:          { fontSize: 16 },
  modalTitle:           { fontSize: 22, fontWeight: 'bold', flex: 1 },

});