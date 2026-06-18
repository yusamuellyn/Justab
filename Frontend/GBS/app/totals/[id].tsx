import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiUrl } from '@/utils/api';

type TotalsResponse = {
  totals: { user: string; owes: number }[];
  unclaimed: number;
  tax: number;
  tip: number;
};

export default function Totals() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<TotalsResponse | null>(null);

  const getTotals = async () => {
    if (!id) return;
    const response = await fetch(`${getApiUrl()}/displayTotals?partyID=${id}`);
    setData(await response.json());
  };

  useEffect(() => {
    getTotals();
    const interval = setInterval(getTotals, 3000);
    return () => clearInterval(interval);
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Who Owes What</Text>
      </View>

      <View style={styles.card}>
        {data?.totals.map((person) => (
          <View key={person.user} style={styles.row}>
            <Text style={styles.itemName}>{person.user}</Text>
            <Text style={styles.itemPrice}>${person.owes.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {data && data.unclaimed > 0 && (
        <Text style={styles.warning}>
          ${data.unclaimed.toFixed(2)} in items hasn't been claimed by anyone yet
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDEDED', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { paddingRight: 12 },
  backIcon: { fontSize: 34, color: '#111', lineHeight: 34 },
  title: { flex: 1, fontSize: 24, fontWeight: '700', color: '#111', textAlign: 'center', marginRight: 34 },
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
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  itemName: { fontSize: 15, color: '#333' },
  itemPrice: { fontSize: 15, color: '#333', fontVariant: ['tabular-nums'] },
  warning: { marginTop: 16, fontSize: 13, color: '#B45309', textAlign: 'center' },
});