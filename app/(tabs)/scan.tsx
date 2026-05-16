import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import { Camera, Image as ImageIcon, Scan } from 'lucide-react-native';

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
          encoding: FileSystem.EncodingType.Base64,
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
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
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
            ocr_data: JSON.stringify({ store_name: '', purchase_date: '', total_amount: '', items: [], pib: '', receipt_number: '' }),
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
    } catch (err: any) {
      setError('Greška: ' + (err.message || 'Nepoznata greška'));
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Skeniraj račun</Text>
        <Text style={styles.subtitle}>Slikajte ili izaberite sliku fiskalnog računa</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Obrađujem račun...</Text>
          <Text style={styles.loadingSubtext}>OCR prepoznavanje teksta</Text>
        </View>
      ) : image ? (
        <View style={styles.preview}>
          <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionCard} onPress={() => pickImage(true)}>
            <View style={styles.actionIcon}>
              <Camera size={32} color={colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Slikaj račun</Text>
            <Text style={styles.actionDescription}>Koristite kameru za snimanje</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => pickImage(false)}>
            <View style={styles.actionIcon}>
              <ImageIcon size={32} color={colors.secondary} />
            </View>
            <Text style={styles.actionTitle}>Izaberi iz galerije</Text>
            <Text style={styles.actionDescription}>Izaberite postojeću sliku</Text>
          </TouchableOpacity>
        </View>
      )}

      {image && !loading && (
        <View style={styles.retryContainer}>
          <TouchableOpacity style={styles.retryButton} onPress={() => setImage(null)}>
            <Scan size={20} color={colors.primary} />
            <Text style={styles.retryText}>Skeniraj ponovo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 60 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontFamily: 'Inter-Bold', color: colors.text },
  subtitle: { fontSize: 15, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginTop: 4 },
  error: {
    color: colors.error, fontSize: 14, fontFamily: 'Inter-Regular',
    backgroundColor: colors.errorLight, padding: 12, borderRadius: 8, marginBottom: 16,
  },
  actions: { flex: 1, justifyContent: 'center', gap: 16 },
  actionCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  actionIcon: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  actionTitle: { fontSize: 17, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 4 },
  actionDescription: { fontSize: 14, fontFamily: 'Inter-Regular', color: colors.textSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: colors.text },
  loadingSubtext: { fontSize: 14, fontFamily: 'Inter-Regular', color: colors.textSecondary },
  preview: { flex: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  previewImage: { flex: 1, borderRadius: 12 },
  retryContainer: { alignItems: 'center', paddingBottom: 16 },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  retryText: { fontSize: 15, fontFamily: 'Inter-Medium', color: colors.primary },
});
