import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  hitSlop,
  minTouchTarget,
} from '@/constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
}

const SearchBar = forwardRef<TextInput, SearchBarProps>(
  ({ value, onChangeText, onClear, placeholder = 'Search your memories...' }, ref) => {
    return (
      <View style={styles.container}>
        <View style={styles.inputWrap}>
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textMuted}
            style={styles.icon}
          />
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
          />
          {value.length > 0 && (
            <Pressable
              onPress={onClear}
              hitSlop={hitSlop.icon}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>
    );
  },
);

SearchBar.displayName = 'SearchBar';
export default SearchBar;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(3),
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    ...shadows.sm,
  },
  icon: {
    marginRight: spacing(2),
  },
  input: {
    flex: 1,
    ...typography.formLabel,
    color: colors.text,
    paddingVertical: 10,
  },
  clearButton: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
