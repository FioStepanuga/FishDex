import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { authFetch } from '@/utils/api';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const REGIONS = [
  { id: 1, name: 'Northeast' },
  { id: 2, name: 'Southeast' },
  { id: 3, name: 'Midwest' },
  { id: 4, name: 'Southwest' },
  { id: 5, name: 'Mountain-Prairie' },
  { id: 6, name: 'Pacific' },
  { id: 7, name: 'Alaska' },
  { id: 8, name: 'Pacific Southwest' },
];

type Progress = {
  total: number;
  caught: number;
};

type FishEntry = {
  fishId: number;
  fishName: string;
  habitat: string;
  description: string;
  isCaught: boolean;
  regions: string[];
};

type RegionProgress = {
  [regionId: number]: Progress;
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { token, clearAuthState } = useAuth();

  const [overallProgress, setOverallProgress] = useState<Progress | null>(null);
  const [fishDex, setFishDex] = useState<FishEntry[]>([]);
  const [fishDexExpanded, setFishDexExpanded] = useState(false);
  const [selectedFish, setSelectedFish] = useState<FishEntry | null>(null);
  const [fishModalVisible, setFishModalVisible] = useState(false);
  const [usExpanded, setUsExpanded] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState<number[]>([]);
  const [regionProgress, setRegionProgress] = useState<RegionProgress>({});
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [loadingFishDex, setLoadingFishDex] = useState(true);

  useEffect(() => {
    fetchOverallProgress();
    fetchFishDex();
  }, []);

  const fetchOverallProgress = async () => {
    setLoadingProgress(true);
    try {
      const response = await authFetch(
        '/api/Explore/progress',
        token,
        { method: 'GET' },
        async () => { await clearAuthState(); router.replace('/login'); }
      );
      if (response.ok) {
        const data = await response.json();
        setOverallProgress(data);
      }
    } catch (error) {
      console.log('Progress error:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const fetchFishDex = async () => {
    setLoadingFishDex(true);
    try {
      const response = await authFetch(
        '/api/Explore/fishdex',
        token,
        { method: 'GET' },
        async () => { await clearAuthState(); router.replace('/login'); }
      );
      if (response.ok) {
        const data = await response.json();
        setFishDex(data);
      }
    } catch (error) {
      console.log('FishDex error:', error);
    } finally {
      setLoadingFishDex(false);
    }
  };

  const fetchRegionProgress = async (regionId: number) => {
    if (regionProgress[regionId]) return;
    try {
      const response = await authFetch(
        `/api/Explore/progress/region/${regionId}`,
        token,
        { method: 'GET' },
        async () => { await clearAuthState(); router.replace('/login'); }
      );
      if (response.ok) {
        const data = await response.json();
        setRegionProgress(prev => ({ ...prev, [regionId]: data }));
      }
    } catch (error) {
      console.log('Region progress error:', error);
    }
};

  const toggleRegion = (regionId: number) => {
    if (expandedRegions.includes(regionId)) {
      setExpandedRegions(prev => prev.filter(id => id !== regionId));
    } else {
      setExpandedRegions(prev => [...prev, regionId]);
      fetchRegionProgress(regionId);
    }
  };

  const ProgressBar = ({ caught, total }: { caught: number; total: number }) => {
    const percentage = total > 0 ? caught / total : 0;
    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${percentage * 100}%`, backgroundColor: '#007AFF' }]} />
      </View>
    );
  };

const getPaddedFishDex = () => {
  const remainder = fishDex.length % 3;
  if (remainder === 0) return fishDex;
  
  const emptySlots = 3 - remainder;
  const placeholders = Array.from({ length: emptySlots }, (_, i) => ({
    fishId: -i - 1,  // negative IDs so they don't conflict
    fishName: '',
    habitat: '',
    description: '',
    isCaught: false,
    regions: [],
    isPlaceholder: true
  }));
  
  return [...fishDex, ...placeholders];
};

  const renderFishCard = ({ item }: { item: any }) => {
    if (item.isPlaceholder) {
      return <View style={styles.fishCardPlaceholder} />;  // ← separate style
    }

    return (
      <Pressable
        style={[
          styles.fishCard,
          {
            backgroundColor: item.isCaught ? theme.card : theme.background,
            borderColor: item.isCaught ? '#007AFF' : theme.border,
            opacity: item.isCaught ? 1 : 0.5,
          }
        ]}
        onPress={() => {
          setSelectedFish(item);
          setFishModalVisible(true);
        }}
      >
        <Text style={styles.fishEmoji}>
          {item.isCaught ? '🐟' : '❓'}
        </Text>
        <Text
          style={[styles.fishCardName, { color: item.isCaught ? theme.text : theme.subtext }]}
          numberOfLines={2}
        >
          {item.isCaught ? item.fishName : '???'}
        </Text>
        {item.isCaught && <View style={styles.caughtDot} />}
      </Pressable>
    );
};

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Your FishDex</Text>

      {/* Overall Progress */}
      {loadingProgress ? (
        <ActivityIndicator color="#007AFF" style={{ marginTop: 20 }} />
      ) : overallProgress && (
        <View style={[styles.overallCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.overallTitle, { color: theme.text }]}>Overall Progress</Text>
          <Text style={[styles.overallCount, { color: theme.subtext }]}>
            {overallProgress.caught} / {overallProgress.total} species caught
          </Text>
          <ProgressBar caught={overallProgress.caught} total={overallProgress.total} />
        </View>
      )}

      {/* FishDex Section */}
      <Pressable
        style={[styles.fishDexHeader, { backgroundColor: '#007AFF' }]}
        onPress={() => setFishDexExpanded(!fishDexExpanded)}
      >
        <View>
          <Text style={styles.fishDexTitle}>🐟 FishDex</Text>
          <Text style={styles.fishDexSubtitle}>
            {overallProgress ? `${overallProgress.caught}/${overallProgress.total} species unlocked` : 'Loading...'}
          </Text>
        </View>
        <Text style={styles.fishDexChevron}>{fishDexExpanded ? '▲' : '▼'}</Text>
      </Pressable>

      {/* FishDex Grid */}
      {fishDexExpanded && fishDex.length > 0 && (
        <View style={[styles.fishDexContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {loadingFishDex ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ margin: 20 }} />
          ) : (
            <FlatList
              data={fishDex}
              keyExtractor={(item) => item.fishId.toString()}
              renderItem={renderFishCard}
              numColumns={3}
              scrollEnabled={false}  // ← outer ScrollView handles scrolling
              contentContainerStyle={styles.fishGrid}
            />
          )}
        </View>
      )}

      {/* United States Dropdown */}
      <Pressable
        style={[styles.countryRow, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => setUsExpanded(!usExpanded)}
      >
        <Text style={[styles.countryName, { color: theme.text }]}>🇺🇸 United States</Text>
        <Text style={[styles.chevron, { color: theme.subtext }]}>{usExpanded ? '▲' : '▼'}</Text>
      </Pressable>

      {/* Regions List */}
      {usExpanded && (
        <View style={[styles.regionsContainer, { borderColor: theme.border }]}>
          {REGIONS.map(region => (
            <View key={region.id}>
              <Pressable
                style={[styles.regionRow, { borderBottomColor: theme.border }]}
                onPress={() => toggleRegion(region.id)}
              >
                <Text style={[styles.regionName, { color: theme.text }]}>{region.name}</Text>
                <View style={styles.regionRight}>
                  {regionProgress[region.id] && (
                    <Text style={[styles.regionCount, { color: theme.subtext }]}>
                      {regionProgress[region.id].caught}/{regionProgress[region.id].total}
                    </Text>
                  )}
                  <Text style={[styles.chevron, { color: theme.subtext }]}>
                    {expandedRegions.includes(region.id) ? '▲' : '▼'}
                  </Text>
                </View>
              </Pressable>

              {expandedRegions.includes(region.id) && (
                <View style={[styles.regionDetail, { backgroundColor: theme.background }]}>
                  {regionProgress[region.id] ? (
                    <>
                      <Text style={[styles.regionDetailText, { color: theme.subtext }]}>
                        {regionProgress[region.id].caught} of {regionProgress[region.id].total} species caught
                      </Text>
                      <ProgressBar
                        caught={regionProgress[region.id].caught}
                        total={regionProgress[region.id].total}
                      />
                    </>
                  ) : (
                    <ActivityIndicator size="small" color="#007AFF" />
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Fish Detail Modal */}
      <Modal
        visible={fishModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFishModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedFish?.isCaught ? selectedFish.fishName : '???'}
              </Text>
              <Pressable onPress={() => setFishModalVisible(false)}>
                <Text style={{ color: theme.subtext, fontSize: 16 }}>Close</Text>
              </Pressable>
            </View>

            {selectedFish?.isCaught ? (
              <>
                {/* Caught badge */}
                <View style={styles.caughtBadge}>
                  <Text style={styles.caughtBadgeText}>✓ Caught</Text>
                </View>

                {/* Fish emoji */}
                <Text style={styles.modalEmoji}>🐟</Text>

                {/* Habitat */}
                <View style={[styles.detailSection, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.subtext }]}>Habitat</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedFish.habitat}</Text>
                </View>

                {/* Description */}
                <View style={[styles.detailSection, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.subtext }]}>Description</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedFish.description}</Text>
                </View>

                {/* Regions */}
                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: theme.subtext }]}>Found In</Text>
                  <View style={styles.regionTags}>
                    {selectedFish.regions.map((region, index) => (
                      <View key={index} style={[styles.regionTag, { backgroundColor: theme.background }]}>
                        <Text style={[styles.regionTagText, { color: theme.text }]}>{region}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              /* Locked state */
              <View style={styles.lockedContainer}>
                <Text style={styles.lockedEmoji}>🔒</Text>
                <Text style={[styles.lockedTitle, { color: theme.text }]}>Not Yet Caught</Text>
                <Text style={[styles.lockedSubtitle, { color: theme.subtext }]}>
                  Identify this fish using the camera to unlock its entry!
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, padding: 15 },
  title:                { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  overallCard:          { borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1 },
  overallTitle:         { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  overallCount:         { fontSize: 14, marginBottom: 10 },
  progressBarContainer: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' },
  progressBarFill:      { height: '100%', borderRadius: 5 },

  // FishDex
  fishDexHeader:        { borderRadius: 12, padding: 20, marginBottom: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fishDexTitle:         { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  fishDexSubtitle:      { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  fishDexChevron:       { fontSize: 18, color: '#fff' },
  fishDexContainer:     { borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginBottom: 20 },
  fishGrid:             { padding: 10 },
  fishCard:             { width: '30%', margin: 5, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: 'center', aspectRatio: 0.85 },
  fishCardPlaceholder: { width: '30%', margin: '1.5%', aspectRatio: 0.85, opacity: 0 },
  fishEmoji:            { fontSize: 32, marginBottom: 6 },
  fishCardName:         { fontSize: 11, textAlign: 'center', fontWeight: '500' },
  caughtDot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007AFF', marginTop: 4 },

  // Country/Region dropdowns
  countryRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  countryName:          { fontSize: 16, fontWeight: '600' },
  chevron:              { fontSize: 14 },
  regionsContainer:     { borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  regionRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  regionName:           { fontSize: 15 },
  regionRight:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  regionCount:          { fontSize: 13 },
  regionDetail:         { padding: 14 },
  regionDetailText:     { fontSize: 13, marginBottom: 8 },

  // Fish Modal
  modalOverlay:         { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent:         { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:           { fontSize: 22, fontWeight: 'bold', flex: 1 },
  modalEmoji:           { fontSize: 80, textAlign: 'center', marginVertical: 20 },
  caughtBadge:          { backgroundColor: '#e8f5e9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  caughtBadgeText:      { color: '#4CAF50', fontWeight: '600', fontSize: 14 },
  detailSection:        { paddingVertical: 14, borderBottomWidth: 1, marginBottom: 4 },
  detailLabel:          { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  detailValue:          { fontSize: 16 },
  regionTags:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  regionTag:            { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  regionTagText:        { fontSize: 13 },

  // Locked state
  lockedContainer:      { alignItems: 'center', padding: 40 },
  lockedEmoji:          { fontSize: 60, marginBottom: 16 },
  lockedTitle:          { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  lockedSubtitle:       { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});