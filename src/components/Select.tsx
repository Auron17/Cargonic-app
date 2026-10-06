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
        <Text style={styles.arrowIcon}>▼</Text>
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
                <Text style={styles.closeButtonText}>✕</Text>
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
                      <Text style={styles.checkmark}>✓</Text>
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
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  inputBox: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  valueText: {
    fontSize: 17,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  arrowIcon: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: 4,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '600',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedOptionItem: {
    backgroundColor: '#eff6ff',
  },
  pressedOption: {
    backgroundColor: '#f3f4f6',
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 17,
    color: '#1f2937',
    fontWeight: '500',
  },
  selectedOptionLabel: {
    color: '#1a56db',
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: '#1a56db',
    fontWeight: '700',
  },
});
