import { View, Text, StyleSheet, Image, useWindowDimensions, type ViewStyle } from 'react-native';
import { fontFamily } from '@/lib/typography';
import { layout, space } from '@/lib/spacing';
import { officialLogo, getBrandLogoSize } from '@/lib/branding';
import { BrandWordmark } from '@/components/BrandWordmark';
import { PrimaryButton } from './PrimaryButton';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';

interface Props {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  showBrand?: boolean;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  showBrand = false,
  style,
}: Props) {
  const styles = useThemedStyles(createStyles);

  const { width } = useWindowDimensions();
  const logo = getBrandLogoSize(width, false);
  const mascotW = Math.min(Math.round(logo.width * 0.45), 180);
  const mascotH = Math.round(mascotW / (120 / 96));

  return (
    <View style={[styles.wrap, style]}>
      {showBrand ? (
        <View style={styles.brand}>
          <Image
            source={officialLogo}
            style={{ width: mascotW, height: mascotH, marginBottom: -8 }}
            resizeMode="contain"
          />
          <BrandWordmark size="md" />
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton title={actionLabel} onPress={onAction} style={styles.cta} />
      ) : null}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: space.xxxl,
    paddingHorizontal: space.sm,
  },
  brand: {
    alignItems: 'flex-start',
    marginBottom: layout.headerGap - 4,
    alignSelf: 'stretch',
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: space.sm,
    lineHeight: 22,
    maxWidth: 300,
  },
  cta: { marginTop: layout.section, alignSelf: 'stretch' },
});
