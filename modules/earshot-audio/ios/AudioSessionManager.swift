import AVFoundation

enum EarshotError: Error, LocalizedError {
  case noBluetoothOutput

  var errorDescription: String? {
    switch self {
    case .noBluetoothOutput:
      return "No Bluetooth output detected. Connect AirPods (or compatible headphones) before arming."
    }
  }
}

final class AudioSessionManager {
  private let session = AVAudioSession.sharedInstance()
  private let notificationCenter = NotificationCenter.default

  /// Invoked when the active Bluetooth output drops mid-stream. The module wires this
  /// to its own teardown + onStateChange("route_lost") flow — we never stream room
  /// audio to the loudspeaker, that would defeat the privacy expectation.
  var onRouteLost: (() -> Void)?

  init() {
    notificationCenter.addObserver(
      self,
      selector: #selector(handleRouteChange(_:)),
      name: AVAudioSession.routeChangeNotification,
      object: session
    )
  }

  deinit {
    notificationCenter.removeObserver(self)
  }

  func activate() throws {
    var options: AVAudioSession.CategoryOptions = [
      .allowBluetoothA2DP,
      .allowBluetooth,
      .duckOthers,
    ]
    if #available(iOS 26.0, *) {
      options.insert(.bluetoothHighQualityRecording)
    }

    try session.setCategory(.playAndRecord, mode: .measurement, options: options)
    try session.setPreferredIOBufferDuration(0.005)

    // Live Listen behavior: capture from the phone's built-in mic, not the AirPods mic.
    if let builtInMic = session.availableInputs?.first(where: { $0.portType == .builtInMic }) {
      try session.setPreferredInput(builtInMic)
    }

    try session.setActive(true, options: .notifyOthersOnDeactivation)

    // currentRoute is only reliable after activation; refuse to arm without Bluetooth.
    if !currentRouteHasBluetoothOutput() {
      try? session.setActive(false, options: .notifyOthersOnDeactivation)
      throw EarshotError.noBluetoothOutput
    }
  }

  func deactivate() throws {
    try session.setActive(false, options: .notifyOthersOnDeactivation)
  }

  // MARK: - Route inspection

  private func currentRouteHasBluetoothOutput() -> Bool {
    return session.currentRoute.outputs.contains(where: Self.isBluetoothOutput)
  }

  private static func isBluetoothOutput(_ port: AVAudioSessionPortDescription) -> Bool {
    switch port.portType {
    case .bluetoothA2DP, .bluetoothHFP, .bluetoothLE:
      return true
    default:
      return false
    }
  }

  @objc private func handleRouteChange(_ notification: Notification) {
    guard
      let userInfo = notification.userInfo,
      let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
      let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue),
      reason == .oldDeviceUnavailable,
      let previousRoute = userInfo[AVAudioSessionRouteChangePreviousRouteKey] as? AVAudioSessionRouteDescription,
      previousRoute.outputs.contains(where: Self.isBluetoothOutput)
    else {
      return
    }
    onRouteLost?()
  }
}
