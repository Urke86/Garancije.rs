import { Stack } from 'expo-router';

export default function ReceiptLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="edit" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="item/[id]" />
    </Stack>
  );
}
