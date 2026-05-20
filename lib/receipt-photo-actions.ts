import { Platform, Alert, Linking } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

async function resolveLocalImageUri(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return uri;
  }

  if (uri.startsWith('file://') || (!uri.includes('://') && uri.startsWith('/'))) {
    return uri;
  }

  const localUri = `${FileSystem.cacheDirectory}receipt-${Date.now()}.jpg`;

  if (uri.startsWith('data:')) {
    const base64 = uri.split(',')[1] ?? '';
    await FileSystem.writeAsStringAsync(localUri, base64, { encoding: 'base64' });
    return localUri;
  }

  const { uri: downloadedUri } = await FileSystem.downloadAsync(uri, localUri);
  return downloadedUri;
}

async function fetchImageAsBase64(uri: string): Promise<string> {
  if (uri.startsWith('data:')) {
    return uri.split(',')[1] ?? '';
  }
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] ?? '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  const localUri = await resolveLocalImageUri(uri);
  return FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
}

export async function downloadReceiptPhotoAsPdf(imageUri: string, title: string): Promise<void> {
  try {
    const base64 = await fetchImageAsBase64(imageUri);
    const html = `
      <html>
        <head><meta charset="utf-8" /><title>${title}</title></head>
        <body style="margin:0;padding:16px;font-family:sans-serif;">
          <h2 style="color:#062B5F;">${title}</h2>
          <img src="data:image/jpeg;base64,${base64}" style="width:100%;max-width:100%;height:auto;" />
        </body>
      </html>
    `;

    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return;
    }

    const { uri: pdfUri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Sačuvaj PDF računa',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('PDF kreiran', pdfUri);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Nepoznata greška';
    Alert.alert('Greška', `PDF nije kreiran: ${message}`);
  }
}

export async function shareReceiptPhoto(imageUri: string, productName: string): Promise<void> {
  try {
    const subject = encodeURIComponent(`Fiskalni račun — ${productName}`);
    const body = encodeURIComponent(
      `U prilogu je fotografija fiskalnog računa za proizvod: ${productName}.\n\nPoslato iz aplikacije Garancije.rs`,
    );

    if (Platform.OS === 'web') {
      if (navigator.share) {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        const file = new File([blob], 'racun.jpg', { type: 'image/jpeg' });
        await navigator.share({
          title: `Račun — ${productName}`,
          files: [file],
        });
        return;
      }
      await Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
      return;
    }

    if (await Sharing.isAvailableAsync()) {
      const localUri = await resolveLocalImageUri(imageUri);
      await Sharing.shareAsync(localUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Pošalji fotografiju računa',
        UTI: 'public.jpeg',
      });
      return;
    }

    await Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Nepoznata greška';
    Alert.alert('Greška', `Slanje nije uspelo: ${message}`);
  }
}
