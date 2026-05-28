import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Earshot, Type } from '@/constants/earshot-tokens';

type Props = {
  visible: boolean;
};

/**
 * 5.1.1 mitigation — persistent in-app signal that the mic is active. Pulsing
 * red dot with a subtle glow halo + monospaced LIVE label, top-right of the
 * screen. iOS shows the orange status-bar dot automatically; this is the
 * second concurrent signal so the user can never miss it.
 */
export function RecordingIndicator({ visible }: Props) {
  const containerOpacity = useSharedValue(0);
  const dotPulse = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(dotPulse);
    if (visible) {
      containerOpacity.value = withTiming(1, { duration: 300 });
      dotPulse.value = withRepeat(
        withTiming(1, {
          duration: 800,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      );
    } else {
      containerOpacity.value = withTiming(0, { duration: 200 });
      dotPulse.value = withTiming(0, { duration: 200 });
    }
  }, [visible, containerOpacity, dotPulse]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + dotPulse.value * 0.55,
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: dotPulse.value * 0.35,
    transform: [{ scale: 1 + dotPulse.value * 0.5 }],
  }));

  return (
    <Animated.View style={[styles.row, containerStyle]}>
      <View style={styles.dotWrap}>
        <Animated.View style={[styles.halo, haloStyle]} />
        <Animated.View style={[styles.dot, dotStyle]} />
      </View>
      <Text style={styles.label}>LIVE</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dotWrap: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Earshot.recording,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Earshot.recording,
  },
  label: {
    color: Earshot.textDim,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    fontFamily: Type.monoFamily,
  },
});
