import { registerWebModule, NativeModule } from 'expo';

import { EarshotAudioModuleEvents } from './EarshotAudio.types';

// EarshotAudio is iOS-only; web exports a stub that rejects so TS shape matches.
class EarshotAudioModule extends NativeModule<EarshotAudioModuleEvents> {
  async arm(): Promise<void> {
    throw new Error('EarshotAudio is iOS-only');
  }

  async disarm(): Promise<void> {
    throw new Error('EarshotAudio is iOS-only');
  }

  isArmed(): boolean {
    return false;
  }
}

export default registerWebModule(EarshotAudioModule, 'EarshotAudioModule');
