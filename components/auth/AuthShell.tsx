import { ReactNode, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { officialLogo, getBrandLogoSize } from '@/lib/branding';
import { BrandWordmark } from '@/components/BrandWordmark';
import { AuthBenefits } from './AuthBenefits';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

interface Props {
  children: ReactNode;
  cardTitle: string;
  cardSubtitle?: string;
  showBack?: boolean;
}

const WIDE_BREAKPOINT = 768;

export function AuthShell({ children, cardTitle, cardSubtitle, showBack }: Props) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT && Platform.OS === 'web';
  const logoSize = getBrandLogoSize(width, isWide);
  const wordmarkLift = Math.round(logoSize.height * 0.14);

  const cardY = useSharedValue(28);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardY.value = withSpring(0, { damping: 18, stiffness: 120 });
    cardOpacity.value = withTiming(1, { duration: 450 });
  }, [cardOpacity, cardY]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
    opacity: cardOpacity.value,
  }));

  const hero = (
    <View style={[styles.hero, isWide && styles.heroWide]}>
      <View style={styles.brandLockup}>
        <Image
          source={officialLogo}
          style={[
            styles.logo,
            { width: logoSize.width, height: logoSize.height, marginBottom: -wordmarkLift },
          ]}
          resizeMode="contain"
          accessibilityLabel="Garancije.rs logo"
        />
        <BrandWordmark
          size={isWide ? 'xl' : 'lg'}
          style={[styles.wordmark, { marginLeft: Math.round(logoSize.width * 0.02) }]}
        />
      </View>
      <Text style={[styles.tagline, { marginTop: 10 }]}>Čuvamo vaš račun. Čuvamo i garanciju.</Text>
      <AuthBenefits />
    </View>
  );

  const card = (
    <Animated.View
      style={[
        styles.card,
        isWide && styles.cardWide,
        { paddingBottom: Math.max(insets.bottom, 24) },
        cardAnimStyle,
      ]}
    >
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
      ) : null}
      <Text style={styles.cardTitle}>{cardTitle}</Text>
      {cardSubtitle ? <Text style={styles.cardSubtitle}>{cardSubtitle}</Text> : null}
      {children}
    </Animated.View>
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.authGradientTop, colors.authGradientMid, colors.authGradientBottom]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobRight]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            isWide && styles.scrollWide,
            { paddingTop: Math.max(insets.top, 16) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isWide ? (
            <View style={styles.wideRow}>
              <View style={styles.wideHeroCol}>{hero}</View>
              <View style={styles.wideCardCol}>{card}</View>
            </View>
          ) : (
            <>
              {hero}
              {card}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  scrollWide: {
    justifyContent: 'center',
    minHeight: '100%',
    paddingVertical: 32,
  },
  wideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    gap: 32,
  },
  wideHeroCol: { flex: 1, paddingRight: 16 },
  wideCardCol: { flex: 1, maxWidth: 440 },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.35,
  },
  blobTop: {
    width: 220,
    height: 220,
    backgroundColor: colors.accent,
    top: -60,
    right: -40,
  },
  blobRight: {
    width: 160,
    height: 160,
    backgroundColor: colors.accentGreen,
    bottom: 120,
    left: -50,
    opacity: 0.25,
  },
  hero: {
    paddingTop: 0,
    paddingBottom: 20,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    width: '100%',
  },
  heroWide: {
    paddingTop: 8,
    paddingBottom: 0,
  },
  brandLockup: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  logo: {
    alignSelf: 'flex-start',
  },
  wordmark: {
    marginBottom: 0,
  },
  tagline: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textMuted,
    lineHeight: 22,
    maxWidth: 360,
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    marginHorizontal: -4,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 40px rgba(6, 43, 95, 0.1)',
      } as object,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
      },
    }),
  },
  cardWide: {
    borderRadius: 24,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginLeft: -4,
    padding: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textMuted,
    marginBottom: 20,
    lineHeight: 20,
  },
});
