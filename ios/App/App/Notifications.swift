//
//  Notifications.swift
//  App
//
//  Created by Nisala on 10/17/26.
//

import NotificationCenter

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
