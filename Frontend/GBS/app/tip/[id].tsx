import { useLocalSearchParams, useRouter } from 'expo-router';
import { getApiUrl } from '@/utils/api';
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Tip(){
    const {id} = useLocalSearchParams();
    const router = useRouter();
    const [selectedValue, setSelectedValue] = useState('');

    const confirmTip = async () => {
        const uploadTip = await fetch(`${getApiUrl()}/add-tip?tip=${Number(selectedValue)}&id=${Number(id)}`, {
        method: 'POST',
});
        // const uploadTip = await fetch(`${getApiUrl()}/add-tip?tip=${Number(selectedValue)}&id=${id}`, {
        //     method: 'POST',
        // });
        
        if(!uploadTip.ok){
            throw new Error(`POST tip failed ${uploadTip.status}`);
        }
        router.push(`../receipts/${id}` as any);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>Enter Tip Amount</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={selectedValue}
                    onChangeText={(text) => setSelectedValue(text)}
                    placeholder="0"
                    placeholderTextColor="#aaa"
                />
                <TouchableOpacity style={styles.confirmButton} onPress={confirmTip}>
                    <Text style={styles.confirmText}>Confirm Tip</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    backButton: {
        padding: 8,
    },
    backIcon: {
        fontSize: 34,
        color: '#111',
        lineHeight: 34,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: 24,
        color: '#111',
    },
    input: {
        width: 120,
        height: 60,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 28,
        marginBottom: 32,
        backgroundColor: '#fff',
        color: '#111',
    },
    confirmButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 12,
    },
    confirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});