import React, { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radii } from '../theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerStyle?: ViewStyle;
}

export function TextField({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  onPressIn,
  autoFocus,
  ...props
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Android (ayniqsa MIUI) da `autoFocus` ekran animatsiyasi paytida fokus beradi,
  // lekin klaviatura ochilmaydi va keyingi bosishlar ham uni ochmaydi.
  // Shuning uchun fokus ekran ochilib bo'lgach beriladi.
  useEffect(() => {
    if (!autoFocus) return;
    // Ekran almashish animatsiyasi paytida focus() e'tiborsiz qolishi mumkin,
    // shuning uchun maydon fokus olguncha bir necha marta urinadi.
    // (InteractionManager ishlatilmaydi: doimiy animatsiya bo'lsa u hech qachon chaqirilmaydi.)
    const timers = [300, 700, 1200].map((delay) =>
      setTimeout(() => {
        const input = inputRef.current;
        if (input && !input.isFocused()) input.focus();
      }, delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [autoFocus]);

  // Maydon fokusda, lekin klaviatura yopiq qolib ketgan bo'lsa — fokusni qayta berib klaviaturani ochadi.
  const openKeyboard = () => {
    const input = inputRef.current;
    if (!input || props.editable === false) return;
    if (Platform.OS === 'android' && input.isFocused()) {
      if (Keyboard.isVisible()) return;
      input.blur();
      setTimeout(() => input.focus(), 50);
    } else {
      input.focus();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={openKeyboard}
        accessible={false}
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
          props.editable === false && styles.inputWrapperDisabled,
        ]}
      >
        {leftIcon ? <View style={styles.leftIconBox}>{leftIcon}</View> : null}

        <TextInput
          ref={inputRef}
          style={[styles.input, style]}
          showSoftInputOnFocus
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label || props.placeholder}
          accessibilityState={{
            disabled: props.editable === false,
          }}
          {...props}
          onPressIn={(e) => {
            if (Platform.OS === 'android' && inputRef.current?.isFocused()) openKeyboard();
            onPressIn?.(e);
          }}
        />

        {rightIcon ? <View style={styles.rightIconBox}>{rightIcon}</View> : null}
      </Pressable>

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate800,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  inputWrapperDisabled: {
    backgroundColor: colors.slate100,
    borderColor: colors.slate200,
  },
  leftIconBox: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconBox: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.slate900,
    paddingVertical: 12,
    // iOS (Fabric) native TextInput'ni qayta ishlatadi: SMS-kod maydonidagi letterSpacing: 14
    // keyingi ekrandagi maydonga "yopishib" qoladi. Aniq qiymat berib, buni oldini olamiz.
    letterSpacing: 0,
  },
  errorText: {
    fontSize: 13,
    color: colors.dangerDark,
    marginTop: 5,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 5,
  },
});
