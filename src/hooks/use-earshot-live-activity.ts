import * as LiveActivity from 'expo-live-activity';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import EarshotAudio from '../../modules/earshot-audio';

const TITLE = 'Earshot is listening';
const SUBTITLE_ARMED = 'Through your AirPods';
const SUBTITLE_STOPPED = 'Stopped';

const UPDATE_THROTTLE_MS = 100;
const LEVEL_BOOST = 4;

const ACTIVITY_CONFIG: LiveActivity.LiveActivityConfig = {
  backgroundColor: '#0A0A0A',
  titleColor: '#FFFFFF',
  subtitleColor: 'rgba(255, 255, 255, 0.65)',
  progressViewTint: '#0066FF',
  progressViewLabelColor: '#FFFFFF',
  deepLinkUrl: 'earshot://',
};

/**
 * Owns the iOS Live Activity lifecycle: starts on arm, throttles audio-level
 * updates to ~10 Hz so the lock-screen progress bar reflects room audio without
 * draining battery, stops on disarm / route loss / unmount.
 */
export function useEarshotLiveActivity() {
  const activityIdRef = useRef<string | undefined>(undefined);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const stopIfRunning = () => {
      if (!activityIdRef.current) return;
      LiveActivity.stopActivity(activityIdRef.current, {
        title: TITLE,
        subtitle: SUBTITLE_STOPPED,
        progressBar: { progress: 0 },
      });
      activityIdRef.current = undefined;
    };

    const stateSub = EarshotAudio.addListener('onStateChange', (e) => {
      if (e.armed) {
        if (activityIdRef.current) return;
        const id = LiveActivity.startActivity(
          { title: TITLE, subtitle: SUBTITLE_ARMED, progressBar: { progress: 0 } },
          ACTIVITY_CONFIG,
        );
        if (id) {
          activityIdRef.current = id;
          lastUpdateRef.current = Date.now();
        }
      } else {
        stopIfRunning();
      }
    });

    const levelSub = EarshotAudio.addListener('onAudioLevel', (e) => {
      if (!activityIdRef.current) return;
      const now = Date.now();
      if (now - lastUpdateRef.current < UPDATE_THROTTLE_MS) return;
      lastUpdateRef.current = now;

      const boosted = Math.min(1, e.level * LEVEL_BOOST);
      LiveActivity.updateActivity(activityIdRef.current, {
        title: TITLE,
        subtitle: SUBTITLE_ARMED,
        progressBar: { progress: boosted },
      });
    });

    return () => {
      stateSub.remove();
      levelSub.remove();
      stopIfRunning();
    };
  }, []);
}
