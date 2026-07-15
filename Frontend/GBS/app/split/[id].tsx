import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getApiUrl, apiHeaders } from '@/utils/api';
import { C, card, primaryBtn, backBtn, screenTitle, rowDivider } from '@/constants/theme';

type Item = {
  name: string;
  price: number;
  claims: string[];
};

export default function Split() {
  const { id, userName, role } = useLocalSearchParams<{ id: string; userName: string; role: string }>();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const isLeader = role === 'Leader';

  const getItems = async () => {
    if (!id) return;
    const response = await fetch(`${getApiUrl()}/displayItems?partyID=${id}`, { headers: apiHeaders() });
    const data = await response.json();
    setItems(data.items || []);
  };

  useEffect(() => {
    getItems();
    const interval = setInterval(getItems, 3000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (isLeader || !id) return;
    const interval = setInterval(async () => {
      const response = await fetch(`${getApiUrl()}/checkStatus?partyID=${id}`, { headers: apiHeaders() });
      const data = await response.json();
      if (data.status === 'totals') {
        clearInterval(interval);
        router.push(`../totals/${id}?userName=${userName}` as any);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id, isLeader]);

  const toggleItem = async (itemIndex: number) => {
    await fetch(
      `${getApiUrl()}/claimItem?itemIndex=${itemIndex}&userName=${userName}&partyID=${id}`,
      { method: 'POST', headers: apiHeaders() }
    );
    getItems();
  };

  const goToTotals = async () => {
    await fetch(`${getApiUrl()}/setStatus?partyID=${id}&status=totals`, { method: 'POST', headers: apiHeaders() });
    router.push(`../totals/${id}?userName=${userName}` as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Split Items</Text>
      </View>

      <View style={styles.card}>
        {items.map((item, index) => {
          const isMine = item.claims.includes(userName as string);
          const isLast = index === items.length - 1;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.row, !isLast && styles.rowBorder, isMine && styles.rowSelected]}
              onPress={() => toggleItem(index)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMine ? 'checkbox' : 'square-outline'}
                size={24}
                color={isMine ? C.deepOcean : C.coolGray}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.claims.length > 0 && (
                  <Text style={styles.claimedBy}>
                    Split with: {item.claims.join(', ')}
                  </Text>
                )}
              </View>
              <Text style={styles.itemPrice}>
                ${item.claims.length > 0
                  ? (item.price / item.claims.length).toFixed(2)
                  : item.price.toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {isLeader ? (
        <TouchableOpacity style={styles.doneButton} onPress={goToTotals}>
          <Text style={styles.doneText}>See Totals</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.waitingText}>Waiting for host to continue…</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.coolGrayBg, padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 6,
  },
  backButton: backBtn,
  backIcon: { fontSize: 28, color: C.deepOcean, lineHeight: 28, marginLeft: -2 },
  title: screenTitle,
  card,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderRadius: 10,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  rowBorder: rowDivider,
  rowSelected: {
    backgroundColor: C.infoBg,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  itemName: { fontSize: 15, color: C.deepOcean, fontWeight: '500' },
  claimedBy: { fontSize: 12, color: C.muted, marginTop: 3 },
  itemPrice: {
    fontSize: 15,
    color: C.deepOcean,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  doneButton: {
    ...primaryBtn,
    marginTop: 16,
  },
  doneText: { color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  waitingText: {
    marginTop: 20,
    textAlign: 'center',
    color: C.muted,
    fontSize: 14,
    fontWeight: '500',
  },
});