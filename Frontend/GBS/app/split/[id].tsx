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
import { getApiUrl } from '@/utils/api';

const DEEP_OCEAN = '#1E3A5F';
const COOL_GRAY = '#C5CDD6';
const COOL_GRAY_BG = '#E4E9EE';
const WHITE = '#FFFFFF';

type Item = {
  name: string;
  price: number;
  claims: string[];
};

export default function Split() {
  const { id, userName } = useLocalSearchParams<{ id: string; userName: string }>();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);

  const getItems = async () => {
    if (!id) return;
    const response = await fetch(`${getApiUrl()}/displayItems?partyID=${id}`);
    const data = await response.json();
    setItems(data.items || []);
  };

  useEffect(() => {
    getItems();
    const interval = setInterval(getItems, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const toggleItem = async (itemIndex: number) => {
    await fetch(
      `${getApiUrl()}/claimItem?itemIndex=${itemIndex}&userName=${userName}&partyID=${id}`,
      { method: 'POST' }
    );
    getItems();
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
          return (
            <TouchableOpacity
              key={index}
              style={styles.row}
              onPress={() => toggleItem(index)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isMine ? 'checkbox' : 'square-outline'}
                size={24}
                color={isMine ? DEEP_OCEAN : COOL_GRAY}
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
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => router.push(`../totals/${id}?userName=${userName}`)}
      >
        <Text style={styles.doneText}>See Totals</Text>
    </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COOL_GRAY_BG, padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
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
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COOL_GRAY,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  itemName: { fontSize: 15, color: DEEP_OCEAN },
  claimedBy: { fontSize: 12, color: '#5A6B7D', marginTop: 2 },
  itemPrice: {
    fontSize: 15,
    color: DEEP_OCEAN,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  doneButton: {
    backgroundColor: DEEP_OCEAN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  doneText: { color: WHITE, fontSize: 16, fontWeight: '600' },
});