import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN = '#22C55E';

export default function Split() {
    const { items: itemsParam } = useLocalSearchParams();
    const router = useRouter();
    
    const items: string[] = JSON.parse([itemsParam].flat()[0] ?? "[]");
    
    const [checked, setChecked] = useState<boolean[]>(items.map(() => false));
    
    const toggleItem = (index: number) =>
      setChecked((prev) => prev.map((val, i) => (i === index ? !val : val)));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Split Items</Text>
      </View>

      <View style={styles.card}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.row}
            onPress={() => toggleItem(index)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={checked[index] ? 'checkbox' : 'square-outline'}
              size={24}
              color={checked[index] ? GREEN : '#999'}
            />
            <Text style={styles.itemName}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEDED', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: { paddingRight: 12 },
  backIcon: { fontSize: 34, color: '#111', lineHeight: 34 },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginRight: 34,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  itemName: { fontSize: 15, color: '#333', flex: 1 },
});
