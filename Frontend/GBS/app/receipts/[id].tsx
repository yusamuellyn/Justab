import { useLocalSearchParams, useRouter } from "expo-router";
import { getApiUrl } from "@/utils/api";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useEffect, useState} from "react";

const DEEP_OCEAN = '#1E3A5F';
const COOL_GRAY = '#C5CDD6';
const COOL_GRAY_BG = '#E4E9EE';
const WHITE = '#FFFFFF';

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

    const goToSplit = () => { 
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
        if (dataInfo.info.tip != null) {
            setTips(dataInfo.info.tip);
        }
      };
      getInfo();
    }, [id])

    const getMembers = async () => { // 
    if (!partyID) return;
     const response = await fetch(`${getApiUrl()}/displayMembers?partyID=${partyID}`);
     const data = await response.json();
     const memberList = data.members || [];
     setMembers(memberList);
     const leader = memberList.find((m: { partyRole: string }) => m.partyRole === 'Leader');
     if (leader?.user && leader.user !== 'Guest') {
        setUN((current) => current || leader.user);
     }
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


    const removeItem = async (itemName: string) => {
     const response = await fetch(
        `${getApiUrl()}/removeItem?id=${id}&itemName=${encodeURIComponent(itemName)}`,
        { method: 'POST' }
     );
     const data = await response.json();
     setItems(data.items);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Review & Invite</Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
            <View style={styles.card}>
                {items && Object.entries(items).map(([name, price]) => (
                    <View key={name} style={styles.row}>
                        <Text style={styles.itemName}>{name}</Text>
                        <Text style={styles.itemPrice}>${Number(price).toFixed(2)}</Text>

                        <TouchableOpacity onPress={() => removeItem(name)}>
                         <Text style={{ color: 'red' }}>✕</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {tip != null && (
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.itemName}>Tip</Text>
                        <Text style={styles.itemPrice}>{Number(tip)}%</Text>
                    </View>
                </View>
            )}
            
            
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.itemName}> Party Code (If Necessary): {joinCode}</Text>
                </View>
            </View>
            
             <View style={styles.card}>
                <Text style={styles.fieldLabel}>Name</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setNewItem}
                        value={newItem}
                        placeholder="Enter item name"
                        placeholderTextColor={COOL_GRAY}
                    />

                <Text style={styles.fieldLabel}>Price</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setNewPrice}
                        value={newPrice}
                        placeholder="0.00"
                        placeholderTextColor={COOL_GRAY}
                        keyboardType="decimal-pad"
                    />
                    
                    <TouchableOpacity style={styles.actionButton} onPress={addItem}>
                        <Text style={styles.actionButtonText}>Add Item </Text>
                    </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.fieldLabel}>Username</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setUN}
                        value={userName}
                        placeholder="Enter username"
                        placeholderTextColor={COOL_GRAY}
                    />
                    
                    <TouchableOpacity style={styles.actionButton} onPress={updateUsername}>
                        <Text style={styles.actionButtonText}>Confirm </Text>
                    </TouchableOpacity>
            </View>

            {partyID ? (
                <View style={styles.card}>
                    <Text style={styles.fieldLabel}>Party Members</Text>
                    {[...members]
                        .sort((a, b) => {
                            if (a.partyRole === 'Leader') return -1;
                            if (b.partyRole === 'Leader') return 1;
                            return 0;
                        })
                        .map((member, index) => (
                        <View key={index} style={styles.memberRow}>
                            <Text style={styles.itemName}>{member.user}</Text>
                            <Text style={styles.memberRole}>{member.partyRole}</Text>
                        </View>
                    ))}
                </View>
            ) : null}

            <TouchableOpacity style={styles.splitButton} onPress={goToSplit}>
                <Text style={styles.splitButtonText}>Split Items</Text>
            </TouchableOpacity>
            </ScrollView>
                
            
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COOL_GRAY_BG },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 32 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 24,
        paddingTop: 8,
    },
    backButton: { paddingRight: 12 },
    backIcon: { fontSize: 34, color: DEEP_OCEAN, lineHeight: 34 },
    title: { flex: 1, fontSize: 24, fontWeight: '700', color: DEEP_OCEAN, textAlign: 'center', marginRight: 34 },
    card: {
        backgroundColor: WHITE,
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COOL_GRAY,
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
    borderColor: COOL_GRAY,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 12,
    backgroundColor: WHITE,
    color: DEEP_OCEAN,
    fontSize: 15,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B7D',
    marginBottom: 6,
  },
  
  displayText: {
    fontSize: 18,
  },

  itemName: { fontSize: 15, color: DEEP_OCEAN, flex: 1 },
  itemPrice: { fontSize: 15, color: DEEP_OCEAN, fontVariant: ['tabular-nums'], fontWeight: '600' },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COOL_GRAY,
  },
  memberRole: {
    fontSize: 13,
    color: '#5A6B7D',
    fontWeight: '600',
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: COOL_GRAY_BG,
    borderWidth: 1,
    borderColor: COOL_GRAY,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    color: DEEP_OCEAN,
    fontWeight: '600',
    fontSize: 15,
  },
  splitButton: {
    marginTop: 16,
    backgroundColor: DEEP_OCEAN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  splitButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});
