import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  visible: boolean;
};

/**
 * 5.1.1 mitigation: persistent visible signal whenever the mic is active.
 * iOS already shows the orange dot in the status bar; this dot lives next to
 * the arm button so the user can never mistake armed-state.
 */
export function RecordingIndicator({ visible }: Props) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(opacity);
    if (visible) {
      opacity.value = withRepeat(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.dot, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
  },
});
