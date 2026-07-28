import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import type { ThemeProps } from '../types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width } = Dimensions.get('window');
const WATCH_SIZE = width * 0.75;
const PADDING = 40;
const CENTER = (WATCH_SIZE + PADDING) / 2;

// The ring that fills up
const RING_RADIUS = WATCH_SIZE * 0.35;
const RING_STROKE = WATCH_SIZE * 0.2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// The ticks on the bezel
const TICK_INNER_RADIUS = WATCH_SIZE * 0.45;
const TICK_OUTER_RADIUS = WATCH_SIZE * 0.48;

export const MinuteurSportTheme: React.FC<ThemeProps> = ({
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
}) => {
  const cycleProgress = cycleProgressPercent / 100;

  // Mechanical click effect (Watch body)
  const clickRotate = useSharedValue(0);
  const clickScale = useSharedValue(1);
  
  // Progress anims
  const progressAnim = useSharedValue(cycleProgress);
  const needleRotation = useSharedValue(cycleProgress * 360);

  // Swipe states
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Ephemeral text state
  const textOpacity = useSharedValue(0);
  const [postCheckVisible, setPostCheckVisible] = useState(false);

  useEffect(() => {
    const isDecay = cycleProgress < progressAnim.value;
    progressAnim.value = withTiming(cycleProgress, {
      duration: isDecay ? 800 : 500,
      easing: Easing.inOut(Easing.ease),
    });
    
    // Needle spring is livelier
    needleRotation.value = withSpring(cycleProgress * 360, {
      damping: 12,
      stiffness: 100,
      mass: 0.8
    });
  }, [cycleProgress]);

  const triggerPostCheckEffect = useCallback(() => {
    setPostCheckVisible(true);
    textOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(2000, withTiming(0, { duration: 400 }))
    );
    setTimeout(() => {
      setPostCheckVisible(false);
    }, 2800);
  }, []);

  // ─── Styles animés ────────────────────────────────────────

  const animatedRingProps = useAnimatedProps(() => {
    const offset = CIRCUMFERENCE - progressAnim.value * CIRCUMFERENCE;
    return {
      strokeDashoffset: offset,
    };
  });

  const animatedNeedleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotateZ: `${needleRotation.value}deg` }
      ],
    };
  });

  const animatedWatchStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: clickScale.value },
      { rotateZ: `${clickRotate.value}deg` }
    ],
  }));

  // ─── Gestures ─────────────────────────────────────────────

  const tripleTapGesture = Gesture.Tap()
    .numberOfTaps(3)
    .onEnd(() => {
      runOnJS(onOpenSettings)();
    });

  const singleTapGesture = Gesture.Tap().onEnd(() => {
    if (translateX.value !== 0) {
      translateX.value = withSpring(0, { damping: 15 });
    } else {
      if (!isCheckedToday) {
        // Mechanical click simulation
        clickScale.value = withSequence(
          withTiming(0.96, { duration: 50, easing: Easing.out(Easing.quad) }),
          withSpring(1, { damping: 10, stiffness: 400 })
        );
        clickRotate.value = withSequence(
          withTiming(2, { duration: 50 }),
          withSpring(0, { damping: 10, stiffness: 400 })
        );
        // Little bounce to needle
        needleRotation.value = withSequence(
          withTiming(needleRotation.value + 5, { duration: 80 }),
          withSpring(cycleProgress * 360, { damping: 10, stiffness: 200 })
        );
        runOnJS(triggerPostCheckEffect)();
      }
      runOnJS(onToggleCheckIn)();
    }
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

  // ─── SVG Elements ─────────────────────────────────────────

  // Render completed cycles as thick ticks on the bezel
  const completedTicks = completedCycles.map((cycle, i) => {
    const angleRad = ((cycle.dotAngle - 90) * Math.PI) / 180;
    const x1 = CENTER + TICK_INNER_RADIUS * Math.cos(angleRad);
    const y1 = CENTER + TICK_INNER_RADIUS * Math.sin(angleRad);
    const x2 = CENTER + TICK_OUTER_RADIUS * Math.cos(angleRad);
    const y2 = CENTER + TICK_OUTER_RADIUS * Math.sin(angleRad);
    
    return (
      <Line
        key={`tick-${i}-${cycle.completedAt}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={habitColor}
        strokeWidth={4}
        strokeLinecap="round"
      />
    );
  });

  // Base subtle markings for the analog watch face (e.g. 12 small ticks)
  const baseTicks = Array.from({ length: 12 }).map((_, i) => {
    const angleRad = ((i * 30 - 90) * Math.PI) / 180;
    const isCardinal = i % 3 === 0;
    const r1 = CENTER + (TICK_INNER_RADIUS - (isCardinal ? 5 : 0)) * Math.cos(angleRad);
    const y1 = CENTER + (TICK_INNER_RADIUS - (isCardinal ? 5 : 0)) * Math.sin(angleRad);
    const r2 = CENTER + TICK_OUTER_RADIUS * Math.cos(angleRad);
    const y2 = CENTER + TICK_OUTER_RADIUS * Math.sin(angleRad);
    
    return (
      <Line
        key={`base-tick-${i}`}
        x1={r1}
        y1={y1}
        x2={r2}
        y2={y2}
        stroke="#444"
        strokeWidth={isCardinal ? 3 : 1.5}
      />
    );
  });

  return (
    <View style={styles.container}>
      {/* Hidden Transition Button */}
      <View style={styles.hiddenButtonContainer} pointerEvents="box-none">
        <TouchableOpacity onPress={() => {
          translateX.value = withSpring(0, { damping: 15 });
          onOpenTransition();
        }} style={styles.transitionBtn}>
          <View style={[styles.transitionIconWrapper, { borderColor: habitColor }]}>
            <Text style={[styles.transitionIcon, { color: habitColor }]}>→</Text>
          </View>
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.watchBody, animatedWatchStyle]}>
          
          {/* Top Pusher (decorative) */}
          <View style={styles.pusherTop} />
          {/* Side Crown (decorative) */}
          <View style={styles.crownSide} />

          {/* The Bezel */}
          <View style={styles.bezel}>
            <Svg width={WATCH_SIZE + PADDING} height={WATCH_SIZE + PADDING}>
              {/* Dial Background */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={WATCH_SIZE * 0.48}
                fill="#1A1A1A"
              />

              {/* Progress Ring Track */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={RING_RADIUS}
                stroke="#222"
                strokeWidth={RING_STROKE}
                fill="none"
              />

              {/* Animated Progress Sector */}
              <AnimatedCircle
                cx={CENTER}
                cy={CENTER}
                r={RING_RADIUS}
                stroke={habitColor}
                strokeWidth={RING_STROKE}
                strokeDasharray={CIRCUMFERENCE}
                strokeLinecap="butt"
                fill="none"
                originX={CENTER}
                originY={CENTER}
                rotation={-90}
                opacity={0.3} // Slightly transparent fill
                animatedProps={animatedRingProps}
              />

              {/* Ticks */}
              {baseTicks}
              {completedTicks}
            </Svg>

            {/* Central Pin */}
            <View style={styles.centerPinBase} />

            {/* Needle */}
            <Animated.View style={[styles.needleContainer, animatedNeedleStyle]} pointerEvents="none">
              <View style={[styles.needleTail, { backgroundColor: habitColor }]} />
              <View style={[styles.needlePivot, { backgroundColor: habitColor }]} />
              <View style={[styles.needleBody, { backgroundColor: habitColor }]} />
            </Animated.View>
            <View style={styles.centerPinTop} />

            {/* Ephemeral Text LCD (Lower Half) */}
            {(showDays || postCheckVisible) && (
              <View style={styles.lcdContainer} pointerEvents="none">
                {showDays && !postCheckVisible && (
                  <Text style={[styles.lcdText, { color: isCheckedToday ? habitColor : '#666' }]}>
                    {currentCycleDays}
                  </Text>
                )}
                {postCheckVisible && (
                  <Animated.Text style={[styles.lcdText, { color: habitColor, opacity: textOpacity }]}>
                    FAIT
                  </Animated.Text>
                )}
              </View>
            )}

          </View>
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
  watchBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pusherTop: {
    position: 'absolute',
    top: -15,
    right: 45,
    width: 24,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#444',
  },
  crownSide: {
    position: 'absolute',
    top: '50%',
    right: -10,
    width: 14,
    height: 30,
    marginTop: -15,
    backgroundColor: '#444',
    borderRadius: 4,
  },
  bezel: {
    width: WATCH_SIZE + PADDING,
    height: WATCH_SIZE + PADDING,
    borderRadius: (WATCH_SIZE + PADDING) / 2,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  centerPinBase: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  centerPinTop: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000',
  },
  needleContainer: {
    position: 'absolute',
    width: 4,
    height: WATCH_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  needleTail: {
    width: 4,
    height: WATCH_SIZE * 0.15,
    borderRadius: 2,
    marginTop: WATCH_SIZE * 0.35, // Push down to balance on pivot
  },
  needlePivot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: -6, // Center on the pivot
    marginBottom: -6,
  },
  needleBody: {
    width: 2,
    height: WATCH_SIZE * 0.42, // Points to the ticks
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  lcdContainer: {
    position: 'absolute',
    bottom: WATCH_SIZE * 0.18,
    width: 80,
    height: 34,
    backgroundColor: '#0A0A0A',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lcdText: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 2,
  },
  hiddenButtonContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  transitionBtn: {
    transform: [{ translateX: WATCH_SIZE / 2 + 30 }],
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
