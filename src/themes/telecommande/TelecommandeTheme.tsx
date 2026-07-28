import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useAudioPlayer } from 'expo-audio';
import type { ThemeProps } from '../types';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = width * 0.55;
const PROGRESS_LEDS_COUNT = 10;

export const TelecommandeTheme: React.FC<ThemeProps> = ({
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
  const player = useAudioPlayer(require('../../../../assets/sounds/click.wav'));
  // Shared values
  const buttonPressScale = useSharedValue(isCheckedToday ? 0.95 : 1);
  const buttonPressElevation = useSharedValue(isCheckedToday ? 2 : 15);
  const indicatorOpacity = useSharedValue(isCheckedToday ? 1 : 0);
  const progressAnim = useSharedValue(cycleProgressPercent);

  // Swipe states
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Post-check ephemeral text state (AGENTS.md §10 exception)
  const textOpacity = useSharedValue(0);
  const [postCheckVisible, setPostCheckVisible] = useState(false);

  useEffect(() => {
    buttonPressScale.value = withSpring(isCheckedToday ? 0.95 : 1, { damping: 15, stiffness: 150 });
    buttonPressElevation.value = withTiming(isCheckedToday ? 2 : 15, { duration: 300 });
    indicatorOpacity.value = withTiming(isCheckedToday ? 1 : 0, { duration: 300 });
  }, [isCheckedToday]);

  useEffect(() => {
    const isDecay = cycleProgressPercent < progressAnim.value;
    progressAnim.value = withTiming(cycleProgressPercent, {
      duration: isDecay ? 800 : 500,
      easing: Easing.inOut(Easing.ease),
    });
  }, [cycleProgressPercent]);

  const triggerPostCheckEffect = useCallback(() => {
    setPostCheckVisible(true);
    textOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(1800, withTiming(0, { duration: 400 }))
    );
    setTimeout(() => {
      setPostCheckVisible(false);
    }, 2600);
  }, []);

  // ─── Styles animés ────────────────────────────────────────

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonPressScale.value }],
    shadowOffset: { width: 0, height: buttonPressElevation.value },
    shadowOpacity: interpolate(buttonPressElevation.value, [2, 15], [0.3, 0.6]),
    shadowRadius: buttonPressElevation.value,
    elevation: buttonPressElevation.value,
  }));

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
  }));

  const animatedTranslateStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // ─── Gestures ─────────────────────────────────────────────

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
    if (!isCheckedToday) {
      triggerPostCheckEffect();
    }
    onToggleCheckIn();
  };

  const singleTapGesture = Gesture.Tap().onEnd(() => {
    if (translateX.value !== 0) {
      translateX.value = withSpring(0, { damping: 15 });
    } else {
      runOnJS(handleTap)();
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

  // ─── Diodes de progression ────────────────────────────────
  
  const progressLeds = Array.from({ length: PROGRESS_LEDS_COUNT }).map((_, i) => {
    const thresholdStart = i * (100 / PROGRESS_LEDS_COUNT);
    const thresholdEnd = (i + 1) * (100 / PROGRESS_LEDS_COUNT);
    
    const ledStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        progressAnim.value,
        [thresholdStart, thresholdEnd],
        [0.1, 1],
        Extrapolation.CLAMP
      );
      return { opacity };
    });

    return (
      <Animated.View
        key={`progress-led-${i}`}
        style={[styles.progressLed, { backgroundColor: habitColor }, ledStyle]}
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
        <Animated.View style={[styles.deviceWrapper, animatedTranslateStyle]}>
          
          {/* Progress LEDs Row */}
          <View style={styles.progressRow}>
            {progressLeds}
          </View>

          <View style={styles.centerArea}>
            {/* The Main Button */}
            <Animated.View style={[styles.physicalButton, animatedButtonStyle]}>
              <View style={styles.buttonInner}>
                <Animated.View style={[styles.buttonLed, { backgroundColor: habitColor, shadowColor: habitColor }, animatedIndicatorStyle]} />
              </View>
            </Animated.View>

            {/* Completed Cycles Column (on the right) */}
            <View style={styles.completedColumn}>
              {completedCycles.map((cycle, i) => (
                <View
                  key={`completed-${cycle.completedAt}-${i}`}
                  style={[styles.completedLed, { backgroundColor: habitColor, borderColor: '#fff' }]}
                />
              ))}
            </View>
          </View>

          {/* Ephemeral Overlays */}
          {showDays && !postCheckVisible && (
            <View style={styles.overlayTextContainer} pointerEvents="none">
              <Text style={[styles.daysText, { color: isCheckedToday ? habitColor : '#666' }]}>
                {currentCycleDays}
              </Text>
            </View>
          )}

          {postCheckVisible && (
            <Animated.View style={[styles.overlayTextContainer, { opacity: textOpacity }]} pointerEvents="none">
              <Text style={[styles.postCheckText, { color: habitColor }]}>
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
  deviceWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#161616', // Remote body color
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  progressLed: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  centerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  physicalButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 4,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
  },
  buttonInner: {
    width: BUTTON_SIZE - 20,
    height: BUTTON_SIZE - 20,
    borderRadius: (BUTTON_SIZE - 20) / 4,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLed: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  completedColumn: {
    position: 'absolute',
    right: -25,
    flexDirection: 'column-reverse', // Grow upwards
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedLed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  overlayTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysText: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  postCheckText: {
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  hiddenButtonContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  transitionBtn: {
    transform: [{ translateX: BUTTON_SIZE / 2 + 30 }],
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
