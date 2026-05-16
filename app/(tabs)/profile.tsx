import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/lib/colors';
import { router } from 'expo-router';
import { LogOut, Shield, Mail } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Shield size={28} color={colors.primary} />
        </View>
        <View style={styles.userInfo}>
          <View style={styles.emailRow}>
            <Mail size={16} color={colors.textSecondary} />
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <Text style={styles.memberSince}>
            Član od {new Date(user?.created_at || '').toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>O aplikaciji</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Garancija vam pomaže da digitalizujete fiskalne račune, pratite garancije i nikad ne propustite rok za reklamaciju.
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut size={20} color={colors.error} />
        <Text style={styles.signOutText}>Odjavi se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 60 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontFamily: 'Inter-Bold', color: colors.text },
  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    marginBottom: 32,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primaryLight + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  userInfo: { flex: 1 },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  email: { fontSize: 15, fontFamily: 'Inter-Medium', color: colors.text },
  memberSince: { fontSize: 13, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginTop: 4 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 12 },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  infoText: { fontSize: 14, fontFamily: 'Inter-Regular', color: colors.textSecondary, lineHeight: 22 },
  signOutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.errorLight, borderRadius: 12, paddingVertical: 14,
  },
  signOutText: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: colors.error },
});
