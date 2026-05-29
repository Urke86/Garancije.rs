import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Eye, FileDown, Share2 } from 'lucide-react-native';
import { fontFamily } from '@/lib/typography';
import { useReceiptImageUri } from '@/hooks/useReceiptImageUri';
import { downloadReceiptPhotoAsPdf, shareReceiptPhoto } from '@/lib/receipt-photo-actions';
import { ReceiptImageViewer } from './ReceiptImageViewer';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

interface Props {
  imageStored: string | null | undefined;
  productName: string;
}

export function ReceiptPhotoActions({ imageStored, productName }: Props) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const { uri, loading } = useReceiptImageUri(imageStored);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [busy, setBusy] = useState<'pdf' | 'share' | null>(null);

  if (!imageStored) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Fotografija računa nije sačuvana za ovu kupovinu.</Text>
      </View>
    );
  }

  const handlePdf = async () => {
    if (!uri) {
      Alert.alert('Sačekajte', 'Slika se još učitava.');
      return;
    }
    setBusy('pdf');
    await downloadReceiptPhotoAsPdf(uri, `Račun — ${productName}`);
    setBusy(null);
  };

  const handleShare = async () => {
    if (!uri) {
      Alert.alert('Sačekajte', 'Slika se još učitava.');
      return;
    }
    setBusy('share');
    await shareReceiptPhoto(uri, productName);
    setBusy(null);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Fotografija računa</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => (uri ? setViewerOpen(true) : Alert.alert('Greška', 'Slika nije dostupna.'))}
          disabled={!uri || loading}
          accessibilityRole="button"
          accessibilityLabel="Prikaži fotografiju računa"
        >
          <Eye size={20} color={colors.primary} />
          <Text style={styles.actionText}>Prikaži</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handlePdf}
          disabled={!uri || loading || busy !== null}
          accessibilityRole="button"
          accessibilityLabel="Preuzmi PDF računa"
        >
          {busy === 'pdf' ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <FileDown size={20} color={colors.primary} />
          )}
          <Text style={styles.actionText}>Preuzmi PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleShare}
          disabled={!uri || loading || busy !== null}
          accessibilityRole="button"
          accessibilityLabel="Podeli fotografiju računa"
        >
          {busy === 'share' ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Share2 size={20} color={colors.primary} />
          )}
          <Text style={styles.actionText}>Pošalji</Text>
        </TouchableOpacity>
      </View>

      <ReceiptImageViewer
        visible={viewerOpen}
        imageUri={uri}
        title={productName}
        onClose={() => setViewerOpen(false)}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    marginBottom: 12,
  },
  loader: { marginBottom: 8 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    color: colors.primary,
  },
  empty: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
