import { useTheme } from '@/context/theme';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const { theme } = useTheme();

  const fishData = [
    { id: '1', name: 'Largemouth Bass' },
    { id: '2', name: 'Rainbow Trout' },
    { id: '3', name: 'Northern Pike' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Your FishDex</Text>
      <FlatList
        data={fishData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.fishItem, { borderBottomColor: theme.border }]}>
            <Text style={[styles.fishName, { color: theme.text }]}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  fishItem: { padding: 15, borderBottomWidth: 1 },
  fishName: { fontSize: 18 },
});