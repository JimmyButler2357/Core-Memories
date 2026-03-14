import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii, shadows, minTouchTarget } from '@/constants/theme';

// ─── Types ──────────────────────────────────────────────

type MenuScreen = 'settings' | 'prompts' | 'discover' | 'faq' | 'contact';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  screen: MenuScreen;
}

interface DropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: MenuScreen) => void;
  onSignOut: () => void;
}

// ─── Menu Items ─────────────────────────────────────────

const MENU_ITEMS: MenuItem[] = [
  { icon: 'settings-outline', label: 'Settings', screen: 'settings' },
  { icon: 'bulb-outline', label: 'Prompts', screen: 'prompts' },
  { icon: 'compass-outline', label: 'Discover Fireflies', screen: 'discover' },
  { icon: 'help-circle-outline', label: 'FAQ & Tour', screen: 'faq' },
  { icon: 'mail-outline', label: 'Contact Us', screen: 'contact' },
];

// ─── Component ──────────────────────────────────────────

/**
 * Floating dropdown card anchored below the top-right menu icon.
 *
 * Think of it like a little pop-up menu that slides down from the
 * corner — tap any item to navigate, tap the dimmed background
 * (or any empty space) to close it.
 */
export default function DropdownMenu({
  visible,
  onClose,
  onNavigate,
  onSignOut,
}: DropdownMenuProps) {
  const insets = useSafeAreaInsets();

  // Animation values — fade in + subtle scale-up
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.95, { duration: 150 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dimmed backdrop — tap to dismiss */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
        />
      </Animated.View>

      {/* Floating card */}
      <Animated.View
        style={[
          styles.card,
          shadows.lg,
          { top: insets.top + spacing(3) + 44 },
          cardStyle,
        ]}
      >
        {/* Menu items */}
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.screen}
            onPress={() => {
              onClose();
              onNavigate(item.screen);
            }}
            style={({ pressed }) => [
              styles.menuRow,
              pressed && { backgroundColor: colors.cardPressed },
            ]}
          >
            <Ionicons name={item.icon} size={20} color={colors.text} />
            <Text style={styles.menuLabel}>{item.label}</Text>
          </Pressable>
        ))}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Sign Out */}
        <Pressable
          onPress={() => {
            onClose();
            onSignOut();
          }}
          style={({ pressed }) => [
            styles.menuRow,
            pressed && { backgroundColor: colors.cardPressed },
          ]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.accent} />
          <Text style={[styles.menuLabel, { color: colors.accent }]}>Sign Out</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayLight,
  },
  card: {
    position: 'absolute',
    right: spacing(4),
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingVertical: spacing(2),
    minWidth: 220,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    minHeight: minTouchTarget,
  },
  menuLabel: {
    ...typography.formLabel,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing(1),
    marginHorizontal: spacing(4),
  },
});
