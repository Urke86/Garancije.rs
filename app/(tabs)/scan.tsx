import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { fontFamily } from '@/lib/typography';
import { Camera, Image as ImageIcon, Scan } from 'lucide-react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { useScrollInsets } from '@/hooks/useScrollInsets';
import { layout, space } from '@/lib/spacing';
import { emptyOcrResult, hasRecognizedFields, invokeReceiptOcr } from '@/lib/ocr-receipt';
import { prepareImageForOcr } from '@/lib/ocr-image-preprocess';
import { savePendingOcr } from '@/lib/ocr-pending';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

type ScanPhase = 'idle' | 'upload' | 'ocr';

export default function ScanScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const { user } = useAuth();
  const scrollInsets = useScrollInsets({ tabBar: true });
  const [image, setImage] = useState<string | null>(null);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [error, setError] = useState('');

  const loading = phase !== 'idle';

  const pickImage = async (useCamera: boolean) => {
    setError('');
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      setError('Potrebna je dozvola za pristup ' + (useCamera ? 'kameri' : 'galeriji'));
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, base64: true });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      processImage(result.assets[0]);
    }
  };

  const processImage = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!user) return;
    setPhase('upload');
    setError('');

    try {
      let prepared: { uri: string; base64: string };

      if (Platform.OS === 'web') {
        let base64Data = asset.base64;
        if (!base64Data) {
          setError('Nije moguće učitati sliku');
          setPhase('idle');
          return;
        }
        prepared = { uri: asset.uri, base64: base64Data };
      } else {
        prepared = await prepareImageForOcr(asset.uri, asset.base64);
        setImage(prepared.uri);
      }

      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('receipt-images')
        .upload(fileName, decode(prepared.base64), { contentType: 'image/jpeg' });

      if (uploadError) {
        setError('Greška pri otpremanju slike: ' + uploadError.message);
        setPhase('idle');
        return;
      }

      setPhase('ocr');
      const { data: ocrResult, error: ocrError } = await invokeReceiptOcr(prepared.base64);
      const ocrData = ocrResult ?? emptyOcrResult();
      const warning =
        ocrError ||
        (!hasRecognizedFields(ocrData)
          ? 'Podaci nisu prepoznati — proverite sliku ili unesite ručno.'
          : null);

      const ocrKey = await savePendingOcr({
        result: ocrData,
        warning,
      });

      router.push({
        pathname: '/receipt/edit',
        params: {
          image_url: fileName,
          ocr_key: ocrKey,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nepoznata greška';
      setError('Greška: ' + message);
    }
    setPhase('idle');
  };

  const loadingMessage =
    phase === 'upload'
      ? 'Otpremam sliku...'
      : phase === 'ocr'
        ? 'Prepoznajem tekst na računu...'
        : 'Obrađujem račun...';

  return (
    <AppScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: scrollInsets.paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Skeniraj račun"
          subtitle="Slikajte ili izaberite fiskalni račun — OCR prepoznaje podatke automatski"
        />

        {!loading ? (
          <Card style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Saveti za bolji OCR</Text>
            <Text style={styles.tipsText}>
              • Ravno držite telefon{'\n'}• Ceo račun u kadru{'\n'}• Dovoljno svetla, bez senki
            </Text>
          </Card>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
            <Text style={styles.loadingSubtext}>
              {phase === 'upload'
                ? 'Slika se čuva na server'
                : 'Google Vision analizira fiskalni račun'}
            </Text>
          </Card>
        ) : image ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />
            <TouchableOpacity
              style={styles.retryRow}
              onPress={() => setImage(null)}
              accessibilityRole="button"
              accessibilityLabel="Skeniraj ponovo"
            >
              <Scan size={20} color={colors.accent} />
              <Text style={styles.retryText}>Skeniraj ponovo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => pickImage(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Slikaj račun kamerom"
            >
              <Card style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: colors.accentLight }]}>
                  <Camera size={32} color={colors.primary} />
                </View>
                <Text style={styles.actionTitle}>Slikaj račun</Text>
                <Text style={styles.actionDescription}>Koristite kameru za snimanje</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => pickImage(false)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Izaberi sliku računa iz galerije"
            >
              <Card style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: colors.accentGreenLight }]}>
                  <ImageIcon size={32} color={colors.primary} />
                </View>
                <Text style={styles.actionTitle}>Izaberi iz galerije</Text>
                <Text style={styles.actionDescription}>Izaberite postojeću sliku</Text>
              </Card>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: layout.gutter },
  tipsCard: {
    marginBottom: space.lg - 2,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 217, 0.2)',
  },
  tipsTitle: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    marginBottom: 6,
  },
  tipsText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: layout.radius - 4,
    padding: space.lg - 2,
    marginBottom: space.lg,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontFamily: fontFamily.medium,
    lineHeight: 20,
  },
  actions: { gap: space.lg - 2, marginTop: space.sm },
  actionCard: { alignItems: 'center' },
  actionIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  actionTitle: {
    fontSize: 17,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
  },
  loadingCard: {
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  previewWrap: { flex: 1, minHeight: 320, marginTop: 8 },
  previewImage: {
    width: '100%',
    height: 360,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  retryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  retryText: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.accent,
  },
});
