import React from 'react';
import { StyleSheet, View, StatusBar, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HabitProvider, useHabit } from './src/context/HabitContext';
import { ThemeProvider } from './src/themes/ThemeContext';
import { CircleContainer } from './src/components/CircleContainer';
import { AnimatedSplashScreen } from './src/components/AnimatedSplashScreen';
import { OnboardingScreen } from './src/components/OnboardingScreen';

/**
 * Inner app shell — reads context to check loading state.
 * Boot flow: SPLASH → ONBOARDING (first launch only) → MAIN
 */
function AppContent() {
  const { isLoaded, appSettings } = useHabit();
  const [splashFinished, setSplashFinished] = React.useState(false);

  if (!splashFinished) {
    return <AnimatedSplashScreen onFinish={() => setSplashFinished(true)} />;
  }

  // Fallback if data is taking exceptionally long to load
  if (!isLoaded) {
    return (
      <View style={styles.content}>
        <ActivityIndicator color="#8b5cf6" />
      </View>
    );
  }

  // First-launch: onboarding flow (hasSeenOnboarding is set by OnboardingScreen itself)
  if (!appSettings.hasSeenOnboarding) {
    // onComplete is a no-op here — AppContent re-renders reactively
    // when HabitContext updates hasSeenOnboarding via updateSettings
    return <OnboardingScreen onComplete={() => {}} />;
  }

  return (
    <View style={styles.content}>
      <CircleContainer />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <HabitProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </HabitProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
