import { Canvas, Rect } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';

type Props = {
  level: number;
  visible: boolean;
  width: number;
  height: number;
};

const BAR_COUNT = 48;
const BAR_GAP = 2;
const LEVEL_BOOST = 4; // RMS values from speech sit low — multiply for visibility

export function Waveform({ level, visible, width, height }: Props) {
  const [buffer, setBuffer] = useState<number[]>(() => Array(BAR_COUNT).fill(0));

  useEffect(() => {
    if (!visible) return;
    setBuffer((prev) => [...prev.slice(1), Math.min(1, level * LEVEL_BOOST)]);
  }, [level, visible]);

  useEffect(() => {
    if (!visible) setBuffer(Array(BAR_COUNT).fill(0));
  }, [visible]);

  const barWidth = (width - (BAR_COUNT - 1) * BAR_GAP) / BAR_COUNT;

  return (
    <Canvas style={{ width, height }}>
      {buffer.map((lvl, i) => {
        const h = Math.max(2, lvl * height);
        const x = i * (barWidth + BAR_GAP);
        const y = (height - h) / 2;
        return (
          <Rect key={i} x={x} y={y} width={barWidth} height={h} color="#FFFFFFCC" />
        );
      })}
    </Canvas>
  );
}
