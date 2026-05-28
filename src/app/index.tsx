import { useEffect, useState } from 'react';
import { Dimensions, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import EarshotAudio from '../../modules/earshot-audio';
import { ArmButton } from '@/components/arm-button';
import { OutputPill } from '@/components/output-pill';
import { RecordingIndicator } from '@/components/recording-indicator';
import { SonarRings } from '@/components/sonar-rings';
import { StatusLine, type StatusKind } from '@/components/status-line';
import { Waveform } from '@/components/waveform';
import { Earshot } from '@/constants/earshot-tokens';
import { useEarshotLiveActivity } from '@/hooks/use-earshot-live-activity';

const SCREEN_WIDTH = Dimensions.get('window').width;
const WAVEFORM_WIDTH = SCREEN_WIDTH - 48;
const WAVEFORM_HEIGHT = 72;

export default function HomeScreen() {
  useEarshotLiveActivity();

  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReason, setLastReason] = useState<'user' | 'route_lost' | null>(null);

  // Audio level flows entirely on the UI thread — no React re-renders at 30Hz.
  const audioLevel = useSharedValue(0);

  useEffect(() => {
    const stateSub = EarshotAudio.addListener('onStateChange', (e) => {
      setArmed(e.armed);
      setLastReason(e.reason ?? null);
      if (!e.armed) audioLevel.value = 0;
    });
    const levelSub = EarshotAudio.addListener('onAudioLevel', (e) => {
      audioLevel.value = e.level;
    });
    return () => {
      stateSub.remove();
      levelSub.remove();
    };
  }, [audioLevel]);

  const toggle = async () => {
    setError(null);
    try {
      if (armed) await EarshotAudio.disarm();
      else await EarshotAudio.arm();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const status: StatusKind = armed
    ? 'armed'
    : lastReason === 'route_lost'
      ? 'route_lost'
      : 'idle';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          <OutputPill armed={armed} />
          <RecordingIndicator visible={armed} />
        </View>

        <View style={styles.hero}>
          <SonarRings armed={armed} />
          <ArmButton
            armed={armed}
            disabled={Platform.OS !== 'ios'}
            onPress={toggle}
          />
        </View>

        <View style={styles.bottom}>
          <StatusLine status={status} />
          <Waveform
            audioLevel={audioLevel}
            visible={armed}
            width={WAVEFORM_WIDTH}
            height={WAVEFORM_HEIGHT}
          />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Earshot.bg },
  safeArea: { flex: 1, paddingHorizontal: 24 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    minHeight: 32,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    alignItems: 'center',
    gap: 28,
    paddingBottom: 40,
  },
  errorBox: {
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  errorText: {
    color: Earshot.textDim,
    fontSize: 13,
    lineHeight: 18,
  },
});
