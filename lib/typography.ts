/** Plus Jakarta Sans — fallback Inter / system-ui na webu preko app/+html.tsx */
export const fontFamily = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extrabold: 'PlusJakartaSans-ExtraBold',
} as const;

export const fontStackWeb =
  "'Plus Jakarta Sans', 'PlusJakartaSans-Regular', Inter, system-ui, sans-serif";
