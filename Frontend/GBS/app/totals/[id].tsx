import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiUrl, apiHeaders } from '@/utils/api';

const DEEP_OCEAN = '#1E3A5F';
const COOL_GRAY = '#C5CDD6';
const COOL_GRAY_BG = '#E4E9EE';
const WHITE = '#FFFFFF';

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
    const response = await fetch(`${getApiUrl()}/displayTotals?partyID=${id}`, { headers: apiHeaders() });
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Totals</Text>
          {data?.totals.map((person) => (
            <View key={person.user} style={styles.row}>
              <Text style={styles.itemName}>{person.user}</Text>
              <Text style={styles.itemPrice}>${person.owes.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {data && data.unclaimed > 0 && (
          <View style={styles.warningCard}>
            <Text style={styles.warning}>
              ${data.unclaimed.toFixed(2)} in items hasn't been claimed by anyone yet
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COOL_GRAY_BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: { paddingRight: 12 },
  backIcon: { fontSize: 34, color: DEEP_OCEAN, lineHeight: 34 },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: DEEP_OCEAN,
    textAlign: 'center',
    marginRight: 34,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 32 },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COOL_GRAY,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B7D',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COOL_GRAY,
  },
  itemName: { fontSize: 15, color: DEEP_OCEAN, flex: 1 },
  itemPrice: {
    fontSize: 15,
    color: DEEP_OCEAN,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  warningCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COOL_GRAY,
  },
  warning: {
    fontSize: 13,
    color: DEEP_OCEAN,
    textAlign: 'center',
    lineHeight: 20,
  },
});
