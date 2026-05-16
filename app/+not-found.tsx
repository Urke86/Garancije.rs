import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/lib/colors';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stranica nije pronađena</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.buttonText}>Nazad na početnu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 },
  title: { fontSize: 18, fontFamily: 'Inter-Medium', color: colors.text, marginBottom: 16 },
  button: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  buttonText: { color: colors.textInverse, fontSize: 15, fontFamily: 'Inter-Medium' },
});
