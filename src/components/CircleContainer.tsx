import React, { useState, useEffect } from 'react';
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
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useHabit } from '../context/HabitContext';
import { TransitionOverlay } from './TransitionOverlay';
import { StatsOverlay } from './StatsOverlay';
import { SettingsOverlay } from './SettingsOverlay';

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

export const CircleContainer = () => {
  const {
    habitColor,
    isCheckedToday,
    cycleProgress,
    currentCycleDays,
    completedCycles,
    toggleCheckIn,
  } = useHabit();

  const [showDays, setShowDays] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const fillProgress = useSharedValue(isCheckedToday ? 1 : 0);
  const ringProgress = useSharedValue(cycleProgress);
  const translateX = useSharedValue(0); // For lateral swipe
  const translateY = useSharedValue(0); // For swipe down (Stats)

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
    ],
  }));

  // ─── Gestures ─────────────────────────────────────────────

  // Triple tap hidden gesture to open Settings
  const tripleTapGesture = Gesture.Tap()
    .numberOfTaps(3)
    .onEnd(() => {
      runOnJS(setShowSettings)(true);
    });

  const singleTapGesture = Gesture.Tap().onEnd(() => {
    if (translateX.value !== 0) {
      translateX.value = withSpring(0, { damping: 15 });
    } else {
      runOnJS(toggleCheckIn)();
    }
  });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      if (translateX.value === 0 && translateY.value === 0) {
        runOnJS(setShowDays)(true);
      }
    })
    .onEnd(() => {
      runOnJS(setShowDays)(false);
    })
    .onFinalize(() => {
      runOnJS(setShowDays)(false);
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
          runOnJS(setShowStats)(true);
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

  // ─── Handlers ─────────────────────────────────────────────

  const handleOpenTransition = () => {
    translateX.value = withSpring(0, { damping: 15 });
    setShowTransition(true);
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
          {showDays && (
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
        </Animated.View>
      </GestureDetector>

      <TransitionOverlay visible={showTransition} onClose={() => setShowTransition(false)} />
      <StatsOverlay visible={showStats} onClose={() => setShowStats(false)} />
      <SettingsOverlay visible={showSettings} onClose={() => setShowSettings(false)} />
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
