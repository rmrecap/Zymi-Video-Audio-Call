import Flutter
import UIKit
import CallKit

class CallKitManager: NSObject, CXProviderDelegate {
    let provider: CXProvider
    
    override init() {
        let config = CXProviderConfiguration(localizedName: "ZYMI")
        config.supportsVideo = true
        config.maximumCallGroups = 1
        config.supportedHandleTypes = [.generic]
        self.provider = CXProvider(configuration: config)
        super.init()
        provider.setDelegate(self, queue: nil)
    }

    func reportIncomingCall(uuid: UUID, handle: String) {
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: handle)
        // Branch: This wakes the iOS app and shows the native System Call UI
        provider.reportNewIncomingCall(with: uuid, update: update) { error in 
            if let error = error {
                print("Failed to report incoming call: \(error.localizedDescription)")
            }
        }
    }
    
    func providerDidReset(_ provider: CXProvider) {}
}

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  var callKitManager: CallKitManager?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    callKitManager = CallKitManager()
    
    let controller : FlutterViewController = window?.rootViewController as! FlutterViewController
    let callKitChannel = FlutterMethodChannel(name: "com.zymi.app/callkit",
                                              binaryMessenger: controller.binaryMessenger)
    
    callKitChannel.setMethodCallHandler({
      [weak self] (call: FlutterMethodCall, result: @escaping FlutterResult) -> Void in
      guard call.method == "reportIncomingCall" else {
        result(FlutterMethodNotImplemented)
        return
      }
      
      if let args = call.arguments as? [String: Any],
         let handle = args["handle"] as? String {
         self?.callKitManager?.reportIncomingCall(uuid: UUID(), handle: handle)
         result(true)
      } else {
         result(FlutterError(code: "INVALID_ARGS", message: "Missing handle argument", details: nil))
      }
    })

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  }
}
