import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Earshot, Motion } from '@/constants/earshot-tokens';

type Props = {
  armed: boolean;
};

/**
 * Small chip at the top of the screen: "Through your AirPods". Slides down +
 * fades in when armed, reverses on disarm. The one place we use Liquid-Glass-
 * adjacent translucency (subtle surface tint, not a full blur).
 */
export function OutputPill({ armed }: Props) {
  const translateY = useSharedValue(-12);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (armed) {
      translateY.value = withSpring(0, Motion.springSnappy);
      opacity.value = withTiming(1, { duration: Motion.fadeMs });
    } else {
      translateY.value = withSpring(-12, Motion.springSnappy);
      opacity.value = withTiming(0, { duration: Motion.fadeMs });
    }
  }, [armed, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.pill, animatedStyle]}>
      <View style={styles.row}>
        <SymbolView name="airpods" size={13} tintColor={Earshot.text} type="monochrome" />
        <Text style={styles.text}>Through your AirPods</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Earshot.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: {
    color: Earshot.text,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
