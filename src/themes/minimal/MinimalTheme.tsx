import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  runOnJS,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useAudioPlayer } from 'expo-audio';
import type { ThemeProps } from '../types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle);

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.65;
const STROKE_WIDTH = 3.5;
const RING_GAP = STROKE_WIDTH * 3;
const RING_RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const INNER_RADIUS = RING_RADIUS - RING_GAP;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const DOT_RADIUS = 3.5;
const DOT_DISTANCE = RING_RADIUS + 14;
const PADDING = 60;
const CENTER = (CIRCLE_SIZE + PADDING) / 2;

/**
 * Minimal Theme — the default, free theme (AGENTS.md §13).
 *
 * Pure presentation component: receives ThemeProps, renders the circle,
 * progress ring, completion dots, and handles gesture detection.
 * Contains zero business logic.
 */
export const MinimalTheme: React.FC<ThemeProps> = ({
  isCheckedToday,
  cycleProgressPercent,
  completedCyclesCount,
  habitColor,
  completedCycles,
  onToggleCheckIn,
  onOpenTransition,
  onOpenStats,
  onOpenSettings,
  onLongPressStart,
  onLongPressEnd,
  currentCycleDays,
  showDays,
  soundEnabled,
}) => {
  const player = useAudioPlayer(require('../../../../assets/sounds/neutral.wav'));
  const cycleProgress = cycleProgressPercent / 100; // Convert to 0–1 for internal rendering

  const fillProgress = useSharedValue(isCheckedToday ? 1 : 0);
  const ringProgress = useSharedValue(cycleProgress);
  const translateX = useSharedValue(0); // For lateral swipe
  const translateY = useSharedValue(0); // For swipe down (Stats)
  const scale = useSharedValue(1); // For bounce animation
  const textOpacity = useSharedValue(0); // For ephemeral text fade

  const [postCheckVisible, setPostCheckVisible] = useState(false);

  const triggerPostCheckEffect = useCallback(() => {
    // 1. Trigger the text
    setPostCheckVisible(true);
    textOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(1800, withTiming(0, { duration: 400 }))
    );
    setTimeout(() => {
      setPostCheckVisible(false);
    }, 2600); // 300 + 1800 + 400 = 2500ms + margin
  }, []);

  // ─── Animations ───────────────────────────────────────────

  useEffect(() => {
    fillProgress.value = withTiming(isCheckedToday ? 1 : 0, {
      duration: 350,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isCheckedToday]);

  useEffect(() => {
    const isDecay = cycleProgress < ringProgress.value;
    ringProgress.value = withTiming(cycleProgress, {
      duration: isDecay ? 800 : 500,
      easing: Easing.inOut(Easing.ease),
    });
  }, [cycleProgress]);

  const animatedFillProps = useAnimatedProps(() => ({
    fill: interpolateColor(
      fillProgress.value,
      [0, 1],
      ['transparent', habitColor],
    ),
  }));

  const animatedRingProps = useAnimatedProps(() => {
    const offset = CIRCUMFERENCE - ringProgress.value * CIRCUMFERENCE;
    return {
      strokeDashoffset: offset,
    };
  });

  const animatedTranslateStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // ─── Gestures ─────────────────────────────────────────────

  // Triple tap hidden gesture to open Settings
  const tripleTapGesture = Gesture.Tap()
    .numberOfTaps(3)
    .onEnd(() => {
      runOnJS(onOpenSettings)();
    });

  const handleTap = () => {
    if (soundEnabled) {
      player.volume = 0.3;
      player.play();
    }
    if (translateX.value !== 0) {
      translateX.value = withSpring(0, { damping: 15 });
    } else {
      if (!isCheckedToday) {
        // Trigger micro-animation and ephemeral text
        scale.value = withSequence(
          withTiming(0.92, { duration: 120 }),
          withSpring(1, { damping: 12, stiffness: 200 })
        );
        runOnJS(triggerPostCheckEffect)();
      }
      runOnJS(onToggleCheckIn)();
    }
  };

  const singleTapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handleTap)();
  });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      if (translateX.value === 0 && translateY.value === 0) {
        runOnJS(onLongPressStart)();
      }
    })
    .onEnd(() => {
      runOnJS(onLongPressEnd)();
    })
    .onFinalize(() => {
      runOnJS(onLongPressEnd)();
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
        translateX.value = Math.max(-110, Math.min(0, e.translationX));
        translateY.value = 0;
      } else {
        translateX.value = 0;
        translateY.value = Math.max(0, Math.min(120, e.translationY));
      }
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
        if (e.translationX < -40) {
          translateX.value = withSpring(-100, { damping: 15 });
        } else {
          translateX.value = withSpring(0, { damping: 15 });
        }
      } else {
        if (e.translationY > 50) {
          runOnJS(onOpenStats)();
        }
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Exclusive(tripleTapGesture, longPressGesture, singleTapGesture),
    panGesture
  );

  // ─── Completion dots ──────────────────────────────────────

  const dots = completedCycles.map((cycle, i) => {
    const angleRad = ((cycle.dotAngle - 90) * Math.PI) / 180;
    const cx = CENTER + DOT_DISTANCE * Math.cos(angleRad);
    const cy = CENTER + DOT_DISTANCE * Math.sin(angleRad);
    return { cx, cy, key: `dot-${i}-${cycle.completedAt}` };
  });

  // ─── Transition button handler ────────────────────────────

  const handleOpenTransition = () => {
    translateX.value = withSpring(0, { damping: 15 });
    onOpenTransition();
  };

  return (
    <View style={styles.container}>
      {/* Hidden Transition Button */}
      <View style={styles.hiddenButtonContainer} pointerEvents="box-none">
        <TouchableOpacity onPress={handleOpenTransition} style={styles.transitionBtn}>
          <View style={[styles.transitionIconWrapper, { borderColor: habitColor }]}>
            <Text style={[styles.transitionIcon, { color: habitColor }]}>→</Text>
          </View>
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.circleWrapper, animatedTranslateStyle]}>
          <Svg width={CIRCLE_SIZE + PADDING} height={CIRCLE_SIZE + PADDING}>
            {/* Background ring track */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RING_RADIUS}
              stroke={habitColor}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              opacity={0.1}
            />

            {/* Animated progress ring */}
            <AnimatedSvgCircle
              cx={CENTER}
              cy={CENTER}
              r={RING_RADIUS}
              stroke={habitColor}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeLinecap="round"
              fill="none"
              originX={CENTER}
              originY={CENTER}
              rotation={-90}
              opacity={0.55}
              animatedProps={animatedRingProps}
            />

            {/* Inner circle — outline */}
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={INNER_RADIUS}
              stroke={habitColor}
              strokeWidth={1.5}
              fill="none"
              opacity={0.35}
            />

            {/* Inner circle — fill */}
            <AnimatedCircle
              cx={CENTER}
              cy={CENTER}
              r={INNER_RADIUS}
              stroke="none"
              strokeWidth={0}
              animatedProps={animatedFillProps}
            />

            {/* Completion dots */}
            {dots.map((dot) => (
              <Circle
                key={dot.key}
                cx={dot.cx}
                cy={dot.cy}
                r={DOT_RADIUS}
                fill={habitColor}
                opacity={0.9}
              />
            ))}
          </Svg>

          {/* Ephemeral day count */}
          {showDays && !postCheckVisible && (
            <View style={styles.daysOverlay} pointerEvents="none">
              <Text
                style={[
                  styles.daysText,
                  { color: isCheckedToday ? '#080808' : habitColor },
                ]}
              >
                {currentCycleDays}
              </Text>
            </View>
          )}

          {/* Ephemeral post-check text */}
          {postCheckVisible && (
            <Animated.View style={[styles.daysOverlay, { opacity: textOpacity }]} pointerEvents="none">
              <Text style={[styles.postCheckText, { color: '#080808' }]}>
                Fait
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysText: {
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: 1,
  },
  postCheckText: {
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 1,
  },
  hiddenButtonContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  transitionBtn: {
    transform: [{ translateX: CIRCLE_SIZE / 2 - 10 }],
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  transitionIcon: {
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 22,
    marginLeft: 2,
  },
});
