import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  armed: boolean;
  disabled?: boolean;
  onPress: () => void;
};

const SIZE = 240;
const TINT_IDLE = '#1A1A1A';
const TINT_ARMED = '#0066FF';

export function ArmButton({ armed, disabled, onPress }: Props) {
  const scale = useSharedValue(1);
  const liquidGlass = isLiquidGlassAvailable();

  useEffect(() => {
    cancelAnimation(scale);
    if (armed) {
      scale.value = withRepeat(
        withTiming(1.04, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [armed, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tint = armed ? TINT_ARMED : TINT_IDLE;

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Animated.View style={[styles.outer, { backgroundColor: tint }, animatedStyle]}>
        {liquidGlass && (
          <GlassView style={styles.glass} glassEffectStyle="regular" tintColor={tint} />
        )}
        <Text style={styles.label}>{armed ? 'DISARM' : 'ARM'}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glass: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: SIZE / 2,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
  },
});
