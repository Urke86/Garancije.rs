import { View, Text, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { fadedReceiptIllustration } from '@/lib/branding';

const WIDE_LAYOUT = 520;

interface Props {
  /** Uklopljen u Card — bez duplog okvira i senke. */
  embedded?: boolean;
}

export function DigitalReceiptFeature({ embedded = false }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_LAYOUT;

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded]}>
      <LinearGradient
        colors={
          embedded
            ? ['rgba(0, 194, 203, 0.07)', 'rgba(126, 217, 87, 0.05)', 'rgba(247, 250, 252, 0.4)']
            : ['rgba(0, 194, 203, 0.1)', 'rgba(126, 217, 87, 0.08)', colors.surface]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {embedded ? <View style={styles.topDivider} /> : null}

      <View style={[styles.row, isWide && styles.rowWide, embedded && styles.rowEmbedded]}>
        <View style={[styles.visual, isWide && styles.visualWide]}>
          <View style={styles.imageGlow}>
            <Image
              source={fadedReceiptIllustration}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel="Ilustracija: fiskalni račun je izbledao"
            />
          </View>
        </View>

        <View style={[styles.copy, isWide && styles.copyWide]}>
          <View style={styles.badge}>
            <ShieldCheck size={14} color={colors.primary} strokeWidth={2.5} />
            <Text style={styles.badgeText}>Trajna digitalna kopija</Text>
          </View>
          <Text style={styles.title}>Zašto digitalna kopija?</Text>
          <Text style={styles.body}>
            Termalni papir bledi, a dokaz o kupovini nestaje u fioci. Kod nas sken ostaje čitljiv
            i spreman za garanciju — godinama.
          </Text>
          <View style={styles.highlights}>
            <Highlight label="Izgled računa sačuvan" />
            <Highlight label="Uvek pri ruci" />
          </View>
        </View>
      </View>
    </View>
  );
}

function Highlight({ label }: { label: string }) {
  return (
    <View style={styles.highlight}>
      <View style={styles.dot} />
      <Text style={styles.highlightText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 217, 0.18)',
  },
  wrapEmbedded: {
    marginTop: 0,
    marginHorizontal: -16,
    marginBottom: -16,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  topDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  row: {
    padding: 16,
    gap: 16,
  },
  rowEmbedded: {
    paddingTop: 18,
    paddingBottom: 18,
  },
  rowWide: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 20,
  },
  visual: {
    alignItems: 'center',
  },
  visualWide: {
    flex: 0.38,
    maxWidth: 200,
  },
  imageGlow: {
    width: '100%',
    maxWidth: 200,
    aspectRatio: 1.12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  copy: {
    gap: 8,
  },
  copyWide: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fontFamily.semibold,
    color: colors.primary,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: colors.text,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  highlights: {
    marginTop: 6,
    gap: 8,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentGreen,
  },
  highlightText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.text,
  },
});
