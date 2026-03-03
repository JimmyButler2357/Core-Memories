import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/useReduceMotion';

/**
 * A small (6px) glowing gold dot — like a firefly.
 *
 * Plays a single gentle pulse on mount (scale 1→1.3→1 over ~800ms),
 * then stays static. Think of it as the firefly "lighting up" once
 * when it first appears, then resting.
 *
 * Skips the animation when Reduce Motion is on — still shows the dot,
 * just without the pulse.
 */
export default function FireflyDot() {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;

    scale.value = withSequence(
      withTiming(1.3, { duration: 400, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
    );
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.glow,
    shadowColor: colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
});
