import { Alert, Platform } from 'react-native';

/** Jednostavna poruka o grešci — native Alert; na webu koristite ConfirmModal sa alertOnly. */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    console.warn('[showAlert]', title, message);
    return;
  }
  Alert.alert(title, message);
}
