import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useEffect, useState} from "react";
import { getApiUrl, apiHeaders } from "@/utils/api";
import { C, card, primaryBtn, backBtn, input, fieldLabel, screenTitle, rowDivider } from '@/constants/theme';



export default function Party() {
  const router = useRouter();
  const [codeInput, setCI] = useState('');
  const [userName, setUN] = useState('');
  const [message, setMessage] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [joined, setJoined] = useState(false);
  
  const params = useLocalSearchParams(); 
  const [partyID, setPartyID] = useState<string | undefined>(params.partyID as string | undefined);


  const getMembers = async () => {
    if (!partyID) return; 
    const response = await fetch(`${getApiUrl()}/displayMembers?partyID=${partyID}`, { headers: apiHeaders() });//
    const data = await response.json();
    setMembers(data.members || []); // 
  };

  useEffect(() => {
    getMembers();
  }, [partyID]);

  useEffect(() => {
    if (!joined || !partyID) return;
    getMembers();
    const interval = setInterval(getMembers, 3000);
    return () => clearInterval(interval);
  }, [joined, partyID]);


  const joinParty = async () => {
    const response = await fetch(`${getApiUrl()}/joinParty?code=${codeInput}&userName=${userName}`, {
    method: 'POST',
    headers: apiHeaders(),
    });

    const data = await response.json()// 

    if (response.ok) {
      setPartyID(data.partyID);
      setJoined(true);
      startPolling(data.partyID, userName);
    } else {
      setMessage('Invalid code.');
    }
  };

  const startPolling = (id: string, user: string) => {
    const interval = setInterval(async () => {
      const response = await fetch(`${getApiUrl()}/checkStatus?partyID=${id}`, { headers: apiHeaders() });
      const data = await response.json();
      if (data.status === 'splitting') {
        clearInterval(interval);
        router.push(`/split/${id}?userName=${user}&role=Member` as any);
      }
    }, 3000); // checks every 3 seconds
    return interval;
  }; // Members wait here until the leader starts the split

  if (joined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>In Party</Text>
        </View>

        <Text style={styles.waitingText}>Waiting for leader to split…</Text>

        <View style={styles.card}>
          {[...members]
            .sort((a, b) => {
              if (a.partyRole === 'Leader') return -1;
              if (b.partyRole === 'Leader') return 1;
              return 0;
            })
            .map((member, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.itemName}>{member.user}</Text>
                <Text style={styles.itemPrice}>{member.partyRole}</Text>
              </View>
            ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
     <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Join A Party</Text>
        </View>

        <View style={styles.card}>
                <Text style={styles.fieldLabel}>Party Code</Text>
                 <TextInput
                    style={styles.input}
                    onChangeText={setCI}
                    value={codeInput}
                    placeholder="Enter party code"
                    placeholderTextColor={C.coolGray}
                    autoCapitalize="characters"
                    />
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
        </View>

        <View style={styles.card}>
                  <TouchableOpacity style={styles.joinButton} onPress={joinParty}>
                    <Text style={styles.joinButtonText}>Join Party</Text>
                  </TouchableOpacity>
        </View>
        
        {message ? <Text style={styles.message}>{message}</Text> : null}

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
    container: { flex: 1, backgroundColor: C.coolGrayBg, padding: 20 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: backBtn,
    backIcon: { fontSize: 28, color: C.deepOcean, lineHeight: 28, marginLeft: -2 },
    title: screenTitle,
    card,
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 11,
        ...rowDivider,
    },
    input,
    fieldLabel,
    joinButton: primaryBtn,
    joinButtonText: {
        color: C.white,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    message: {
        fontSize: 14,
        color: C.error,
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: '500',
    },
    waitingText: {
        fontSize: 14,
        fontWeight: '500',
        color: C.muted,
        textAlign: 'center',
        marginBottom: 20,
    },
    itemName: { fontSize: 15, color: C.deepOcean, flex: 1, fontWeight: '500' },
    itemPrice: { fontSize: 13, color: C.muted, fontWeight: '600' },
});