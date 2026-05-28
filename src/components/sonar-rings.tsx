import { Canvas, Circle } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Earshot } from '@/constants/earshot-tokens';

type Props = {
  armed: boolean;
};

const SIZE = 420;
const CENTER = SIZE / 2;
const START_R = 140;
const END_R = 200;
const RING_DURATION = 2100;
const RING_STAGGER = 700;
const MAX_OPACITY = 0.3;

/**
 * Three concentric rings emanate outward from the arm-button center while armed.
 * Each ring expands from 140pt to 200pt over 2.1s, fading from 0.3 to 0 opacity.
 * 700ms stagger so there's always a ring mid-flight — produces a continuous
 * "actively listening" signal without a hard repeat boundary.
 */
export function SonarRings({ armed }: Props) {
  const p0 = useSharedValue(0);
  const p1 = useSharedValue(0);
  const p2 = useSharedValue(0);
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(p0);
    cancelAnimation(p1);
    cancelAnimation(p2);

    if (armed) {
      containerOpacity.value = withTiming(1, { duration: 400 });
      const start = (sv: typeof p0, delay: number) => {
        sv.value = 0;
        sv.value = withDelay(
          delay,
          withRepeat(
            withTiming(1, {
              duration: RING_DURATION,
              easing: Easing.out(Easing.quad),
            }),
            -1,
            false,
          ),
        );
      };
      start(p0, 0);
      start(p1, RING_STAGGER);
      start(p2, RING_STAGGER * 2);
    } else {
      containerOpacity.value = withTiming(0, { duration: 250 });
      p0.value = 0;
      p1.value = 0;
      p2.value = 0;
    }
  }, [armed, p0, p1, p2, containerOpacity]);

  const r0 = useDerivedValue(() => START_R + p0.value * (END_R - START_R));
  const r1 = useDerivedValue(() => START_R + p1.value * (END_R - START_R));
  const r2 = useDerivedValue(() => START_R + p2.value * (END_R - START_R));

  const o0 = useDerivedValue(() => containerOpacity.value * (1 - p0.value) * MAX_OPACITY);
  const o1 = useDerivedValue(() => containerOpacity.value * (1 - p1.value) * MAX_OPACITY);
  const o2 = useDerivedValue(() => containerOpacity.value * (1 - p2.value) * MAX_OPACITY);

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      <Circle
        cx={CENTER}
        cy={CENTER}
        r={r0}
        style="stroke"
        strokeWidth={1.5}
        color={Earshot.buttonArmedCenter}
        opacity={o0}
      />
      <Circle
        cx={CENTER}
        cy={CENTER}
        r={r1}
        style="stroke"
        strokeWidth={1.5}
        color={Earshot.buttonArmedCenter}
        opacity={o1}
      />
      <Circle
        cx={CENTER}
        cy={CENTER}
        r={r2}
        style="stroke"
        strokeWidth={1.5}
        color={Earshot.buttonArmedCenter}
        opacity={o2}
      />
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
});
