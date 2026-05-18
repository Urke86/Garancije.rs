import { View, Text, StyleSheet, Platform, type TextStyle, type ViewStyle, type StyleProp } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';

const TLD_GRADIENT = [colors.wordmarkGradientStart, colors.wordmarkGradientEnd] as const;

type Size = 'md' | 'lg' | 'xl';

const SIZES: Record<Size, { main: number; tld: number }> = {
  md: { main: 22, tld: 21 },
  lg: { main: 26, tld: 26 },
  xl: { main: 30, tld: 30 },
};

interface Props {
  size?: Size;
  style?: StyleProp<ViewStyle>;
}

export function BrandWordmark({ size = 'lg', style }: Props) {
  const { main, tld } = SIZES[size];

  const base: TextStyle = {
    fontFamily: fontFamily.extrabold,
    fontWeight: '800',
    letterSpacing: -1,
    includeFontPadding: false,
  };

  const shadow = Platform.select({
    web: { textShadow: '0 1px 2px rgba(6, 43, 95, 0.08)' } as TextStyle,
    default: {
      textShadowColor: 'rgba(6, 43, 95, 0.08)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    } as TextStyle,
  });

  const garancijeStyle: TextStyle = {
    ...base,
    ...shadow,
    fontSize: main,
    color: colors.primary,
  };

  const tldStyle: TextStyle = {
    ...base,
    ...shadow,
    fontSize: tld,
  };

  return (
    <View
      style={[styles.row, style]}
      accessibilityRole="header"
      accessibilityLabel="Garancije.rs"
    >
      <Text style={garancijeStyle}>Garancije</Text>
      <WordmarkTld style={tldStyle} />
    </View>
  );
}

function WordmarkTld({ style }: { style: TextStyle }) {
  if (Platform.OS === 'web') {
    return (
      <Text
        style={[
          style,
          {
            backgroundImage: `linear-gradient(135deg, ${TLD_GRADIENT[0]} 0%, ${TLD_GRADIENT[1]} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
          } as TextStyle,
        ]}
      >
        .rs
      </Text>
    );
  }

  return (
    <MaskedView
      maskElement={<Text style={[style, styles.maskFill]}>.rs</Text>}
    >
      <LinearGradient
        colors={[...TLD_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[style, styles.tldSizer]}>.rs</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  maskFill: {
    color: '#000',
  },
  tldSizer: {
    opacity: 0,
  },
});
