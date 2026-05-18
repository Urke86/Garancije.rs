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
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { Camera, Image as ImageIcon, Scan } from 'lucide-react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';

export default function ScanScreen() {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);
    setError('');

    try {
      let base64Data = asset.base64;

      if (!base64Data && Platform.OS !== 'web') {
        base64Data = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });
      }

      if (!base64Data) {
        setError('Nije moguće učitati sliku');
        setLoading(false);
        return;
      }

      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('receipt-images')
        .upload(fileName, decode(base64Data), { contentType: 'image/jpeg' });

      if (uploadError) {
        setError('Greška pri otpremanju slike: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('receipt-images').getPublicUrl(fileName);

      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ocr-receipt`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_base64: base64Data }),
      });

      const ocrResult = await response.json();

      if (!response.ok) {
        router.push({
          pathname: '/receipt/edit',
          params: {
            image_url: urlData.publicUrl,
            ocr_data: JSON.stringify({
              store_name: '',
              purchase_date: '',
              total_amount: '',
              items: [],
              pib: '',
              receipt_number: '',
            }),
          },
        });
        setLoading(false);
        return;
      }

      router.push({
        pathname: '/receipt/edit',
        params: {
          image_url: urlData.publicUrl,
          ocr_data: JSON.stringify(ocrResult),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nepoznata greška';
      setError('Greška: ' + message);
    }
    setLoading(false);
  };

  return (
    <AppScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Skeniraj račun"
          subtitle="Slikajte ili izaberite fiskalni račun — OCR prepoznaje podatke automatski"
        />

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Obrađujem račun...</Text>
            <Text style={styles.loadingSubtext}>Otpremanje slike i OCR prepoznavanje</Text>
          </Card>
        ) : image ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />
            {!loading ? (
              <TouchableOpacity style={styles.retryRow} onPress={() => setImage(null)}>
                <Scan size={20} color={colors.accent} />
                <Text style={styles.retryText}>Skeniraj ponovo</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => pickImage(true)} activeOpacity={0.85}>
              <Card style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: colors.accentLight }]}>
                  <Camera size={32} color={colors.primary} />
                </View>
                <Text style={styles.actionTitle}>Slikaj račun</Text>
                <Text style={styles.actionDescription}>Koristite kameru za snimanje</Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => pickImage(false)} activeOpacity={0.85}>
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

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120 },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    fontFamily: fontFamily.medium,
    lineHeight: 20,
  },
  actions: { gap: 14, marginTop: 8 },
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
