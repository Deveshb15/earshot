import { useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EarshotAudio from '../../modules/earshot-audio';
import { ArmButton } from '@/components/arm-button';
import { RecordingIndicator } from '@/components/recording-indicator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Waveform } from '@/components/waveform';
import { Spacing } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const WAVEFORM_WIDTH = SCREEN_WIDTH - Spacing.four * 2;
const WAVEFORM_HEIGHT = 60;

export default function HomeScreen() {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReason, setLastReason] = useState<'user' | 'route_lost' | null>(null);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    const stateSub = EarshotAudio.addListener('onStateChange', (e) => {
      setArmed(e.armed);
      setLastReason(e.reason ?? null);
      if (!e.armed) setLevel(0);
    });
    const levelSub = EarshotAudio.addListener('onAudioLevel', (e) => {
      setLevel(e.level);
    });
    return () => {
      stateSub.remove();
      levelSub.remove();
    };
  }, []);

  const toggle = async () => {
    setError(null);
    try {
      if (armed) {
        await EarshotAudio.disarm();
      } else {
        await EarshotAudio.arm();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const statusLine = armed
    ? 'listening — drop the phone, walk away'
    : lastReason === 'route_lost'
      ? 'stopped — AirPods disconnected'
      : 'tap arm to start';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topRow}>
          <RecordingIndicator visible={armed} />
        </View>

        <View style={styles.center}>
          <ArmButton armed={armed} disabled={Platform.OS !== 'ios'} onPress={toggle} />
          <ThemedText type="code" style={styles.status}>
            {statusLine}
          </ThemedText>
          <Waveform
            level={level}
            visible={armed}
            width={WAVEFORM_WIDTH}
            height={WAVEFORM_HEIGHT}
          />
        </View>

        {error && (
          <ThemedView type="backgroundElement" style={styles.errorBox}>
            <ThemedText type="small">{error}</ThemedText>
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: Spacing.three,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  status: {
    textAlign: 'center',
    textTransform: 'uppercase',
    opacity: 0.6,
    letterSpacing: 2,
  },
  errorBox: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginBottom: Spacing.four,
  },
});
