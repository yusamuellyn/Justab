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
import { getApiUrl } from "@/utils/api";

const DEEP_OCEAN = '#1E3A5F';
const COOL_GRAY = '#C5CDD6';
const COOL_GRAY_BG = '#E4E9EE';
const WHITE = '#FFFFFF';



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
    const response = await fetch(`${getApiUrl()}/displayMembers?partyID=${partyID}`);//
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
      const response = await fetch(`${getApiUrl()}/checkStatus?partyID=${id}`);
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
                    placeholderTextColor={COOL_GRAY}
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
                    placeholderTextColor={COOL_GRAY}
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
    container: { flex: 1, backgroundColor: COOL_GRAY_BG, padding: 24 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
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
  joinButton: {
    backgroundColor: DEEP_OCEAN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  joinButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    fontSize: 15,
    color: DEEP_OCEAN,
    textAlign: 'center',
    marginBottom: 12,
  },
  waitingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5A6B7D',
    textAlign: 'center',
    marginBottom: 20,
  },

  itemName: { fontSize: 15, color: DEEP_OCEAN, flex: 1 },
  itemPrice: { fontSize: 15, color: DEEP_OCEAN, fontVariant: ['tabular-nums'], fontWeight: '600' },
});