import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';

export default function Rooms() {
  return <ThemedView style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', 
  },
});