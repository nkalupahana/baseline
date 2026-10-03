import UIKit
import Capacitor

import FirebaseCore
import FirebaseAnalytics
import FirebaseCrashlytics

import BackgroundTasks

let APP_REFRESH_ID = "app.getbaseline.baseline.refresh"

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

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
        
        BGTaskScheduler.shared.register(forTaskWithIdentifier: APP_REFRESH_ID, using: nil) { task in
            self.handleAppRefresh(task: task as! BGAppRefreshTask)
        }
        
        self.clearExcessNotifications(resolve: {})
        return true
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
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
        
        clearExcessNotifications(resolve: {
            completionHandler(.newData)
        })
        
        return
    }
    
    func scheduleAppRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: APP_REFRESH_ID)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 30 * 60) // 30 minute cadence
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            Crashlytics.crashlytics().record(error: NSError.init(
                domain: APP_REFRESH_ID, code: -1, userInfo: [
                    "Error": "Could not schedule app refresh: \(error)"
                ]
            ))
        }
    }
    
    func handleAppRefresh(task: BGAppRefreshTask) {
        // Schedule next refresh
        scheduleAppRefresh()
        clearExcessNotifications(resolve: {
            task.setTaskCompleted(success: true)
        })
    }
    
    func clearExcessNotifications(resolve: @escaping () -> Void) {
        UNUserNotificationCenter.current().getDeliveredNotifications { notifications in
            // Find the latest notification (only one we want to keep)
            var latestNotification: Optional<UNNotification> = nil;
            var identifiers: [String] = []
            for notification in notifications {
                if (latestNotification == nil || notification.date > latestNotification!.date) {
                    latestNotification = notification;
                }
                identifiers.append(notification.request.identifier)
            }
            
            // Don't get rid of latest notification (remove from list)
            let idx = identifiers.firstIndex(where: { id in
                return id == latestNotification?.request.identifier
            })
            
            if (idx != nil) {
                identifiers.remove(at: idx!)
            }
            
            // Remove all remaining notifications, and complete
            UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: identifiers)
            resolve()
        }
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {

        let config = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}
