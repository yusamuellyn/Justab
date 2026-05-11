import { StyleSheet, Text, View } from 'react-native';
import Photo from '../components/photo';


export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera</Text>
      <Photo />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
});
