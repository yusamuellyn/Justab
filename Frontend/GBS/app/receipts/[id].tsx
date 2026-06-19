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

    
    const [newPrice, setNewPrice] = useState('');
    const [newItem, setNewItem] = useState('');

    const [partyID, setPartyID] = useState<string>('');

    const [members, setMembers] = useState<any[]>([]);

    const goToSplit = () => { // DEAL WITH NOT CONNECTING TO BACKEND LATER. THEN OCR FRIDAY.
      if (!items || !userName) return;
        router.push(`/split/${partyID}?userName=${userName}` as any);
    };

    // const goToSplit = () => {
    //     if (!items) return;

    //     const itemList = Object.entries(items).map(
    //         ([name, price]) => `${name} - $${Number(price).toFixed(2)}`
    //     );

    //     router.push({
    //         pathname: `/split/${id}` as any,
    //         params: { items: JSON.stringify(itemList) },
    //     });
    // };

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
        setPartyID(dataInfo.info.partyID);
      };
      getInfo();
    }, [id])

    const getMembers = async () => { // 
    if (!partyID) return;
     const response = await fetch(`${getApiUrl()}/displayMembers?partyID=${partyID}`);
     const data = await response.json();
     setMembers(data.members || []);
    };

    useEffect(() => { // 
    getMembers();
    }, [partyID]);

    const updateUsername = async () => { // 
     if (!userName) return;
     await fetch(`${getApiUrl()}/updateLeaderName?partyID=${partyID}&userName=${userName}`, {
        method: 'POST',
    });
    await getMembers();
    };

    useEffect(() => { // Understand ASAP. Updating Members Live Thing.
     if (!partyID) return;
      const interval = setInterval(getMembers, 5000);
     return () => clearInterval(interval);
    }, [partyID]);


    const addItem = async () => {
        if (!newItem || !newPrice) return;
         const response = await fetch(
            `${getApiUrl()}/manualAdd?id=${id}&itemName=${encodeURIComponent(newItem)}&itemPrice=${encodeURIComponent(newPrice)}`,
            { method: 'POST' }
        );
        
        const data = await response.json();
        setItems(data.items);
        setNewItem('');
        setNewPrice('');
    };

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
                </View>
            </View>
            
             <View style={styles.card}>
            
                <Text style={styles.itemName}>Enter New Item Name:</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setNewItem}
                        value={newItem}
                    />

                <Text style={styles.itemName}>Enter New Item Price:</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setNewPrice}
                        value={newPrice}
                    />
                    
                    <TouchableOpacity onPress={addItem}>
                        <Text>Add Item </Text>
                    </TouchableOpacity>
            </View>

            <View style={styles.card}>
             <View style={styles.row}>
                <Text style={styles.itemName}>Enter Username:</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setUN}
                        value={userName}
                    />
                    
                    <TouchableOpacity onPress={updateUsername}>
                        <Text>Confirm </Text>
                    </TouchableOpacity>
             </View>
            </View>


            <TouchableOpacity style={styles.splitButton} onPress={goToSplit}>
                <Text style={styles.splitButtonText}>Split Items</Text>
            </TouchableOpacity>

            {members.map((member, index) => (
                <View key={index} style={styles.row}>
                    <Text style={styles.itemName}>{member.user}</Text>
                    <Text style={styles.itemPrice}>{member.partyRole}</Text>
                </View>
            ))}
                
            
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
  splitButton: {
    marginTop: 16,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  splitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});