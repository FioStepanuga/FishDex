import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

type RegionProgress = {
  [regionId: number]: Progress;
};

export default function HomeScreen() {
  const { token } = useAuth();
  const { theme } = useTheme();

  const [overallProgress, setOverallProgress] = useState<Progress | null>(null);
  const [usExpanded, setUsExpanded] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState<number[]>([]);
  const [regionProgress, setRegionProgress] = useState<RegionProgress>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverallProgress();
  }, []);

  const fetchOverallProgress = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Explore/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOverallProgress(data);
      }
    } catch (error) {
      console.log('Progress error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegionProgress = async (regionId: number) => {
    if (regionProgress[regionId]) return; // already fetched
    try {
      const response = await fetch(`${API_URL}/api/Explore/progress/region/${regionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
        <View style={[styles.progressBarFill, { width: `${percentage * 100}%`, backgroundColor: theme.primary }]} />
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Your FishDex</Text>

      {/* Overall Progress */}
      {loading ? (
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
              {/* Region Row */}
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

              {/* Region Progress */}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, padding: 20 },
  title:              { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  overallCard:        { borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1 },
  overallTitle:       { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  overallCount:       { fontSize: 14, marginBottom: 10 },
  progressBarContainer: { height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' },
  progressBarFill:    { height: '100%', borderRadius: 5 },
  countryRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  countryName:        { fontSize: 16, fontWeight: '600' },
  chevron:            { fontSize: 14 },
  regionsContainer:   { borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  regionRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  regionName:         { fontSize: 15 },
  regionRight:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  regionCount:        { fontSize: 13 },
  regionDetail:       { padding: 14 },
  regionDetailText:   { fontSize: 13, marginBottom: 8 },
});