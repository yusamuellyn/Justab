import { useLocalSearchParams, useRouter } from 'expo-router';
import { getApiUrl, apiHeaders } from '@/utils/api';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { C, card, primaryBtn, backBtn } from '@/constants/theme';

export default function Tip() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [selectedValue, setSelectedValue] = useState('');

  useFocusEffect(
    useCallback(() => {
      const loadTip = async () => {
        const response = await fetch(`${getApiUrl()}/receipt-info?partyID=${id}`, {
          method: 'GET',
          headers: apiHeaders(),
        });
        const data = await response.json();
        if (response.ok && data.info.tip != null) {
          setSelectedValue(String(data.info.tip));
        }
      };
      loadTip();
    }, [id])
  );

  const confirmTip = async () => {
    const uploadTip = await fetch(
      `${getApiUrl()}/add-tip?tip=${Number(selectedValue)}&partyID=${id}`,
      { method: 'POST', headers: apiHeaders() }
    );

    if (!uploadTip.ok) {
      throw new Error(`POST tip failed ${uploadTip.status}`);
    }

    router.push(`../receipts/${id}` as any);
  };

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setSelectedValue(cleaned);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Enter Tip Percent</Text>
          <Text style={styles.subtitle}>Choose how much you want to tip on the subtotal. If tip is already included please enter 0. </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={selectedValue}
              onChangeText={handleChange}
              placeholder="0"
              placeholderTextColor={C.coolGray}
              maxLength={5}
            />
            <Text style={styles.percentSign}>%</Text>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={confirmTip}>
            <Text style={styles.confirmText}>Confirm Tip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.coolGrayBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  backButton: backBtn,
  backIcon: {
    fontSize: 28,
    color: C.deepOcean,
    lineHeight: 28,
    marginLeft: -2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  card: {
    ...card,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    color: C.deepOcean,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 21,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  input: {
    width: 100,
    height: 68,
    borderWidth: 1,
    borderColor: C.coolGrayLight,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '700',
    backgroundColor: C.coolGrayBg,
    color: C.deepOcean,
    letterSpacing: -1,
  },
  percentSign: {
    fontSize: 30,
    fontWeight: '600',
    color: C.muted,
    marginLeft: 8,
  },
  confirmButton: primaryBtn,
  confirmText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
