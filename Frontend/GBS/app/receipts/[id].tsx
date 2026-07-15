import { useLocalSearchParams, useRouter } from "expo-router";
import { getApiUrl, apiHeaders } from "@/utils/api";
import { SafeAreaView } from 'react-native-safe-area-context';
import {ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Animated} from 'react-native';
import {useEffect, useState, useRef} from "react";
import { C, card, cardInfo, primaryBtn, backBtn, input, fieldLabel, screenTitle, rowDivider } from '@/constants/theme';
import * as Clipboard from 'expo-clipboard';

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
    const [showToast, setShowToast] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const triggerToast = () => {
        setShowToast(true);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        }).start(() => {
        setTimeout(() => {
            Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) setShowToast(false);
            });
        }, 2000);
        });
    };

    const handleShare = async () => {
        const customMessage = `Join my Justab!! Code: ${joinCode}`;

        await Clipboard.setStringAsync(customMessage);
        triggerToast();
    };

    const goToSplit = async () => {
      if (!items || !userName) return;
        await fetch(`${getApiUrl()}/setStatus?partyID=${partyID}&status=splitting`, { method: 'POST', headers: apiHeaders() });
        router.push(`/split/${partyID}?userName=${userName}&role=Leader` as any);
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
  
        const getReceiptInfo = await fetch(`${getApiUrl()}/receipt-info?partyID=${id}`, {
            method: 'GET',
            headers: apiHeaders(),
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
     const response = await fetch(`${getApiUrl()}/displayMembers?partyID=${partyID}`, { headers: apiHeaders() });
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
        headers: apiHeaders(),
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
            `${getApiUrl()}/manualAdd?partyID=${id}&itemName=${encodeURIComponent(newItem)}&itemPrice=${encodeURIComponent(newPrice)}`,
            { method: 'POST', headers: apiHeaders() }
        );
        
        const data = await response.json();
        setItems(data.items);
        setNewItem('');
        setNewPrice('');
    };


    const removeItem = async (itemName: string) => {
     const response = await fetch(
        `${getApiUrl()}/removeItem?partyID=${id}&itemName=${encodeURIComponent(itemName)}`,
        { method: 'POST', headers: apiHeaders() }
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
            <View style={styles.cardInfo}>
                <Text style={styles.disclaimerText}>
                    Items may be incorrectly recognized in early versions, especially with complex receipts. Please re-enter items with any issues.
                </Text>
            </View>

            <View style={styles.card}>
                {items && Object.entries(items).map(([name, price], index, arr) => (
                    <View key={name} style={[styles.row, index < arr.length - 1 && styles.rowBorder]}>
                        <Text style={styles.itemName}>{name}</Text>
                        <Text style={styles.itemPrice}>${Number(price).toFixed(2)}</Text>

                        <TouchableOpacity onPress={() => removeItem(name)} style={styles.removeBtn}>
                         <Text style={styles.removeText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {(tip != null || joinCode) && (
                <View style={styles.card}>
                    {tip != null && (
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Tip</Text>
                            <Text style={styles.metaValue}>{Number(tip)}%</Text>
                        </View>
                    )}
                    {tip != null && joinCode ? <View style={styles.cardDivider} /> : null}
                    {joinCode ? (
                        <>
                            <Text style={styles.fieldLabel}>Party Code (If Necessary)</Text>
                            <Text style={styles.codeValue}>{joinCode}</Text>
                            <TouchableOpacity style={styles.copyButton} onPress={handleShare}>
                                <Text style={styles.copyButtonText}>Copy Invite</Text>
                            </TouchableOpacity>
                            {showToast ? (
                                <Animated.View style={[styles.toast, { opacity: fadeAnim }]} pointerEvents="none">
                                    <Text style={styles.toastText}>Invite Code Copied!</Text>
                                </Animated.View>
                            ) : null}
                        </>
                    ) : null}
                </View>
            )}
            
             <View style={styles.card}>
                <Text style={styles.fieldLabel}>Name</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setNewItem}
                        value={newItem}
                        placeholder="Enter item name"
                        placeholderTextColor={C.coolGray}
                    />

                <Text style={styles.fieldLabel}>Price</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setNewPrice}
                        value={newPrice}
                        placeholder="0.00"
                        placeholderTextColor={C.coolGray}
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
                        placeholderTextColor={C.coolGray}
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
    container: { flex: 1, backgroundColor: C.coolGrayBg },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
        paddingTop: 6,
    },
    backButton: backBtn,
    backIcon: { fontSize: 28, color: C.deepOcean, lineHeight: 28, marginLeft: -2 },
    title: screenTitle,
    card,
    cardInfo,
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 11,
        gap: 10,
    },
    rowBorder: rowDivider,
    input,
    fieldLabel,
    disclaimerText: {
        color: C.muted,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    displayText: {
        fontSize: 18,
    },
    itemName: { fontSize: 15, color: C.deepOcean, flex: 1, fontWeight: '500' },
    itemPrice: { fontSize: 15, color: C.deepOcean, fontVariant: ['tabular-nums'], fontWeight: '600' },
    removeBtn: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: C.errorSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeText: { color: C.error, fontSize: 12, fontWeight: '700' },
    codeValue: {
        fontSize: 20,
        fontWeight: '700',
        color: C.deepOcean,
        letterSpacing: 3,
        fontVariant: ['tabular-nums'],
        marginBottom: 12,
    },
    copyButton: {
        backgroundColor: C.deepOcean,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        shadowColor: C.deepOcean,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    copyButtonText: {
        color: C.white,
        fontWeight: '700',
        fontSize: 15,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: C.deepOcean,
    },
    metaValue: {
        fontSize: 15,
        fontWeight: '700',
        color: C.deepOcean,
        fontVariant: ['tabular-nums'],
    },
    cardDivider: {
        height: 1,
        backgroundColor: C.coolGrayLight,
        marginVertical: 14,
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 11,
        ...rowDivider,
    },
    memberRole: {
        fontSize: 13,
        color: C.muted,
        fontWeight: '600',
    },
    actionButton: {
        alignSelf: 'flex-start',
        backgroundColor: C.deepOcean,
        borderRadius: 12,
        paddingVertical: 11,
        paddingHorizontal: 18,
        shadowColor: C.deepOcean,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    actionButtonText: {
        color: C.white,
        fontWeight: '700',
        fontSize: 15,
    },
    splitButton: {
        marginTop: 8,
        ...primaryBtn,
    },
    splitButtonText: {
        color: C.white,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    toast: {
        marginTop: 10,
        alignSelf: 'center',
        backgroundColor: C.deepOcean,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    toastText: { color: C.white, fontSize: 13, fontWeight: '600' },
});
