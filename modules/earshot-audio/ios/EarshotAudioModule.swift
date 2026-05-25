import ExpoModulesCore

public class EarshotAudioModule: Module {
  private let sessionManager = AudioSessionManager()
  private let pipeline = AudioPipeline()

  public func definition() -> ModuleDefinition {
    Name("EarshotAudio")

    Events("onStateChange", "onAudioLevel")

    OnCreate {
      self.sessionManager.onRouteLost = { [weak self] in
        self?.handleRouteLost()
      }
      self.pipeline.onAudioLevel = { [weak self] level in
        self?.sendEvent("onAudioLevel", ["level": level])
      }
    }

    AsyncFunction("arm") {
      try self.sessionManager.activate()
      try self.pipeline.start()
      self.sendEvent("onStateChange", ["armed": true])
    }

    AsyncFunction("disarm") {
      self.pipeline.stop()
      try self.sessionManager.deactivate()
      self.sendEvent("onStateChange", ["armed": false, "reason": "user"])
    }

    Function("isArmed") {
      return self.pipeline.isRunning
    }
  }

  private func handleRouteLost() {
    guard pipeline.isRunning else { return }
    pipeline.stop()
    try? sessionManager.deactivate()
    sendEvent("onStateChange", ["armed": false, "reason": "route_lost"])
  }
}
