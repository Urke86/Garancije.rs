import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollInsets } from '@/hooks/useScrollInsets';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useColors } from '@/contexts/ThemeContext';
import { useDateLocale } from '@/contexts/LocaleContext';
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
import { LanguageToggleCard } from '@/components/ui/LanguageToggleCard';
import { useReminderBadge } from '@/hooks/useReminderBadge';

type DeleteDialog = 'closed' | 'step1' | 'step2' | 'error';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { user, signOut, deleteAccount } = useAuth();
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const scrollInsets = useScrollInsets({ tabBar: true });
  const { count: reminderBadge } = useReminderBadge();
  const [deleting, setDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog>('closed');
  const [deleteError, setDeleteError] = useState('');
  const [showSignOutModal, setShowSignOutModal] = useState(false);

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

  const displayName = getGreetingName(user) || t('common.user');

  const memberSinceLabel = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(dateLocale, {
        month: 'long',
        year: 'numeric',
      })
    : t('common.recently');

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
        <ScreenHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

        <ScreenSection title={t('profile.account')} first>
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
                {t('common.memberSince', { date: memberSinceLabel })}
              </Text>
            </View>
          </Card>
        </ScreenSection>

        <ScreenSection title={t('common.language')}>
          <LanguageToggleCard />
        </ScreenSection>

        <ScreenSection title={t('profile.appearance')}>
          <ThemeToggleCard />
        </ScreenSection>

        <ScreenSection title={t('profile.reminders')}>
          <NavRow
            icon={BellRing}
            title={t('profile.myReminders')}
            subtitle={t('profile.myRemindersSubtitle')}
            badge={reminderBadge}
            onPress={() => router.push('/reminders')}
            accessibilityLabel={
              reminderBadge > 0
                ? t('profile.myRemindersActive_a11y', { count: reminderBadge })
                : t('profile.myReminders_a11y')
            }
          />
        </ScreenSection>

        <ScreenSection title={t('profile.notifications')}>
          <NotificationSettingsCard />
        </ScreenSection>

        <ScreenSection title={t('profile.about')}>
          <Card style={styles.aboutCard} clip>
            <BrandWordmark size="md" style={styles.wordmark} />
            <Text style={styles.infoText}>{t('profile.aboutText')}</Text>
            <DigitalReceiptFeature embedded />
          </Card>
        </ScreenSection>

        <ScreenSection title={t('profile.legal')}>
          <Card style={styles.legalCard}>
            <Text style={styles.legalIntro}>{t('profile.legalIntro')}</Text>
            <LegalLinks
              variant="profile"
              onDeleteAccount={() => setDeleteDialog('step1')}
              deleting={deleting}
            />
          </Card>
        </ScreenSection>

        <ScreenSection title={t('profile.accountSecurity')}>
          <Card style={styles.accountActionsCard}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={() => setShowSignOutModal(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('profile.signOut_a11y')}
            >
              <LogOut size={20} color={colors.error} />
              <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
            </TouchableOpacity>
          </Card>
        </ScreenSection>
      </ScrollView>

      <ConfirmModal
        visible={showSignOutModal}
        title={t('profile.signOutTitle')}
        message={t('profile.signOutMessage')}
        confirmLabel={t('profile.signOut')}
        destructive
        onConfirm={async () => {
          setShowSignOutModal(false);
          await handleSignOut();
        }}
        onCancel={() => setShowSignOutModal(false)}
      />

      <ConfirmModal
        visible={deleteDialog === 'step1'}
        title={t('profile.deleteAccountTitle')}
        message={t('profile.deleteAccountMessage')}
        confirmLabel={t('common.continue')}
        destructive
        onConfirm={() => setDeleteDialog('step2')}
        onCancel={() => setDeleteDialog('closed')}
      />

      <ConfirmModal
        visible={deleteDialog === 'step2'}
        title={t('profile.deleteConfirmTitle')}
        message={t('profile.deleteConfirmMessage')}
        confirmLabel={t('common.yesDeleteAll')}
        destructive
        loading={deleting}
        onConfirm={runDeleteAccount}
        onCancel={() => setDeleteDialog('closed')}
      />

      <ConfirmModal
        visible={deleteDialog === 'error'}
        title={t('common.error')}
        message={deleteError}
        confirmLabel={t('common.ok')}
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
    borderColor: colors.borderErrorSoft,
    backgroundColor: colors.surface,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.error,
  },
  });
