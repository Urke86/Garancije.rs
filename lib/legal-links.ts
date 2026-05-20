import { Linking } from 'react-native';

const DEFAULT_SITE = 'https://garancijers.netlify.app';

export const privacyPolicyUrl =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() || `${DEFAULT_SITE}/privacy`;

export const termsUrl =
  process.env.EXPO_PUBLIC_TERMS_URL?.trim() || `${DEFAULT_SITE}/terms`;

export const privacyContactEmail = 'zivkovic_uros@yahoo.com';

export async function openPrivacyPolicy(): Promise<void> {
  await Linking.openURL(privacyPolicyUrl);
}

export async function openTerms(): Promise<void> {
  await Linking.openURL(termsUrl);
}

export async function openPrivacyContact(): Promise<void> {
  await Linking.openURL(`mailto:${privacyContactEmail}`);
}
