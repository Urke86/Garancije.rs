import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { hasVerifiedEmail } from '@/lib/auth/session';
import { PremiumTabBar } from '@/components/ui/PremiumTabBar';
import { useReminderBadge } from '@/hooks/useReminderBadge';

export default function TabLayout() {
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
          title: 'Početna',
          tabBarAccessibilityLabel: 'Početna',
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Dodaj',
          tabBarAccessibilityLabel: 'Dodaj račun',
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Kupovine',
          tabBarAccessibilityLabel: 'Kupovine',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarAccessibilityLabel:
            reminderBadge > 0 ? `Profil, ${reminderBadge} podsetnika` : 'Profil',
          tabBarBadge: reminderBadge > 0 ? reminderBadge : undefined,
        }}
      />
    </Tabs>
  );
}
