import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { useHabit } from '../context/HabitContext';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  IllustrationFocus,
  IllustrationProgress,
  IllustrationDecay,
  IllustrationPalette,
} from './TutorialIllustrations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e',
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

const STEPS = [
  {
    sentence: 'Une habitude à la fois — chaque jour, tu la coches.',
    Illustration: IllustrationFocus,
  },
  {
    sentence: "L'anneau se remplit au fil des jours ; chaque cycle complété laisse une trace définitive.",
    Illustration: IllustrationProgress,
  },
  {
    sentence: "Un jour manqué ? Rien de perdu — l'anneau revient doucement en arrière, c'est tout.",
    Illustration: IllustrationDecay,
  },
];

// ─── Slide components ─────────────────────────────────────────

interface SlideProps {
  index: number;
  onStart: () => void;
}

const Slide: React.FC<SlideProps> = ({ index, onStart }) => {
  const step = STEPS[index];
  const Illustration = step.Illustration;
  const isLast = index === STEPS.length - 1;

  return (
    <View style={[styles.slide]}>
      <View style={styles.illustrationContainer}>
        <Illustration />
      </View>

      {step.sentence ? (
        <Text style={styles.sentence}>{step.sentence}</Text>
      ) : null}

      {isLast && (
        <Animated.View entering={FadeInDown.duration(500)} style={styles.lastStepContent}>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: '#8b5cf6' }]}
            onPress={onStart}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Commencer</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { updateSettings } = useHabit();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleStart = () => {
    updateSettings({ hasSeenOnboarding: true });
    onComplete();
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const renderItem = ({ index }: { item: (typeof STEPS)[0]; index: number }) => (
    <KeyboardAvoidingView
      style={{ width: SCREEN_WIDTH }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.slideScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Slide
          index={index}
          onStart={handleStart}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={STEPS}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {/* Pagination dots + skip */}
      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {STEPS.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.paginationDot,
                idx === currentIndex && [
                  styles.paginationDotActive,
                  { backgroundColor: '#8b5cf6' },
                ],
              ]}
            />
          ))}
        </View>

        {currentIndex < STEPS.length - 1 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleStart}
            activeOpacity={0.6}
          >
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 20,
  },
  slideScrollContent: {
    flexGrow: 1,
  },
  illustrationContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentence: {
    fontSize: 20,
    fontWeight: '300',
    color: '#ddd',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: 0.3,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  lastStepContent: {
    width: '100%',
    alignItems: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },
  input: {
    width: '100%',
    backgroundColor: '#161616',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    color: '#fff',
    fontSize: 17,
    marginBottom: 24,
    textAlign: 'center',
  },
  startButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
    position: 'relative',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#333',
  },
  paginationDotActive: {
    width: 20,
    borderRadius: 4,
  },
  skipButton: {
    position: 'absolute',
    right: 28,
  },
  skipText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '400',
  },
});
