import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Photo from '../components/photo';

const COOL_GRAY_BG = '#E4E9EE';

export default function Index() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Photo />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COOL_GRAY_BG,
  },
});
