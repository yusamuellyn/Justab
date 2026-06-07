import { useLocalSearchParams, useRouter } from "expo-router";
import { getApiUrl } from "@/utils/api";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {useEffect, useState} from "react";

export default function Receipt() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [items, setItems] = useState<any>(null);
    const [tip, setTips] = useState<any>(null);
    
    useEffect(() => {
      const getInfo = async () => {
        const getReceiptInfo = await fetch(`${getApiUrl()}/receipt-info?id=${id}`, {
            method: 'GET',
        })

        const dataInfo = await getReceiptInfo.json();

        if (!getReceiptInfo.ok) {
            throw new Error(`GET info failed ${getReceiptInfo.status}`);
        }
        console.log(dataInfo);
        setItems(dataInfo.info.items);
        setTips(dataInfo.info.tip);
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
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    itemName: { fontSize: 15, color: '#333', flex: 1 },
    itemPrice: { fontSize: 15, color: '#333', fontVariant: ['tabular-nums'] },
});