// Re-export the native module. On web, it will be resolved to EarshotAudioModule.web.ts
// and on native platforms to EarshotAudioModule.ts
export { default } from './src/EarshotAudioModule';
export * from './src/EarshotAudio.types';
