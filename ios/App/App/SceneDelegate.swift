import UIKit
import WidgetKit
import Capacitor
import FirebaseAuth

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CAPBridgeViewController()
        window?.makeKeyAndVisible()

        // Cold start: custom URL handling, then Capacitor unless Firebase Auth consumed the URL.
        if !connectionOptions.urlContexts.isEmpty && handleCustomURLs(connectionOptions.urlContexts) {
            return
        }

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        if handleCustomURLs(URLContexts) {
            return
        }

        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    func sceneWillResignActive(_ scene: UIScene) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        (UIApplication.shared.delegate as? AppDelegate)?.scheduleAppRefresh()
    }

    /// CloudKit login notification and Firebase Auth URL handling.
    /// Returns true when Firebase Auth consumed a URL (skip Capacitor proxy).
    private func handleCustomURLs(_ URLContexts: Set<UIOpenURLContext>) -> Bool {
        for context in URLContexts {
            let url = context.url
            if url.scheme == "cloudkit-icloud.baseline.getbaseline.app" {
                NotificationCenter.default.post(name: NSNotification.Name("cloudkitLogin"), object: url)
            }
            if Auth.auth().canHandle(url) {
                return true
            }
        }
        return false
    }
}
