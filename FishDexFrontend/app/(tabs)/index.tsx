import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  // Eventually, this will be your fish data from PostgreSQL
  const fishData = [
    { id: '1', name: 'Largemouth Bass' },
    { id: '2', name: 'Rainbow Trout' },
    { id: '3', name: 'Northern Pike' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your FishDex</Text>
      <FlatList
        data={fishData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.fishItem}>
            <Text style={styles.fishName}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  fishItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  fishName: { fontSize: 18 },
});