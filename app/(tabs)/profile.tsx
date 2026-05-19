import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { router } from 'expo-router';
import { LogOut, Mail } from 'lucide-react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { BrandWordmark } from '@/components/BrandWordmark';
import { getUserInitials, getGreetingName } from '@/lib/greeting';
import { DigitalReceiptFeature } from '@/components/ui/DigitalReceiptFeature';
import { NotificationSettingsCard } from '@/components/ui/NotificationSettingsCard';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { scrollBottomPadding } = useTabBarLayout();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)');
  };

  const displayName = getGreetingName(user) || 'Korisnik';

  return (
    <AppScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Profil" subtitle="Podešavanja naloga" />

        <Text style={styles.sectionTitle}>Nalog</Text>

        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getUserInitials(user)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{displayName}</Text>
            <View style={styles.emailRow}>
              <Mail size={16} color={colors.textMuted} />
              <Text style={styles.email} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
            <Text style={styles.memberSince}>
              Član od{' '}
              {new Date(user?.created_at || '').toLocaleDateString('sr-RS', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Obaveštenja</Text>
        <NotificationSettingsCard />

        <Text style={styles.sectionTitle}>O aplikaciji</Text>
        <Card style={styles.aboutCard} clip>
          <BrandWordmark size="md" style={styles.wordmark} />
          <Text style={styles.infoText}>
            Garancije.rs vam pomaže da digitalizujete fiskalne račune, pratite garancije i nikad
            ne propustite rok za reklamaciju.
          </Text>

          <DigitalReceiptFeature embedded />
        </Card>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.85}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.signOutText}>Odjavi se</Text>
        </TouchableOpacity>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  userInfo: { flex: 1 },
  displayName: {
    fontSize: 17,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    marginBottom: 6,
  },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  email: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  memberSince: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    marginBottom: 12,
  },
  aboutCard: { marginBottom: 28 },
  wordmark: { marginBottom: 12 },
  infoText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 4,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.35)',
    backgroundColor: colors.surface,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.error,
  },
});
