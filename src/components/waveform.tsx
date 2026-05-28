import { Canvas, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Earshot } from '@/constants/earshot-tokens';

type Props = {
  audioLevel: SharedValue<number>;
  visible: boolean;
  width: number;
  height: number;
};

const BAR_COUNT = 56;
const BAR_GAP = 2;
const LEVEL_BOOST = 4; // RMS sits low for speech; boost so bars register

/**
 * Mirrored center-out waveform driven entirely by Reanimated SharedValues —
 * the audio level flows: native onAudioLevel event → shared value → animated
 * reaction → shared buffer → Skia derived path. Zero React re-renders during
 * the 30Hz audio stream.
 */
export function Waveform({ audioLevel, visible, width, height }: Props) {
  const bufferShared = useSharedValue<number[]>(new Array(BAR_COUNT).fill(0));
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 400 });
    if (!visible) {
      bufferShared.value = new Array(BAR_COUNT).fill(0);
    }
  }, [visible, opacity, bufferShared]);

  useAnimatedReaction(
    () => audioLevel.value,
    (level) => {
      const boosted = Math.min(1, level * LEVEL_BOOST);
      const next = bufferShared.value.slice(1);
      next.push(boosted);
      bufferShared.value = next;
    },
  );

  const barWidth = (width - (BAR_COUNT - 1) * BAR_GAP) / BAR_COUNT;
  const midY = height / 2;

  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const buf = bufferShared.value;
    for (let i = 0; i < buf.length; i++) {
      const lvl = buf[i];
      const h = Math.max(2, lvl * height);
      const x = i * (barWidth + BAR_GAP);
      const y = midY - h / 2;
      p.addRect({ x, y, width: barWidth, height: h });
    }
    return p;
  });

  return (
    <Canvas style={{ width, height }}>
      <Group opacity={opacity}>
        <Path path={path}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={[
              Earshot.buttonArmedEdge,
              Earshot.buttonArmedCenter,
              Earshot.buttonArmedEdge,
            ]}
          />
        </Path>
      </Group>
    </Canvas>
  );
}
