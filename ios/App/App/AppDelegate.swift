import UIKit
import Capacitor

import FirebaseCore
import FirebaseAuth
import FirebaseAnalytics

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        FirebaseApp.configure()
        Analytics.setAnalyticsCollectionEnabled(true)
        
        let activity = NSUserActivity(activityType: "app.getbaseline.baseline.using-app")
        activity.webpageURL = URL(string: "https://web.getbaseline.app")
        activity.isEligibleForHandoff = true
        activity.title = "Using baseline"
        self.userActivity = activity
        self.userActivity?.becomeCurrent()
        
        #if DEBUG
          if #available(macOS 13.3, iOS 16.4, tvOS 16.4, *) {
                DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
                      if let vc = self.window?.rootViewController as? CAPBridgeViewController {
                          vc.bridge?.webView?.isInspectable = true
                      }
                }
          }
        #endif
        
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }
    
    
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        if (url.scheme == "cloudkit-icloud.baseline.getbaseline.app") {
            NotificationCenter.default.post(name: NSNotification.Name("cloudkitLogin"), object: url);
        }
        
        if Auth.auth().canHandle(url) {
            return true
        }
        
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    
    // Push Notification handlers
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
      NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
      NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }
    
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        
        NotificationCenter.default.post(name: Notification.Name.init("didReceiveRemoteNotification"), object: completionHandler, userInfo: userInfo)
        
        // If this isn't a background message to clean up old notifications,
        // stop processing
        if !(userInfo["cleanUp"] is String) {
            completionHandler(UIBackgroundFetchResult.newData)
            return
        }
        
        UNUserNotificationCenter.current().getDeliveredNotifications { notifications in
            // Find the latest local notification (only one we want to preserve)
            var latestNotification: Optional<UNNotification> = nil;
            var identifiers: [String] = []
            for notification in notifications {
                if notification.request.content.title != "What's happening?" {
                    continue;
                }
                
                if (latestNotification == nil || notification.date > latestNotification!.date) {
                    latestNotification = notification;
                }
                identifiers.append(notification.request.identifier)
            }
            
            // Remove the identifier of the latest notification from the list
            identifiers.removeAll { id in
                return id == latestNotification?.request.identifier
            }
            
            // Remove all remaining notifications, and complete
            UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: identifiers)
            completionHandler(UIBackgroundFetchResult.newData)
        }
    }
}

