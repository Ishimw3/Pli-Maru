import React, { useEffect } from 'react';
import { StyleSheet, View, StatusBar, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HabitProvider, useHabit } from './src/context/HabitContext';
import { CircleContainer } from './src/components/CircleContainer';

/**
 * Inner app shell — reads context to check loading state
 * and auto-creates a first habit if none exists yet.
 */
function AppContent() {
  const { isLoaded, activeHabit, createHabit } = useHabit();

  // Bootstrap: create a default habit on first launch
  useEffect(() => {
    if (isLoaded && !activeHabit) {
      createHabit('', '#8b5cf6', 30);
    }
  }, [isLoaded, activeHabit]);

  if (!isLoaded) {
    return (
      <View style={styles.content}>
        <ActivityIndicator color="#8b5cf6" />
      </View>
    );
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
        <AppContent />
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
