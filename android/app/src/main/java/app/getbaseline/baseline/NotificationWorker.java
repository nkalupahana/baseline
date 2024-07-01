package app.getbaseline.baseline;

import android.app.NotificationManager;
import android.content.Context;
import android.service.notification.StatusBarNotification;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.util.ArrayList;

public class NotificationWorker extends Worker {
    public NotificationWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        // For some reason, you can only pull delivered notifications at Android M,
        //  so it's only worth running any of this if we're at that SDK level
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            // Find the latest notification in all delivered notifications
            NotificationManager notificationManager = getApplicationContext().getSystemService(NotificationManager.class);
            ArrayList<StatusBarNotification> notifs = new ArrayList<>();
            StatusBarNotification latestNotif = null;
            for (StatusBarNotification notif : notificationManager.getActiveNotifications()) {
                notifs.add(notif);
                if (latestNotif == null || latestNotif.getPostTime() < notif.getPostTime()) {
                    latestNotif = notif;
                }
            }

            // Remove the latest from the list of all delivered
            if (latestNotif != null) {
                notifs.remove(latestNotif);
            }

            // And remove all other notifications
            for (StatusBarNotification notif : notifs) {
                notificationManager.cancel(notif.getTag(), notif.getId());
            }
        }

        return Result.success();
    }
}
