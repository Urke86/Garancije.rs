import { Platform, Alert, Linking } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

function sanitizePdfFilename(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 48);
  return `${slug || 'racun'}.pdf`;
}

function buildReceiptPdfHtml(base64: string, title: string): string {
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `
    <html>
      <head><meta charset="utf-8" /><title>${safeTitle}</title></head>
      <body style="margin:0;padding:16px;font-family:sans-serif;">
        <h2 style="color:#062B5F;">${safeTitle}</h2>
        <img src="data:image/jpeg;base64,${base64}" style="width:100%;max-width:100%;height:auto;" />
      </body>
    </html>
  `;
}

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

async function createPdfBytesFromImage(base64: string, title: string): Promise<Uint8Array> {
  const { PDFDocument, rgb } = await import('pdf-lib');
  const jpgBytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedJpg(jpgBytes);

  const pageWidth = 595.28;
  const margin = 36;
  const titleSpace = 28;
  const maxImgWidth = pageWidth - margin * 2;
  const scale = Math.min(1, maxImgWidth / image.width);
  const imgWidth = image.width * scale;
  const imgHeight = image.height * scale;
  const pageHeight = imgHeight + margin * 2 + titleSpace;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawText(title, {
    x: margin,
    y: pageHeight - margin - 14,
    size: 14,
    color: rgb(0.024, 0.169, 0.373),
  });
  page.drawImage(image, {
    x: margin,
    y: margin,
    width: imgWidth,
    height: imgHeight,
  });

  return pdfDoc.save();
}

async function downloadPdfOnWeb(pdfBytes: Uint8Array, filename: string): Promise<void> {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function createPdfFileOnNative(html: string, filename: string): Promise<string> {
  const { uri: tempUri } = await Print.printToFileAsync({ html });
  const destUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.copyAsync({ from: tempUri, to: destUri });
  return destUri;
}

async function savePdfToAndroidDownloads(pdfUri: string, filename: string): Promise<boolean> {
  const SAF = FileSystem.StorageAccessFramework;
  const downloadsUri = SAF.getUriForDirectoryInRoot('Download');
  const permissions = await SAF.requestDirectoryPermissionsAsync(downloadsUri);

  if (!permissions.granted) {
    return false;
  }

  const base64 = await FileSystem.readAsStringAsync(pdfUri, { encoding: 'base64' });
  const destUri = await SAF.createFileAsync(
    permissions.directoryUri,
    filename.replace(/\.pdf$/i, ''),
    'application/pdf',
  );
  await SAF.writeAsStringAsync(destUri, base64, { encoding: 'base64' });
  return true;
}

async function offerPdfShare(pdfUri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) return;
  await Sharing.shareAsync(pdfUri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Podeli PDF računa',
    UTI: 'com.adobe.pdf',
  });
}

/** Preuzima PDF računa — primarna akcija je čuvanje fajla, ne share dijalog. */
export async function downloadReceiptPhotoAsPdf(imageUri: string, title: string): Promise<void> {
  try {
    const base64 = await fetchImageAsBase64(imageUri);
    const filename = sanitizePdfFilename(title);

    if (Platform.OS === 'web') {
      const pdfBytes = await createPdfBytesFromImage(base64, title);
      await downloadPdfOnWeb(pdfBytes, filename);
      return;
    }

    const html = buildReceiptPdfHtml(base64, title);
    const savedUri = await createPdfFileOnNative(html, filename);

    if (Platform.OS === 'android') {
      const savedToDownloads = await savePdfToAndroidDownloads(savedUri, filename);
      if (savedToDownloads) {
        Alert.alert('Preuzeto', 'PDF je sačuvan u folder Preuzimanja.');
        return;
      }

      Alert.alert(
        'Preuzimanje nije završeno',
        'Niste izabrali folder za čuvanje. PDF je sačuvan u aplikaciji — možete ga podeliti.',
        [
          { text: 'U redu', style: 'cancel' },
          { text: 'Podeli PDF', onPress: () => offerPdfShare(savedUri) },
        ],
      );
      return;
    }

    Alert.alert('Preuzeto', 'PDF računa je sačuvan.', [
      { text: 'U redu', style: 'cancel' },
      { text: 'Podeli PDF', onPress: () => offerPdfShare(savedUri) },
    ]);
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
