// Imports From Other Files
import { useLocalSearchParams, useRouter } from "expo-router";  // This and const allow connection to button
import { getApiUrl } from "@/utils/api";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useEffect, useState} from "react";



export default function Party() {
  const router = useRouter();
  const [codeInput, setCI] = useState('');

  return (
     <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Join A Party</Text>
        </View>

         <View style={styles.card}>
                <View style={styles.row}>
                 <Text style={styles.itemName}> Enter Party Code: </Text>
                 <TextInput
                    style={styles.input}
                    onChangeText={setCI}
                    value={codeInput}
                    />
                </View>
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },

     input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  
  displayText: {
    fontSize: 18,
  },

  itemName: { fontSize: 15, color: '#333', flex: 1 },
  itemPrice: { fontSize: 15, color: '#333', fontVariant: ['tabular-nums'] },
});