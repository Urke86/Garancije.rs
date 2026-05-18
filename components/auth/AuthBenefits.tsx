import { View, Text, StyleSheet } from 'react-native';
import { Camera, ShieldCheck, Bell } from 'lucide-react-native';
import { colors } from '@/lib/colors';

const BENEFITS = [
  { Icon: Camera, text: 'Skeniraj fiskalni račun za sekundu' },
  { Icon: ShieldCheck, text: 'Prati garanciju po proizvodu' },
  { Icon: Bell, text: 'Podsetnik pre isteka roka' },
] as const;

export function AuthBenefits() {
  return (
    <View style={styles.list}>
      {BENEFITS.map(({ Icon, text }) => (
        <View key={text} style={styles.row}>
          <View style={styles.iconWrap}>
            <Icon size={16} color={colors.accent} strokeWidth={2.2} />
          </View>
          <Text style={styles.text}>{text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
