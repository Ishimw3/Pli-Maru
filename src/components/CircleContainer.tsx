import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useHabit } from '../context/HabitContext';
import { useTheme } from '../themes/ThemeContext';
import { TransitionOverlay } from './TransitionOverlay';
import { StatsOverlay } from './StatsOverlay';
import { SettingsOverlay } from './SettingsOverlay';
import { ThemePickerOverlay } from './ThemePickerOverlay';
import { OnboardingScreen } from './OnboardingScreen';

/**
 * MainScreen controller — bridges core state (useHabit) and the active theme.
 *
 * This component owns NO rendering logic. It:
 *  1. Reads business state from HabitContext
 *  2. Resolves the active theme from ThemeContext
 *  3. Builds ThemeProps and passes them to the theme component
 *  4. Manages overlay visibility (Transition, Stats, Settings)
 */
export const CircleContainer = () => {
  const {
    activeHabit,
    habitColor,
    isCheckedToday,
    cycleProgress,
    currentCycleDays,
    completedCycles,
    toggleCheckIn,
    appSettings,
  } = useHabit();

  const { activeTheme } = useTheme();

  const [showDays, setShowDays] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // ─── Callbacks for the theme ──────────────────────────────

  const handleToggleCheckIn = useCallback(() => {
    if (!activeHabit) {
      setShowTransition(true);
    } else {
      toggleCheckIn();
    }
  }, [activeHabit, toggleCheckIn]);

  const handleOpenTransition = useCallback(() => {
    setShowTransition(true);
  }, []);

  const handleOpenStats = useCallback(() => {
    setShowStats(true);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleLongPressStart = useCallback(() => {
    setShowDays(true);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    setShowDays(false);
  }, []);

  // ─── Render active theme + overlays ───────────────────────

  const ThemeComponent = activeTheme.component;

  return (
    <>
      <ThemeComponent
        isCheckedToday={isCheckedToday}
        cycleProgressPercent={cycleProgress * 100}
        completedCyclesCount={completedCycles.length}
        habitColor={habitColor}
        completedCycles={completedCycles}
        onToggleCheckIn={handleToggleCheckIn}
        onOpenTransition={handleOpenTransition}
        onOpenStats={handleOpenStats}
        onOpenSettings={handleOpenSettings}
        onLongPressStart={handleLongPressStart}
        onLongPressEnd={handleLongPressEnd}
        currentCycleDays={currentCycleDays}
        showDays={showDays}
        soundEnabled={appSettings.soundEnabled !== false}
      />

      {!activeHabit && (
        <Animated.View entering={FadeIn.delay(1000).duration(1500)} style={styles.neutralPromptContainer} pointerEvents="none">
          <Text style={styles.neutralPromptText}>Touchez le cercle pour choisir une couleur et démarrer</Text>
        </Animated.View>
      )}

      <TransitionOverlay visible={showTransition} isFirstLaunch={!activeHabit} onClose={() => setShowTransition(false)} />
      <StatsOverlay visible={showStats} onClose={() => setShowStats(false)} />
      {showSettings && (
        <SettingsOverlay
          visible={showSettings}
          onClose={() => setShowSettings(false)}
          onOpenThemePicker={() => {
            setShowSettings(false);
            setShowThemePicker(true);
          }}
          onOpenTutorial={() => {
            setShowSettings(false);
            setShowTutorial(true);
          }}
        />
      )}
      {showThemePicker && (
        <ThemePickerOverlay onClose={() => setShowThemePicker(false)} />
      )}
      {showTutorial && (
        <OnboardingScreen onComplete={() => setShowTutorial(false)} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  neutralPromptContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  neutralPromptText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.5,
  }
});
