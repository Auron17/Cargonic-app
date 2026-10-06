import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows } from '../theme';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  subtitle?: string;
}

interface SelectProps<T = string> {
  label?: string;
  placeholder?: string;
  value?: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
}

export function Select<T = string>({
  label,
  placeholder = 'Tanlang',
  value,
  options,
  onChange,
  error,
  hint,
  containerStyle,
}: SelectProps<T>) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: T) => {
    onChange(val);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        onPress={() => setModalVisible(true)}
        accessibilityRole="combobox"
        accessibilityLabel={label || placeholder}
        style={[styles.inputBox, error ? styles.inputError : null]}
      >
        <Text
          style={[
            styles.valueText,
            !selectedOption ? styles.placeholderText : null,
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.slate400} />
      </Pressable>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent} edges={['bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || placeholder}</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={12}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Yopish"
              >
                <Ionicons name="close" size={22} color={colors.slate600} />
              </Pressable>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    onPress={() => handleSelect(item.value)}
                    style={({ pressed }) => [
                      styles.optionItem,
                      isSelected && styles.selectedOptionItem,
                      pressed && styles.pressedOption,
                    ]}
                  >
                    <View style={styles.optionTextContainer}>
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.selectedOptionLabel,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
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
  inputBox: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.slate200,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  valueText: {
    fontSize: 16,
    color: colors.slate900,
    fontWeight: '500',
    flex: 1,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 13,
    color: colors.dangerDark,
    marginTop: 4,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 13,
    color: colors.slate500,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '75%',
    paddingTop: 16,
    ...shadows.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate900,
  },
  closeButton: {
    padding: 6,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  selectedOptionItem: {
    backgroundColor: colors.primary50,
  },
  pressedOption: {
    backgroundColor: colors.slate100,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: colors.slate800,
    fontWeight: '500',
  },
  selectedOptionLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 13,
    color: colors.slate500,
    marginTop: 2,
  },
});
