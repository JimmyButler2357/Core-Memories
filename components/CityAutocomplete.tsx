import { useState, useMemo } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing, radii, shadows } from '@/constants/theme';
import { US_CITIES } from '@/constants/usCities';

// Pre-compute lowercase versions once at module load time.
// Without this, filtering 32K cities would create 32K new strings on every keystroke.
// Think of it like making a photocopy of the phone book in all-lowercase — you do it
// once and keep reusing the copy instead of re-writing it every time you search.
const US_CITIES_LOWER = US_CITIES.map((c) => c.toLowerCase());

interface CityAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (city: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * A TextInput with a dropdown of matching US city suggestions.
 *
 * Think of it like a search bar with autocomplete — as you type,
 * it filters a local list of ~32K US places and shows the top 5
 * matches. Cities whose name starts with your query appear first
 * (prefix matches), then any other cities containing your query.
 * Tapping a suggestion fills the input. You can also type any
 * custom location and submit it directly.
 */
export default function CityAutocomplete({
  value,
  onChangeText,
  onSelect,
  onSubmit,
  placeholder = 'Enter a location...',
  autoFocus = false,
}: CityAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Filter cities with prefix-priority matching.
  // Prefix matches (city name starts with query) appear first because that's
  // what users expect — typing "Lis" should show "Lisle, IL" before
  // "Minneapolis, MN". Substring matches fill remaining slots.
  // useMemo avoids re-filtering on every render — only recomputes when value changes.
  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (query.length < 2) return [];

    const prefixMatches: string[] = [];
    const substringMatches: string[] = [];

    for (let i = 0; i < US_CITIES_LOWER.length; i++) {
      const lower = US_CITIES_LOWER[i];
      // Check if the city name (the part before the comma) starts with the query.
      // E.g. for "lisle, il", the city part is "lisle".
      const commaIdx = lower.indexOf(',');
      const cityPart = commaIdx >= 0 ? lower.slice(0, commaIdx) : lower;

      if (cityPart.startsWith(query)) {
        prefixMatches.push(US_CITIES[i]);
        if (prefixMatches.length >= 5) break; // Already have enough
      } else if (lower.includes(query)) {
        substringMatches.push(US_CITIES[i]);
      }
    }

    return [...prefixMatches, ...substringMatches].slice(0, 5);
  }, [value]);

  const visibleSuggestions = showSuggestions ? suggestions : [];

  const handleSelect = (city: string) => {
    onSelect(city);
    setShowSuggestions(false);
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    setShowSuggestions(true);
  };

  return (
    <View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
        autoFocus={autoFocus}
      />
      {visibleSuggestions.length > 0 && (
        <FlatList
          data={visibleSuggestions}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          style={styles.dropdown}
          scrollEnabled={false}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              style={({ pressed }) => [
                styles.row,
                pressed && styles.rowPressed,
                index === visibleSuggestions.length - 1 && styles.rowLast,
              ]}
            >
              <Text style={styles.rowText}>{item}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: 14,
    color: colors.text,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.bg,
  },
  dropdown: {
    marginTop: spacing(1),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    ...shadows.sm,
    maxHeight: 220,
  },
  row: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowPressed: {
    backgroundColor: colors.accentSoft,
  },
  rowText: {
    fontSize: 14,
    color: colors.text,
  },
});
