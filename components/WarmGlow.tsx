import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

interface WarmGlowProps {
  /** Vertical center of the glow (0–1). Default 0.4 (40% from top). */
  cy?: number;
}

/**
 * Warm radial gradient overlay — a soft peachy spotlight that fades
 * toward the edges. Used behind the mic button on Empty State and
 * Recording screens.
 *
 * Translates the wireframe CSS:
 *   radial-gradient(ellipse at 50% 40%,
 *     rgba(244,226,214,0.45) 0%, rgba(250,248,245,0) 70%)
 *
 * Follows the same overlay pattern as PaperTexture.tsx.
 */
export default function WarmGlow({ cy = 0.4 }: WarmGlowProps) {
  const { width, height } = useWindowDimensions();

  // Pixel values for the gradient radii — the CSS fades to transparent
  // at 70% of the viewport, so rx/ry approximate an ellipse that covers
  // roughly 70% of width and 70% of height.
  const rx = width * 0.7;
  const ry = height * 0.5;

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient
            id="warmGlow"
            cx={width / 2}
            cy={height * cy}
            rx={rx}
            ry={ry}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="rgb(244,226,214)" stopOpacity={0.45} />
            <Stop offset="1" stopColor="rgb(250,248,245)" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#warmGlow)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
