import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

const { width } = Dimensions.get('window');

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ onFinish }) => {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(1.1);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Fade in and scale down the logo
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });

    // 2. Fade in the text shortly after
    textOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }, (isFinished) => {
        if (isFinished) {
          // Wait 1.2s then transition out
          setTimeout(() => {
            runOnJS(onFinish)();
          }, 1200);
        }
      })
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
      
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text style={styles.appNameText}>P l i   M a r u</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: width * 0.4,
    height: width * 0.4,
  },
  textContainer: {
    position: 'absolute',
    bottom: '35%',
  },
  appNameText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 4,
  },
});
