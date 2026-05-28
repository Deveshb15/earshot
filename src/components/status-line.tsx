import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Earshot, Motion, Type } from '@/constants/earshot-tokens';

export type StatusKind = 'idle' | 'armed' | 'route_lost';

type Props = {
  status: StatusKind;
};

function format(status: StatusKind, elapsedSec: number): string {
  switch (status) {
    case 'idle':
      return 'TAP TO ARM';
    case 'armed': {
      const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const ss = String(Math.floor(elapsedSec % 60)).padStart(2, '0');
      return `LISTENING • ${mm}:${ss}`;
    }
    case 'route_lost':
      return 'AIRPODS DISCONNECTED';
  }
}

/**
 * Status text with crossfade transitions on state change + a live time counter
 * when armed (1 Hz tick, tabular-nums, no per-digit animation — research is
 * unambiguous that stability beats fancy here).
 */
export function StatusLine({ status }: Props) {
  const opacity = useSharedValue(1);
  const [displayed, setDisplayed] = useState<StatusKind>(status);
  const [now, setNow] = useState(Date.now());
  const armedAtRef = useRef<number | null>(null);

  // Crossfade out → swap text → fade in whenever status changes
  useEffect(() => {
    if (status === displayed) return;
    opacity.value = withTiming(0, { duration: Motion.crossfadeMs });
    const t = setTimeout(() => {
      setDisplayed(status);
      opacity.value = withTiming(1, { duration: Motion.crossfadeMs });
    }, Motion.crossfadeMs);
    return () => clearTimeout(t);
  }, [status, displayed, opacity]);

  // Track when we entered armed so the counter starts at 00:00
  useEffect(() => {
    if (status === 'armed' && armedAtRef.current === null) {
      armedAtRef.current = Date.now();
      setNow(Date.now());
    } else if (status !== 'armed') {
      armedAtRef.current = null;
    }
  }, [status]);

  // 1 Hz tick while armed — no animation on digit change, just re-render
  useEffect(() => {
    if (status !== 'armed') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status]);

  const elapsed = armedAtRef.current
    ? Math.floor((now - armedAtRef.current) / 1000)
    : 0;
  const text = format(displayed, elapsed);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text style={[styles.text, animatedStyle]}>{text}</Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: Earshot.textDim,
    fontFamily: Type.monoFamily,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
