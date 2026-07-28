import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../themes/ThemeContext';
import { useHabit } from '../context/HabitContext';
import type { ThemeDefinition } from '../themes/types';

interface ThemePickerOverlayProps {
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

// Abstract representations for the thumbnails based on theme ID
const ThemeThumbnail: React.FC<{ themeId: string; habitColor: string }> = ({ themeId, habitColor }) => {
  switch (themeId) {
    case 'minimal':
      return (
        <View style={styles.thumbMinimal}>
          <View style={[styles.thumbMinimalInner, { borderColor: habitColor }]} />
        </View>
      );
    case 'telecommande':
      return (
        <View style={styles.thumbRemote}>
          <View style={styles.thumbRemoteDots} />
          <View style={styles.thumbRemoteBtn}>
            <View style={[styles.thumbRemoteLed, { backgroundColor: habitColor }]} />
          </View>
        </View>
      );
    case 'minuteur-sport':
      return (
        <View style={styles.thumbWatch}>
          <View style={styles.thumbWatchBezel}>
            <View style={[styles.thumbWatchHand, { backgroundColor: habitColor }]} />
          </View>
        </View>
      );
    case 'sabre-laser':
      return (
        <View style={styles.thumbSabre}>
          <View style={[styles.thumbSabreBlade, { backgroundColor: '#fff', shadowColor: habitColor }]} />
          <View style={styles.thumbSabreHilt} />
        </View>
      );
    default:
      return <View style={[styles.thumbGeneric, { backgroundColor: habitColor }]} />;
  }
};

export const ThemePickerOverlay: React.FC<ThemePickerOverlayProps> = ({ onClose }) => {
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);
  const { themes, activeTheme, setActiveTheme } = useTheme();
  const { habitColor } = useHabit();

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const handleClose = () => {
    translateY.value = withTiming(height, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 });
    setTimeout(onClose, 300);
  };

  const handleSelectTheme = (theme: ThemeDefinition) => {
    setActiveTheme(theme.id);
  };

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backdrop, animatedOverlayStyle]} pointerEvents="box-none">
        <TouchableOpacity style={styles.backdropButton} onPress={handleClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[styles.panel, animatedContainerStyle]}>
        <View style={styles.header}>
          <Text style={styles.title}>Apparence</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.grid}>
            {themes.map((theme) => {
              const isActive = activeTheme.id === theme.id;

              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.card,
                    isActive && { borderColor: habitColor, borderWidth: 2 },
                  ]}
                  onPress={() => handleSelectTheme(theme)}
                  activeOpacity={0.7}
                >
                  <View style={styles.thumbnailContainer}>
                    <ThemeThumbnail themeId={theme.id} habitColor={habitColor} />
                  </View>
                  
                  <View style={styles.infoContainer}>
                    <Text style={[styles.themeName, isActive && { color: '#fff' }]}>
                      {theme.name}
                    </Text>
                    {theme.isPremium && (
                      <Text style={styles.premiumLabel}>[ PREMIUM ]</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Fermer</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...(StyleSheet.absoluteFill as any),
    zIndex: 200,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  backdropButton: {
    flex: 1,
  },
  panel: {
    backgroundColor: '#111',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 50,
    maxHeight: height * 0.85,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#333',
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  card: {
    width: (width - 55) / 2, // 2 columns with padding and gap
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  thumbnailContainer: {
    height: 120,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  infoContainer: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeName: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
    textAlign: 'center',
  },
  premiumLabel: {
    fontSize: 10,
    color: '#666', // Neutral, non-intrusive grey
    marginTop: 4,
    letterSpacing: 0.5,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 1,
  },

  // Thumbnail Arts
  thumbGeneric: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  thumbMinimal: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbMinimalInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
  },
  thumbRemote: {
    width: 40,
    height: 80,
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  thumbRemoteDots: {
    width: '60%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  thumbRemoteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoteLed: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  thumbWatch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#161616',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbWatchBezel: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    alignItems: 'center',
  },
  thumbWatchHand: {
    width: 2,
    height: 18,
    marginTop: 2,
  },
  thumbSabre: {
    alignItems: 'center',
    height: 80,
    justifyContent: 'flex-end',
  },
  thumbSabreBlade: {
    width: 6,
    height: 50,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
  },
  thumbSabreHilt: {
    width: 14,
    height: 20,
    backgroundColor: '#333',
    borderTopWidth: 2,
    borderTopColor: '#555',
  },
});
