import { NativeModule, requireNativeModule } from 'expo';

import { EarshotAudioModuleEvents } from './EarshotAudio.types';

declare class EarshotAudioModule extends NativeModule<EarshotAudioModuleEvents> {
  arm(): Promise<void>;
  disarm(): Promise<void>;
  isArmed(): boolean;
}

export default requireNativeModule<EarshotAudioModule>('EarshotAudio');
