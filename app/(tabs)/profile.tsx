import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollInsets } from '@/hooks/useScrollInsets';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useColors } from '@/contexts/ThemeContext';
import type { AppColors } from '@/lib/theme';
import { fontFamily } from '@/lib/typography';
import { layout, space } from '@/lib/spacing';
import { router } from 'expo-router';
import { BellRing, LogOut, Mail } from 'lucide-react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenSection } from '@/components/ui/ScreenSection';
import { NavRow } from '@/components/ui/NavRow';
import { Card } from '@/components/ui/Card';
import { BrandWordmark } from '@/components/BrandWordmark';
import { getUserInitials, getGreetingName } from '@/lib/greeting';
import { DigitalReceiptFeature } from '@/components/ui/DigitalReceiptFeature';
import { NotificationSettingsCard } from '@/components/ui/NotificationSettingsCard';
import { LegalLinks } from '@/components/ui/LegalLinks';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ThemeToggleCard } from '@/components/ui/ThemeToggleCard';
import { useReminderBadge } from '@/hooks/useReminderBadge';

type DeleteDialog = 'closed' | 'step1' | 'step2' | 'error';

export default function ProfileScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const scrollInsets = useScrollInsets({ tabBar: true });
  const { count: reminderBadge } = useReminderBadge();
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
        contentContainerStyle={[
          styles.content,
          { paddingBottom: scrollInsets.paddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Profil" subtitle="Podešavanja naloga" />

        <ScreenSection title="Nalog" first>
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
        </ScreenSection>

        <ScreenSection title="Izgled">
          <ThemeToggleCard />
        </ScreenSection>

        <ScreenSection title="Podsetnici">
          <NavRow
            icon={BellRing}
            title="Moji podsetnici"
            subtitle="Aktivni, odloženi i završeni podsetnici garancije"
            badge={reminderBadge}
            onPress={() => router.push('/reminders')}
            accessibilityLabel={
              reminderBadge > 0
                ? `Moji podsetnici, ${reminderBadge} aktivnih`
                : 'Moji podsetnici'
            }
          />
        </ScreenSection>

        <ScreenSection title="Obaveštenja">
          <NotificationSettingsCard />
        </ScreenSection>

        <ScreenSection title="O aplikaciji">
          <Card style={styles.aboutCard} clip>
            <BrandWordmark size="md" style={styles.wordmark} />
            <Text style={styles.infoText}>
              Garancije.rs vam pomaže da digitalizujete fiskalne račune, pratite garancije i nikad
              ne propustite rok za reklamaciju.
            </Text>
            <DigitalReceiptFeature embedded />
          </Card>
        </ScreenSection>

        <ScreenSection title="Pravno">
          <Card style={styles.legalCard}>
            <Text style={styles.legalIntro}>
              Informacije o obradi ličnih podataka i uslovima korišćenja aplikacije.
            </Text>
            <LegalLinks
              variant="profile"
              onDeleteAccount={() => setDeleteDialog('step1')}
              deleting={deleting}
            />
          </Card>
        </ScreenSection>

        <ScreenSection title="Nalog i bezbednost">
          <Card style={styles.accountActionsCard}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Odjavi se"
            >
              <LogOut size={20} color={colors.error} />
              <Text style={styles.signOutText}>Odjavi se</Text>
            </TouchableOpacity>
          </Card>
        </ScreenSection>
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

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: layout.gutter },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountActionsCard: {
    gap: space.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: layout.radius,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.lg,
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
    marginBottom: space.xs + 2,
  },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
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
    marginTop: space.xs + 2,
  },
  aboutCard: {},
  legalCard: {},
  legalIntro: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: space.xs,
  },
  wordmark: { marginBottom: space.md },
  infoText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: space.xs,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: layout.radius - 2,
    paddingVertical: space.lg - 2,
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
