import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import type { ReactNode } from 'react';
import { Eye, FileDown, Share2, Receipt as ReceiptIcon } from 'lucide-react-native';
import { useState } from 'react';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { useReceiptImageUri } from '@/hooks/useReceiptImageUri';
import { downloadReceiptPhotoAsPdf, shareReceiptPhoto } from '@/lib/receipt-photo-actions';
import { ReceiptImageViewer } from './ReceiptImageViewer';
import { Card } from '@/components/ui/Card';

interface Props {
  imageStored: string | null | undefined;
  productName: string;
}

export function ReceiptPhotoHero({ imageStored, productName }: Props) {
  const { uri, loading } = useReceiptImageUri(imageStored);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [busy, setBusy] = useState<'pdf' | 'share' | null>(null);

  if (!imageStored) {
    return (
      <Card style={styles.emptyCard}>
        <ReceiptIcon size={32} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Fotografija nije sačuvana</Text>
        <Text style={styles.emptyBody}>
          Slika računa nije povezana sa ovom kupovinom.
        </Text>
      </Card>
    );
  }

  const handlePdf = async () => {
    if (!uri) return Alert.alert('Sačekajte', 'Slika se učitava.');
    setBusy('pdf');
    await downloadReceiptPhotoAsPdf(uri, `Račun — ${productName}`);
    setBusy(null);
  };

  const handleShare = async () => {
    if (!uri) return Alert.alert('Sačekajte', 'Slika se učitava.');
    setBusy('share');
    await shareReceiptPhoto(uri, productName);
    setBusy(null);
  };

  return (
    <Card style={styles.card} padded={false}>
      <Text style={styles.label}>Fotografija fiskalnog računa</Text>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => uri && setViewerOpen(true)}
        disabled={!uri || loading}
        style={styles.previewWrap}
        accessibilityRole="button"
        accessibilityLabel="Prikaži fotografiju računa na punom ekranu"
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : uri ? (
          <Image source={{ uri }} style={styles.preview} resizeMode="contain" />
        ) : (
          <Text style={styles.previewError}>Slika nije dostupna</Text>
        )}
        {uri ? (
          <View style={styles.previewOverlay}>
            <Eye size={18} color={colors.textInverse} />
            <Text style={styles.previewOverlayText}>Tapni za pun ekran</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <View style={styles.actions}>
        <ActionChip
          icon={<Eye size={18} color={colors.primary} />}
          label="Prikaži"
          onPress={() => (uri ? setViewerOpen(true) : Alert.alert('Greška', 'Slika nije dostupna.'))}
          disabled={!uri || loading}
        />
        <ActionChip
          icon={busy === 'pdf' ? <ActivityIndicator size="small" color={colors.primary} /> : <FileDown size={18} color={colors.primary} />}
          label="PDF"
          onPress={handlePdf}
          disabled={!uri || loading || busy !== null}
        />
        <ActionChip
          icon={busy === 'share' ? <ActivityIndicator size="small" color={colors.primary} /> : <Share2 size={18} color={colors.primary} />}
          label="Pošalji"
          onPress={handleShare}
          disabled={!uri || loading || busy !== null}
        />
      </View>

      <ReceiptImageViewer
        visible={viewerOpen}
        imageUri={uri}
        title={productName}
        onClose={() => setViewerOpen(false)}
      />
    </Card>
  );
}

function ActionChip({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, disabled && styles.chipDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
    >
      {icon}
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  label: {
    fontSize: 12,
    fontFamily: fontFamily.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  previewWrap: {
    marginHorizontal: 16,
    height: 240,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  previewError: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 43, 95, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  previewOverlayText: {
    fontSize: 12,
    fontFamily: fontFamily.semibold,
    color: colors.textInverse,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 217, 0.25)',
  },
  chipDisabled: { opacity: 0.5 },
  chipText: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    color: colors.primary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    marginBottom: 16,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  emptyBody: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
