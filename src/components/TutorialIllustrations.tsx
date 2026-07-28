import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  withDelay,
  interpolateColor,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const ACCENT = '#8b5cf6';
const NEUTRAL = '#333333';
const BG = '#0A0A0A';
const SIZE = 240;
const CENTER = SIZE / 2;

// ─── Illustration 1 : Focus (Une habitude à la fois) ────────
// A central diamond stays solid, while peripheral dots fade out and scale down.
export const IllustrationFocus: React.FC = () => {
  const peripheralOpacity = useSharedValue(1);
  const peripheralScale = useSharedValue(1);

  useEffect(() => {
    peripheralOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withDelay(1000, withTiming(1, { duration: 0 })) // snap back
      ),
      -1,
      false
    );
    peripheralScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withDelay(1000, withTiming(1, { duration: 0 }))
      ),
      -1,
      false
    );
  }, []);

  const animatedProps1 = useAnimatedProps(() => ({
    opacity: peripheralOpacity.value,
    r: 6 * peripheralScale.value,
  }));
  const animatedProps2 = useAnimatedProps(() => ({
    opacity: peripheralOpacity.value,
    r: 8 * peripheralScale.value,
  }));
  const animatedProps3 = useAnimatedProps(() => ({
    opacity: peripheralOpacity.value,
    r: 5 * peripheralScale.value,
  }));

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Central Element */}
        <AnimatedRect
          x={CENTER - 20}
          y={CENTER - 20}
          width={40}
          height={40}
          fill={ACCENT}
          rx={8}
          transform={`rotate(45, ${CENTER}, ${CENTER})`}
        />
        {/* Peripheral Elements */}
        <AnimatedCircle cx={CENTER - 60} cy={CENTER - 40} fill={NEUTRAL} animatedProps={animatedProps1} />
        <AnimatedCircle cx={CENTER + 70} cy={CENTER + 20} fill={NEUTRAL} animatedProps={animatedProps2} />
        <AnimatedCircle cx={CENTER - 30} cy={CENTER + 70} fill={NEUTRAL} animatedProps={animatedProps3} />
        <AnimatedCircle cx={CENTER + 40} cy={CENTER - 60} fill={NEUTRAL} animatedProps={animatedProps1} />
      </Svg>
    </View>
  );
};

// ─── Illustration 2 : Progression ───────────────────────────
// A smooth curve that fills up gradually from left to right.
export const IllustrationProgress: React.FC = () => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withDelay(500, withTiming(0, { duration: 500 }))
      ),
      -1,
      false
    );
  }, []);

  // SVG Path length is approx 180 for this curve.
  const pathLength = 200;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: pathLength - pathLength * progress.value,
  }));

  const d = `M 40 ${CENTER + 20} C 80 ${CENTER - 40}, 160 ${CENTER + 60}, 200 ${CENTER - 20}`;

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Background Track */}
        <Path d={d} stroke={NEUTRAL} strokeWidth={8} strokeLinecap="round" fill="none" />
        {/* Animated Fill */}
        <AnimatedPath
          d={d}
          stroke={ACCENT}
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={pathLength}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
};

// ─── Illustration 3 : Decay (Jour manqué) ───────────────────
// A shape that calmly fades from accent color to neutral gray, no red/cross.
export const IllustrationDecay: React.FC = () => {
  const transition = useSharedValue(0);

  useEffect(() => {
    transition.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 800 }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withDelay(800, withTiming(0, { duration: 400 }))
      ),
      -1,
      false
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    fill: interpolateColor(transition.value, [0, 1], [ACCENT, NEUTRAL]),
    stroke: interpolateColor(transition.value, [0, 1], ['transparent', '#444']),
    strokeWidth: 2,
  }));

  const d = `M ${CENTER - 30} ${CENTER} A 30 30 0 1 1 ${CENTER + 30} ${CENTER} A 30 30 0 1 1 ${CENTER - 30} ${CENTER}`;

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <AnimatedPath d={d} animatedProps={animatedProps} />
      </Svg>
    </View>
  );
};

// ─── Illustration 4 : Palette ───────────────────────────────
// Three neutral dots that light up one by one in different colors.
export const IllustrationPalette: React.FC = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const dur = 600;
    dot1.value = withRepeat(
      withSequence(
        withDelay(200, withTiming(1, { duration: dur })),
        withDelay(2000, withTiming(0, { duration: dur }))
      ),
      -1, false
    );
    dot2.value = withRepeat(
      withSequence(
        withDelay(400, withTiming(1, { duration: dur })),
        withDelay(1800, withTiming(0, { duration: dur }))
      ),
      -1, false
    );
    dot3.value = withRepeat(
      withSequence(
        withDelay(600, withTiming(1, { duration: dur })),
        withDelay(1600, withTiming(0, { duration: dur }))
      ),
      -1, false
    );
  }, []);

  const props1 = useAnimatedProps(() => ({
    fill: interpolateColor(dot1.value, [0, 1], [NEUTRAL, '#3b82f6']),
    r: 16 + dot1.value * 4,
  }));
  const props2 = useAnimatedProps(() => ({
    fill: interpolateColor(dot2.value, [0, 1], [NEUTRAL, '#8b5cf6']),
    r: 16 + dot2.value * 4,
  }));
  const props3 = useAnimatedProps(() => ({
    fill: interpolateColor(dot3.value, [0, 1], [NEUTRAL, '#f59e0b']),
    r: 16 + dot3.value * 4,
  }));

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <AnimatedCircle cx={CENTER - 50} cy={CENTER} animatedProps={props1} />
        <AnimatedCircle cx={CENTER} cy={CENTER} animatedProps={props2} />
        <AnimatedCircle cx={CENTER + 50} cy={CENTER} animatedProps={props3} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE,
    height: SIZE,
    marginBottom: 20,
  },
});
