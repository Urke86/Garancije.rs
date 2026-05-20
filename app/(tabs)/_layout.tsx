import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { hasVerifiedEmail } from '@/lib/auth/session';
import { colors } from '@/lib/colors';
import { Hop as Home, Clock, Bell, User } from 'lucide-react-native';
import { ScanTabButton } from '@/components/ui/ScanTabButton';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import { useReminderBadge } from '@/hooks/useReminderBadge';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { bottomInset, height, topPadding } = useTabBarLayout();
  const { count: reminderBadge } = useReminderBadge();

  useEffect(() => {
    if (!loading && (!user || !hasVerifiedEmail(user))) {
      router.replace('/(auth)');
    }
  }, [user, loading]);

  if (loading || !user || !hasVerifiedEmail(user)) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: 'rgba(6, 43, 95, 0.06)',
          paddingTop: topPadding,
          height,
          paddingBottom: bottomInset,
          ...Platform.select({
            web: { boxShadow: '0 -4px 20px rgba(6, 43, 95, 0.08)' } as object,
            default: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 12,
            },
          }),
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans-Medium',
          fontSize: 11,
          marginTop: 2,
          marginBottom: Platform.OS === 'android' ? 2 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Početna',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Skeniraj',
          tabBarLabel: () => null,
          tabBarButton: (props) => <ScanTabButton {...props} bottomInset={bottomInset} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Kupovine',
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Podsetnici',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          tabBarBadge: reminderBadge > 0 ? reminderBadge : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
