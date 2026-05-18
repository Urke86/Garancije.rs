import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  Platform,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '@/lib/colors';

interface Props extends TextInputProps {
  label: string;
  secureToggle?: boolean;
}

export function AuthInput({ label, secureToggle, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isSecure = secureToggle && !visible;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        <TextInput
          {...props}
          style={[styles.input, style]}
          secureTextEntry={isSecure}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
        />
        {secureToggle ? (
          <TouchableOpacity
            onPress={() => setVisible((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={visible ? 'Sakrij lozinku' : 'Prikaži lozinku'}
          >
            {visible ? (
              <EyeOff size={20} color={colors.textMuted} />
            ) : (
              <Eye size={20} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    color: colors.textSecondary,
    marginLeft: 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 54,
    paddingHorizontal: 16,
  },
  fieldFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    ...Platform.select({
      web: { boxShadow: '0 0 0 3px rgba(15, 118, 110, 0.12)' } as object,
      default: {},
    }),
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.text,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    ...Platform.select({
      web: { outlineStyle: 'none' } as object,
      default: {},
    }),
  },
  eyeBtn: { marginLeft: 8, padding: 4 },
});
