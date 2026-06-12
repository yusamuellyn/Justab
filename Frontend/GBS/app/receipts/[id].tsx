import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function Receipt() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [items, setItems] = useState<any>(null);
    const [joinCode, setJoinCode] = useState<string>('');
    const [tip, setTips] = useState<any>(null);
    const [userName, setUN] = useState('');

    const createParty = async () => {
    const response = await fetch(`${getApiUrl()}/createParty?userName=${userName}`, {
    //   const response = await fetch(`${getApiUrl()}/createParty?userName=Default`, {
        method: 'POST',
        });
        const data = await response.json();
        router.push('/party');
    };

    useEffect(() => {
      const getInfo = async () => {
  
        const getReceiptInfo = await fetch(`${getApiUrl()}/receipt-info?id=${id}`, {
            method: 'GET',
        })

        const dataInfo = await getReceiptInfo.json();

        if (!getReceiptInfo.ok) {
            throw new Error(`GET info failed ${getReceiptInfo.status}`);
        }
        setItems(dataInfo.info.items);
        // setItems(dataInfo.info.data[0].items);
        setJoinCode(dataInfo.info.partyJoinCode);
      };
      getInfo();
    }, [id])

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Review & Invite</Text>
            </View>
            <View style={styles.card}>
                {items && Object.entries(items).map(([name, price]) => (
                    <View key={name} style={styles.row}>
                        <Text style={styles.itemName}>{name}</Text>
                        <Text style={styles.itemPrice}>${Number(price).toFixed(2)}</Text>
                    </View>
                ))}
            </View>

            {tip != null && (
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.itemName}>Tip</Text>
                        <Text style={styles.itemPrice}>${Number(tip).toFixed(2)}</Text>
                    </View>
                </View>
            )}
            
            
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.itemName}> Party Code (If Necessary): {joinCode}</Text>
                    <TouchableOpacity onPress={createParty}>
                        <Text>Create Party</Text>
                    </TouchableOpacity>
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