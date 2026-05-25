import AVFoundation
import Accelerate
import AudioToolbox

final class AudioPipeline {
  private let engine = AVAudioEngine()
  private let eq: AVAudioUnitEQ
  private let gate: AVAudioUnitEffect

  /// Called from the audio thread, throttled to ~30Hz. Module wires this to a JS event.
  var onAudioLevel: ((Float) -> Void)?

  private var lastEmitTime: TimeInterval = 0
  private let minEmitInterval: TimeInterval = 1.0 / 30.0

  var isRunning: Bool { engine.isRunning }

  init() {
    eq = Self.makeEQ()
    gate = Self.makeGate()
    engine.attach(eq)
    engine.attach(gate)
  }

  func start() throws {
    let input = engine.inputNode
    let mainMixer = engine.mainMixerNode
    let format = input.outputFormat(forBus: 0)

    engine.connect(input, to: eq, format: format)
    engine.connect(eq, to: gate, format: format)
    engine.connect(gate, to: mainMixer, format: format)

    // Tap the gated signal so the level meter reflects what the listener actually hears.
    gate.removeTap(onBus: 0)
    gate.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
      self?.handleTap(buffer)
    }

    engine.prepare()
    try engine.start()
  }

  func stop() {
    engine.stop()
    gate.removeTap(onBus: 0)
  }

  // MARK: - Tap → audio level

  private func handleTap(_ buffer: AVAudioPCMBuffer) {
    let now = Date().timeIntervalSinceReferenceDate
    guard now - lastEmitTime >= minEmitInterval else { return }
    lastEmitTime = now
    let rms = Self.computeRMS(buffer)
    onAudioLevel?(rms)
  }

  private static func computeRMS(_ buffer: AVAudioPCMBuffer) -> Float {
    guard let channelData = buffer.floatChannelData?.pointee else { return 0 }
    var rms: Float = 0
    vDSP_rmsqv(channelData, 1, &rms, vDSP_Length(buffer.frameLength))
    return rms
  }

  // MARK: - DSP construction

  private static func makeEQ() -> AVAudioUnitEQ {
    let eq = AVAudioUnitEQ(numberOfBands: 2)

    // High-pass at 120Hz: kill HVAC rumble + handling thuds.
    eq.bands[0].filterType = .highPass
    eq.bands[0].frequency = 120
    eq.bands[0].bypass = false

    // Parametric peak at 3kHz +6dB, ~1 octave wide: speech intelligibility lift.
    eq.bands[1].filterType = .parametric
    eq.bands[1].frequency = 3000
    eq.bands[1].gain = 6.0
    eq.bands[1].bandwidth = 1.0
    eq.bands[1].bypass = false

    return eq
  }

  /// Apple's built-in DynamicsProcessor configured as a downward expander (noise gate).
  /// Audio below -45dB is attenuated 10:1 so quiet rooms feel quiet; fast attack so
  /// speech onsets aren't choppy, moderate release so tails decay naturally.
  private static func makeGate() -> AVAudioUnitEffect {
    let desc = AudioComponentDescription(
      componentType: kAudioUnitType_Effect,
      componentSubType: kAudioUnitSubType_DynamicsProcessor,
      componentManufacturer: kAudioUnitManufacturer_Apple,
      componentFlags: 0,
      componentFlagsMask: 0
    )
    let effect = AVAudioUnitEffect(audioComponentDescription: desc)
    let au = effect.audioUnit

    AudioUnitSetParameter(au, kDynamicsProcessorParam_ExpansionThreshold, kAudioUnitScope_Global, 0, -45.0, 0)
    AudioUnitSetParameter(au, kDynamicsProcessorParam_ExpansionRatio, kAudioUnitScope_Global, 0, 10.0, 0)
    AudioUnitSetParameter(au, kDynamicsProcessorParam_AttackTime, kAudioUnitScope_Global, 0, 0.005, 0)
    AudioUnitSetParameter(au, kDynamicsProcessorParam_ReleaseTime, kAudioUnitScope_Global, 0, 0.1, 0)

    return effect
  }
}
