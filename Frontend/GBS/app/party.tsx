// Imports From Other Files
import { useLocalSearchParams, useRouter } from "expo-router";  // This and const allow connection to button
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useEffect, useState} from "react";
import { getApiUrl } from "@/utils/api";



export default function Party() {
  const router = useRouter();
  const [codeInput, setCI] = useState('');
  const [userName, setUN] = useState('');
  const [message, setMessage] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  
  const params = useLocalSearchParams(); 
  const [partyID, setPartyID] = useState<string | undefined>(params.partyID as string | undefined);


  const getMembers = async () => {
    if (!partyID) return; 
    const response = await fetch(`${getApiUrl()}/displayMembers?partyID=${partyID}`);//
    const data = await response.json();
    setMembers(data.members || []); // 
  };

  useEffect(() => {
    getMembers();
  }, [partyID]);


  const joinParty = async () => {
    const response = await fetch(`${getApiUrl()}/joinParty?code=${codeInput}&userName=${userName}`, {
    method: 'POST',
    });

    const data = await response.json()// 

    if (response.ok) {
      setMessage('Joined party!');
      setPartyID(data.partyID);
      router.push(`/split/${data.partyID}?userName=${userName}`);
    } else {
      setMessage('Invalid code.');
    }
  };

  const startPolling = (id: string, user: string) => {
    const interval = setInterval(async () => {
      const response = await fetch(`${getApiUrl()}/checkStatus?partyID=${id}`);
      const data = await response.json();
      if (data.status === 'splitting') {
        clearInterval(interval);
        router.push(`/split/${id}?userName=${user}` as any);
      }
    }, 3000); // checks every 3 seconds
    return interval;
  }; // UNDERSTAND LATER, USED TO ENSURE BOTH PARTY SIDES JOIN AT THE SAME TIME AT THE SPLIT SCREEN

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

        <View style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.itemName}>Enter Username:</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={setUN}
                    value={userName}
                  />
                </View>
        </View>

        <View style={styles.card}>
                <View style={styles.row}>
                  <TouchableOpacity onPress={joinParty}>
                    <Text>Join Party</Text>
                  </TouchableOpacity>
                </View>
        </View>
        
        {message ? <Text style={styles.itemName}>{message}</Text> : null}

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
});