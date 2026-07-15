import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiUrl, apiHeaders } from '@/utils/api';
import { C, card, cardInfo, backBtn, fieldLabel, screenTitle, rowDivider } from '@/constants/theme';

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
          {data?.totals.map((person, index, arr) => (
            <View key={person.user} style={[styles.row, index < arr.length - 1 && styles.rowBorder]}>
              <Text style={styles.itemName}>{person.user}</Text>
              <Text style={styles.itemPrice}>${person.owes.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {data && data.unclaimed > 0 && (
          <View style={styles.warningCard}>
            <Text style={styles.warning}>
              ${data.unclaimed.toFixed(2)} in items has not been claimed by anyone yet
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.coolGrayBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  backButton: backBtn,
  backIcon: { fontSize: 28, color: C.deepOcean, lineHeight: 28, marginLeft: -2 },
  title: screenTitle,
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },
  card,
  fieldLabel,
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowBorder: rowDivider,
  itemName: { fontSize: 15, color: C.deepOcean, flex: 1, fontWeight: '500' },
  itemPrice: {
    fontSize: 16,
    color: C.deepOcean,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
  warningCard: {
    ...cardInfo,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  warning: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
