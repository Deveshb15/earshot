export type EarshotAudioModuleEvents = {
  onStateChange: (params: StateChangePayload) => void;
  onAudioLevel: (params: AudioLevelPayload) => void;
};

export type StateChangePayload = {
  armed: boolean;
  /** Why this transition happened. Omitted on user-initiated arm. */
  reason?: 'user' | 'route_lost';
};

export type AudioLevelPayload = {
  /** RMS amplitude of the gated signal, roughly 0..1. */
  level: number;
};
