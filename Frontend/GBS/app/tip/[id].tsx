import { useLocalSearchParams, useRouter } from 'expo-router';
import { getApiUrl } from '@/utils/api';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const DEEP_OCEAN = '#1E3A5F';
const COOL_GRAY = '#C5CDD6';
const COOL_GRAY_BG = '#E4E9EE';
const WHITE = '#FFFFFF';

export default function Tip() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [selectedValue, setSelectedValue] = useState('');
  // Added
  const [isDollar, setIsDollar]         = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [detectedValue, setDetectedValue] = useState<string | null>(null);



  useFocusEffect(
    useCallback(() => {
      const loadTip = async () => {
          const response = await fetch(`${getApiUrl()}/receipt-info?id=${id}`, {
            method: 'GET',
          });
          const data = await response.json();
          if (response.ok) {
            if (data.info.tip != null) {
              setSelectedValue(String(data.info.tip));
              setIsDollar(data.info.tip_is_dollar ?? false);
              setAutoDetected(true);
              setDetectedValue(String(data.info.tip));
            } else if (data.info.tip_detected != null) {
              setSelectedValue(String(data.info.tip_detected));
              setIsDollar(true);
              setAutoDetected(true);
              setDetectedValue(String(data.info.tip_detected));
            }
          }
        // const response = await fetch(`${getApiUrl()}/receipt-info?id=${id}`, {
        //   method: 'GET',
        // });
        // const data = await response.json();
        // if (response.ok && data.info.tip != null) {
        //   setSelectedValue(String(data.info.tip));
        // }
      };
      loadTip();
    }, [id])
  );

  const confirmTip = async () => {
  const uploadTip = await fetch(
    `${getApiUrl()}/add-tip?tip=${Number(selectedValue)}&id=${Number(id)}&is_dollar=${isDollar}`,
    { method: 'POST' }
  );
  if (!uploadTip.ok) {
    throw new Error(`POST tip failed ${uploadTip.status}`);
  }
  router.push(`../receipts/${id}` as any);
 };

  // const confirmTip = async () => {
  //   const uploadTip = await fetch(
  //     `${getApiUrl()}/add-tip?tip=${Number(selectedValue)}&id=${Number(id)}`,
  //     { method: 'POST' }
  //   );

  //   if (!uploadTip.ok) {
  //     throw new Error(`POST tip failed ${uploadTip.status}`);
  //   }

  //   router.push(`../receipts/${id}` as any);
  // };

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setSelectedValue(cleaned);
    setAutoDetected(false); // user is editing — clear the detected label
  };

  // const handleChange = (text: string) => {
  //   const cleaned = text.replace(/[^0-9.]/g, '');
  //   setSelectedValue(cleaned);
  // };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Enter Tip</Text>
          <Text style={styles.subtitle}>
            {isDollar
              ? 'Flat amount split evenly among all members.'
              : 'Percentage split proportionally by what each person ordered.'}
          </Text>

          {autoDetected && (
            <Text style={{ color: '#5A6B7D', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
              {isDollar
                ? `$${detectedValue} tip detected on receipt — confirm or edit`
                : `${detectedValue}% tip detected on receipt — confirm or edit`}
            </Text>
          )}

          {/* % / $ toggle */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: COOL_GRAY_BG,
            borderRadius: 10,
            marginBottom: 20,
            padding: 3,
          }}>
            <TouchableOpacity
              onPress={() => setIsDollar(false)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: !isDollar ? WHITE : 'transparent',
              }}
            >
              <Text style={{ color: DEEP_OCEAN, fontWeight: !isDollar ? '700' : '400' }}>
                Percent %
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsDollar(true)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: isDollar ? WHITE : 'transparent',
              }}
            >
              <Text style={{ color: DEEP_OCEAN, fontWeight: isDollar ? '700' : '400' }}>
                Dollar $
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            {isDollar && <Text style={styles.percentSign}>$</Text>}
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={selectedValue}
              onChangeText={handleChange}
              placeholder="0"
              placeholderTextColor={COOL_GRAY}
              maxLength={6}
            />
            {!isDollar && <Text style={styles.percentSign}>%</Text>}
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={confirmTip}>
            <Text style={styles.confirmText}>Confirm Tip</Text>
          </TouchableOpacity>
        </View>
        {/* <View style={styles.card}>
          <Text style={styles.title}>Enter Tip Percent</Text>
          <Text style={styles.subtitle}>Choose how much you want to tip on the subtotal. If tip is already included please enter 0. </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={selectedValue}
              onChangeText={handleChange}
              placeholder="0"
              placeholderTextColor={COOL_GRAY}
              maxLength={5}
            />
            <Text style={styles.percentSign}>%</Text>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={confirmTip}>
            <Text style={styles.confirmText}>Confirm Tip</Text>
          </TouchableOpacity>
        </View> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COOL_GRAY_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 34,
    color: DEEP_OCEAN,
    lineHeight: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: COOL_GRAY,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: DEEP_OCEAN,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#5A6B7D',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  input: {
    width: 100,
    height: 64,
    borderWidth: 1,
    borderColor: COOL_GRAY,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '600',
    backgroundColor: COOL_GRAY_BG,
    color: DEEP_OCEAN,
  },
  percentSign: {
    fontSize: 32,
    fontWeight: '600',
    color: DEEP_OCEAN,
    marginLeft: 8,
  },
  confirmButton: {
    backgroundColor: DEEP_OCEAN,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});
