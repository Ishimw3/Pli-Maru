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
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import type { ThemeProps } from '../types';

const { width, height } = Dimensions.get('window');
const BLADE_MAX_HEIGHT = height * 0.5;
const HILT_HEIGHT = 140;
const HILT_WIDTH = 34;
const BLADE_WIDTH = 14;

export const SabreLaserTheme: React.FC<ThemeProps> = ({
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

  // Blade height based on progress
  const progressAnim = useSharedValue(cycleProgress);
  // Blade visual effects for ignition
  const bladeScaleX = useSharedValue(isCheckedToday ? 1.05 : 1);
  const glowOpacity = useSharedValue(isCheckedToday ? 1 : 0.6);

  // Swipe states
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Post-check ephemeral text state (AGENTS.md §10 exception)
  const textOpacity = useSharedValue(0);
  const [postCheckVisible, setPostCheckVisible] = useState(false);

  useEffect(() => {
    const isDecay = cycleProgress < progressAnim.value;
    progressAnim.value = withTiming(cycleProgress, {
      duration: isDecay ? 800 : 500,
      easing: Easing.inOut(Easing.ease),
    });
    
    // Idle state visual difference
    bladeScaleX.value = withTiming(isCheckedToday ? 1.05 : 1, { duration: 300 });
    glowOpacity.value = withTiming(isCheckedToday ? 1 : 0.6, { duration: 300 });
  }, [cycleProgress, isCheckedToday]);

  const triggerPostCheckEffect = useCallback(() => {
    setPostCheckVisible(true);
    textOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(1800, withTiming(0, { duration: 400 }))
    );
    setTimeout(() => {
      setPostCheckVisible(false);
    }, 2600);
  }, []);

  // ─── Styles animés ────────────────────────────────────────

  const animatedBladeStyle = useAnimatedStyle(() => ({
    height: progressAnim.value * BLADE_MAX_HEIGHT,
    transform: [{ scaleX: bladeScaleX.value }],
    shadowOpacity: glowOpacity.value,
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
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

  const singleTapGesture = Gesture.Tap().onEnd(() => {
    if (translateX.value !== 0) {
      translateX.value = withSpring(0, { damping: 15 });
    } else {
      if (!isCheckedToday) {
        // Ignition Flash Effect
        bladeScaleX.value = withSequence(
          withTiming(1.6, { duration: 60 }),
          withSpring(1.05, { damping: 10, stiffness: 200 })
        );
        glowOpacity.value = withSequence(
          withTiming(1, { duration: 60 }),
          withTiming(0.8, { duration: 100 }),
          withTiming(1, { duration: 200 })
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
        <Animated.View style={[styles.sabreWrapper, animatedContainerStyle]}>
          
          {/* Blade Area */}
          <View style={[styles.bladeContainer, { height: BLADE_MAX_HEIGHT }]}>
            <Animated.View 
              style={[
                styles.blade,
                { 
                  backgroundColor: '#fff',
                  shadowColor: habitColor, 
                },
                animatedBladeStyle
              ]} 
            />
          </View>

          {/* Hilt (Manche) */}
          <View style={styles.hilt}>
            {/* Top guard */}
            <View style={styles.hiltGuard} />
            
            {/* Hilt Body */}
            <View style={styles.hiltBody}>
              {/* Completed Cycles as Hilt Rings */}
              <View style={styles.ringsContainer}>
                {completedCycles.map((cycle, i) => (
                  <View 
                    key={`ring-${i}-${cycle.completedAt}`} 
                    style={[styles.hiltRing, { borderColor: habitColor }]} 
                  />
                ))}
              </View>
            </View>

            {/* Pommel */}
            <View style={styles.hiltPommel} />
          </View>

          {/* Hologram Text Overlays */}
          {showDays && !postCheckVisible && (
            <View style={styles.hologramContainer} pointerEvents="none">
              <Text style={[styles.daysText, { color: isCheckedToday ? habitColor : '#666' }]}>
                {currentCycleDays}
              </Text>
            </View>
          )}

          {postCheckVisible && (
            <Animated.View style={[styles.hologramContainer, { opacity: textOpacity }]} pointerEvents="none">
              <Text style={[styles.postCheckText, { color: habitColor }]}>
                FAIT
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
    justifyContent: 'center', // Center vertically
  },
  sabreWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end', // Stack from bottom
    height: BLADE_MAX_HEIGHT + HILT_HEIGHT,
  },
  bladeContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -5, // overlap hilt slightly
  },
  blade: {
    width: BLADE_WIDTH,
    borderTopLeftRadius: BLADE_WIDTH / 2,
    borderTopRightRadius: BLADE_WIDTH / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 20,
  },
  hilt: {
    alignItems: 'center',
    zIndex: 10,
  },
  hiltGuard: {
    width: HILT_WIDTH + 8,
    height: 12,
    backgroundColor: '#444',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#222',
  },
  hiltBody: {
    width: HILT_WIDTH,
    height: HILT_HEIGHT - 32, // guard + pommel
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#111',
    alignItems: 'center',
    paddingVertical: 10,
  },
  ringsContainer: {
    flexDirection: 'column-reverse', // Grow from bottom up
    width: '100%',
    gap: 6,
    paddingHorizontal: 2,
  },
  hiltRing: {
    width: '100%',
    height: 4,
    backgroundColor: '#111',
    borderWidth: 1,
  },
  hiltPommel: {
    width: HILT_WIDTH + 4,
    height: 20,
    backgroundColor: '#333',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: '#111',
  },
  hologramContainer: {
    position: 'absolute',
    top: BLADE_MAX_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  daysText: {
    fontSize: 42,
    fontWeight: '300',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  postCheckText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  hiddenButtonContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  transitionBtn: {
    transform: [{ translateX: width * 0.35 }],
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
