import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { fontFamily } from '@/lib/typography';
import { Camera, Image as ImageIcon, Scan } from 'lucide-react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { useScrollInsets } from '@/hooks/useScrollInsets';
import { layout, space } from '@/lib/spacing';
import { runReceiptOcrFromUri, emptyOcrResult } from '@/lib/ocr-receipt';
import { prepareImageForOcr } from '@/lib/ocr-image-preprocess';
import { savePendingOcr } from '@/lib/ocr-pending';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

type ScanPhase = 'idle' | 'ocr';

export default function ScanScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const { user } = useAuth();
  const scrollInsets = useScrollInsets({ tabBar: true });
  const [image, setImage] = useState<string | null>(null);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [error, setError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setImage(null);
      setPhase('idle');
      setError('');
      setPermissionDenied(false);
    }, []),
  );

  const loading = phase !== 'idle';

  const pickImage = async (useCamera: boolean) => {
    setError('');
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      setPermissionDenied(true);
      setError(useCamera ? t('scan.permissionCamera') : t('scan.permissionGallery'));
      return;
    }

    setPermissionDenied(false);

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
    setPhase('ocr');
    setError('');

    try {
      let localUri = asset.uri;

      if (Platform.OS !== 'web') {
        const prepared = await prepareImageForOcr(asset.uri, asset.base64);
        localUri = prepared.uri;
        setImage(prepared.uri);
      } else {
        setImage(asset.uri);
      }

      if (Platform.OS === 'web') {
        const ocrKey = await savePendingOcr({
          result: emptyOcrResult(),
          warning: t('scan.webOcrWarning'),
          detectedFields: [],
        });
        router.push({
          pathname: '/receipt/edit',
          params: { local_image_uri: localUri, ocr_key: ocrKey },
        });
        return;
      }

      const { data: ocrData, error: ocrError, detectedFields } = await runReceiptOcrFromUri(localUri);
      const warning = ocrError;

      const ocrKey = await savePendingOcr({
        result: ocrData,
        warning,
        detectedFields,
      });

      router.push({
        pathname: '/receipt/edit',
        params: {
          local_image_uri: localUri,
          ocr_key: ocrKey,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common.unknownError');
      setError(t('scan.errorPrefix') + message);
    }
    setPhase('idle');
  };

  const loadingMessage =
    phase === 'ocr' ? t('scan.ocrLoading') : t('scan.processing');

  return (
    <AppScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: scrollInsets.paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={t('scan.title')} subtitle={t('scan.subtitle')} />

        {!loading ? (
          <Card style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>{t('scan.whatToPhotograph')}</Text>
            <Text style={styles.instructionLead}>
              <Trans
                i18nKey="scan.instructionLead"
                components={{
                  1: <Text style={styles.instructionEmphasis} />,
                }}
              />
            </Text>
            <Text style={styles.instructionNote}>{t('scan.instructionNote')}</Text>
          </Card>
        ) : null}

        {!loading ? (
          <Card style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>{t('scan.tipsTitle')}</Text>
            <Text style={styles.tipsText}>{t('scan.tipsText')}</Text>
          </Card>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            {permissionDenied ? (
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => Linking.openSettings()}
                accessibilityRole="button"
                accessibilityLabel={t('scan.openSettings_a11y')}
              >
                <Text style={styles.settingsBtnText}>{t('scan.openSettings')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {loading ? (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
            <Text style={styles.loadingSubtext}>{t('scan.ocrSubtext')}</Text>
          </Card>
        ) : image ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />
            <TouchableOpacity
              style={styles.retryRow}
              onPress={() => setImage(null)}
              accessibilityRole="button"
              accessibilityLabel={t('scan.scanAgain_a11y')}
            >
              <Scan size={20} color={colors.accent} />
              <Text style={styles.retryText}>{t('scan.scanAgain')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => pickImage(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('scan.takePhoto_a11y')}
            >
              <Card style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: colors.accentLight }]}>
                  <Camera size={32} color={colors.primary} />
                </View>
                <Text style={styles.actionTitle}>{t('scan.takePhoto')}</Text>
                <Text style={styles.actionDescription}>{t('scan.takePhotoDesc')}</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => pickImage(false)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('scan.pickGallery_a11y')}
            >
              <Card style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: colors.accentGreenLight }]}>
                  <ImageIcon size={32} color={colors.primary} />
                </View>
                <Text style={styles.actionTitle}>{t('scan.pickGallery')}</Text>
                <Text style={styles.actionDescription}>{t('scan.pickGalleryDesc')}</Text>
              </Card>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: layout.gutter },
  instructionCard: {
    marginBottom: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderPrimarySoft,
  },
  instructionTitle: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: space.sm,
  },
  instructionLead: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: space.sm,
  },
  instructionEmphasis: {
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  instructionNote: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.primary,
    lineHeight: 19,
  },
  tipsCard: {
    marginBottom: space.lg - 2,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.borderAccentSoft,
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
    borderColor: colors.borderErrorSoft,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontFamily: fontFamily.medium,
    lineHeight: 20,
  },
  settingsBtn: {
    marginTop: space.sm,
    alignSelf: 'flex-start',
  },
  settingsBtnText: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.primary,
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
