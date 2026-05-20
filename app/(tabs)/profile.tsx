import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { router } from 'expo-router';
import { LogOut, Mail, Trash2 } from 'lucide-react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { BrandWordmark } from '@/components/BrandWordmark';
import { getUserInitials, getGreetingName } from '@/lib/greeting';
import { DigitalReceiptFeature } from '@/components/ui/DigitalReceiptFeature';
import { NotificationSettingsCard } from '@/components/ui/NotificationSettingsCard';
import { LegalLinks } from '@/components/ui/LegalLinks';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';

type DeleteDialog = 'closed' | 'step1' | 'step2' | 'error';

export default function ProfileScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const { scrollBottomPadding } = useTabBarLayout();
  const [deleting, setDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog>('closed');
  const [deleteError, setDeleteError] = useState('');

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)');
  };

  const runDeleteAccount = async () => {
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);

    if (error) {
      setDeleteError(error);
      setDeleteDialog('error');
      return;
    }

    setDeleteDialog('closed');
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

        <Text style={styles.sectionTitle}>Pravno</Text>
        <Card style={styles.legalCard}>
          <Text style={styles.legalIntro}>
            Informacije o obradi ličnih podataka i uslovima korišćenja aplikacije.
          </Text>
          <LegalLinks variant="profile" />
        </Card>

        <Text style={styles.sectionTitle}>Nalog i bezbednost</Text>
        <Card style={styles.accountActionsCard}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.85}>
            <LogOut size={20} color={colors.error} />
            <Text style={styles.signOutText}>Odjavi se</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
            onPress={() => setDeleteDialog('step1')}
            activeOpacity={0.85}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Obriši nalog"
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Trash2 size={20} color={colors.error} />
            )}
            <Text style={styles.deleteText}>{deleting ? 'Brisanje…' : 'Obriši nalog'}</Text>
          </TouchableOpacity>
          <Text style={styles.deleteHint}>
            Trajno briše nalog, račune, fotografije i podsetnike sa servera.
          </Text>
        </Card>
      </ScrollView>

      <ConfirmModal
        visible={deleteDialog === 'step1'}
        title="Obriši nalog"
        message="Ova radnja je trajna. Biće obrisani svi računi, fotografije, garancije, podsetnici i push tokeni. Nalog se ne može povratiti."
        confirmLabel="Nastavi"
        destructive
        onConfirm={() => setDeleteDialog('step2')}
        onCancel={() => setDeleteDialog('closed')}
      />

      <ConfirmModal
        visible={deleteDialog === 'step2'}
        title="Potvrda brisanja"
        message="Da li ste sigurni? Ovo je poslednji korak."
        confirmLabel="Da, obriši sve"
        destructive
        loading={deleting}
        onConfirm={runDeleteAccount}
        onCancel={() => setDeleteDialog('closed')}
      />

      <ConfirmModal
        visible={deleteDialog === 'error'}
        title="Greška"
        message={deleteError}
        confirmLabel="U redu"
        alertOnly
        onConfirm={() => setDeleteDialog('closed')}
        onCancel={() => setDeleteDialog('closed')}
      />
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
  accountActionsCard: {
    marginTop: 4,
    gap: 12,
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
  legalCard: { marginBottom: 20 },
  legalIntro: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 4,
  },
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.55)',
    backgroundColor: colors.errorLight,
  },
  deleteButtonDisabled: { opacity: 0.7 },
  deleteText: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.error,
  },
  deleteHint: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
