import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Earshot, Motion } from '@/constants/earshot-tokens';

type Props = {
  armed: boolean;
  disabled?: boolean;
  onPress: () => void;
};

const SIZE = 280;
const CENTER = SIZE / 2;

/**
 * The single hero action. Idle: matte dark disc. Armed: electric-blue → cyan
 * radial gradient, slow organic breathing scale. Press: snappy spring-down to
 * 0.94 with haptic. Skia handles the gradient; Reanimated handles motion.
 */
export function ArmButton({ armed, disabled, onPress }: Props) {
  const breathScale = useSharedValue(1);
  const pressScale = useSharedValue(1);
  const armedOpacity = useSharedValue(0);
  const symbolOpacity = useSharedValue(0.55);

  useEffect(() => {
    cancelAnimation(breathScale);
    if (armed) {
      armedOpacity.value = withTiming(1, { duration: 600 });
      symbolOpacity.value = withTiming(1, { duration: 400 });
      breathScale.value = withRepeat(
        withSpring(1.04, Motion.springBreathing),
        -1,
        true,
      );
    } else {
      armedOpacity.value = withTiming(0, { duration: 600 });
      symbolOpacity.value = withTiming(0.55, { duration: 400 });
      breathScale.value = withSpring(1, Motion.springBreathing);
    }
  }, [armed, breathScale, armedOpacity, symbolOpacity]);

  const handlePressIn = () => {
    pressScale.value = withSpring(0.94, Motion.springSnappy);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, Motion.springSnappy);
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value * pressScale.value }],
  }));

  const armedOverlayStyle = useAnimatedStyle(() => ({
    opacity: armedOpacity.value,
  }));

  const symbolStyle = useAnimatedStyle(() => ({
    opacity: symbolOpacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}>
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Idle base — flat matte dark */}
        <Canvas style={styles.canvas}>
          <Circle cx={CENTER} cy={CENTER} r={CENTER} color={Earshot.buttonIdle} />
        </Canvas>

        {/* Armed overlay — electric blue → cyan radial */}
        <Animated.View style={[styles.canvas, armedOverlayStyle]}>
          <Canvas style={styles.canvas}>
            <Circle cx={CENTER} cy={CENTER} r={CENTER}>
              <RadialGradient
                c={vec(CENTER, CENTER)}
                r={CENTER}
                colors={[Earshot.buttonArmedCenter, Earshot.buttonArmedEdge]}
              />
            </Circle>
          </Canvas>
        </Animated.View>

        {/* SF Symbol — same glyph in both states, opacity differentiates */}
        <Animated.View style={[styles.symbolWrap, symbolStyle]} pointerEvents="none">
          <SymbolView
            name="waveform"
            size={88}
            tintColor={Earshot.text}
            type="monochrome"
          />
        </Animated.View>

        {/* Subtle inner stroke for depth */}
        <View style={styles.innerStroke} pointerEvents="none" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
  symbolWrap: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerStroke: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
});
