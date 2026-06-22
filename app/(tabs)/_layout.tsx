import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { hasVerifiedEmail } from '@/lib/auth/session';
import { PremiumTabBar } from '@/components/ui/PremiumTabBar';
import { useReminderBadge } from '@/hooks/useReminderBadge';

export default function TabLayout() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { count: reminderBadge } = useReminderBadge();

  useEffect(() => {
    if (!loading && (!user || !hasVerifiedEmail(user))) {
      router.replace('/(auth)');
    }
  }, [user, loading]);

  if (loading || !user || !hasVerifiedEmail(user)) return null;

  return (
    <Tabs
      tabBar={(props) => <PremiumTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarAccessibilityLabel: t('tabs.home_a11y'),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('tabs.add'),
          tabBarAccessibilityLabel: t('tabs.add_a11y'),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: t('tabs.purchases'),
          tabBarAccessibilityLabel: t('tabs.purchases_a11y'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarAccessibilityLabel:
            reminderBadge > 0
              ? t('tabs.profileReminders_a11y', { count: reminderBadge })
              : t('tabs.profile_a11y'),
          tabBarBadge: reminderBadge > 0 ? reminderBadge : undefined,
        }}
      />
    </Tabs>
  );
}
