import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import history from "../history";
import { LocalNotifications, Schedule } from "@moody-app/capacitor-local-notifications";
import { Capacitor } from "@capacitor/core";
import NotificationEditor from "../components/Settings/NotificationEditor";
import EndSpacer from "../components/EndSpacer";

interface NotificationData {
    [key: string]: Array<
        {
            id: Number,
            weekday: Number
        }>
};

function getTime(schedule: Schedule) {
    const { hour: nHour, minute: nMinute } = schedule.on!;
    let hour = String(nHour);
    if (hour.length === 1) hour = "0" + hour;
    let minute = String(nMinute);
    if (minute.length === 1) minute = "0" + minute;
    return `${hour}:${minute}`;
}

function notificationList(data: NotificationData, globalEditing: boolean, setGlobalEditing: Dispatch<SetStateAction<boolean>>) {
    let list = [];
    let keys = Object.keys(data);
    keys.sort((a, b) => {
        // Put new notification at end of list
        if (a === "") return 1;
        if (b === "") return -1;

        const [hourA, minuteA] = a.split(":");
        const [hourB, minuteB] = b.split(":");
        if (hourA === hourB) {
            return Number(minuteA) - Number(minuteB);
        } else {
            return Number(hourA) - Number(hourB);
        }
    });

    for (let time of keys) {
        list.push(<NotificationEditor key={time} oldTime={time} notificationData={data} globalEditing={globalEditing} setGlobalEditing={setGlobalEditing}></NotificationEditor>);
    }

    return list;
}

enum NotificationsAllowed {
    NEED_TO_ASK,
    DENIED,
    ALLOWED
}

const Notifications = ({ page=true, setLoggingIn } : { page?: boolean, setLoggingIn?: (_: boolean) => void }) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(NotificationsAllowed.NEED_TO_ASK);
    const [notificationData, setNotificationData] = useState({});
    const [globalEditing, setGlobalEditing] = useState(false);
    const [reloadAllowed, setReloadAllowed] = useState(0);

    useEffect(() => {
        if (Capacitor.getPlatform() === "web") return;
        LocalNotifications.checkPermissions().then(({ display }) => {
            if (display === "denied") {
                setNotificationsEnabled(NotificationsAllowed.DENIED);
            } else if (display === "granted") {
                setNotificationsEnabled(NotificationsAllowed.ALLOWED);
            } else {
                setNotificationsEnabled(NotificationsAllowed.NEED_TO_ASK)
            }
        });
    }, [reloadAllowed]);

    useEffect(() => {
        if (Capacitor.getPlatform() === "web") return;
        if (globalEditing) return;
        (async () => {
            const { notifications } = await LocalNotifications.getPending();
            let data: NotificationData  = {};
            for (let notification of notifications) {
                const time = getTime(notification.schedule!);
                if (!data[time]) data[time] = [];
                data[time].push({
                    id: notification.id,
                    weekday: notification.schedule!.on!.weekday!
                });
            }
    
            setNotificationData(data);
        })();
    }, [globalEditing]);

    return (
    <>
        <div className="container">
            { page && <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon> }
            <div className={`container ${page ? "center-journal" : "center-notifications"}`}>
                <div className="title">Notifications</div>
                <p className="text-center margin-bottom-0">Notifications are a great way to ensure you mood log consistently, so you can build up an accurate picture of your mood over time.</p>
                <p className="text-center">We recommend setting at least two per day, especially if you're just getting started and need reminders.</p>
                { Capacitor.getPlatform() !== "web" && notificationsEnabled !== NotificationsAllowed.DENIED && 
                    <>
                        { notificationList(notificationData, globalEditing, setGlobalEditing) }
                        { !globalEditing && <div onClick={async () => {
                            if (notificationsEnabled === NotificationsAllowed.NEED_TO_ASK) {
                                const { display } = await LocalNotifications.requestPermissions();
                                if (display === "denied") {
                                    setNotificationsEnabled(NotificationsAllowed.DENIED);
                                    return;
                                } else {
                                    setNotificationsEnabled(NotificationsAllowed.ALLOWED);
                                }
                            }

                            setGlobalEditing(true);
                            setNotificationData({...notificationData, "": []})
                        }} className="finish-button">Add Notification</div> }
                    </>
                }
                { Capacitor.getPlatform() === "web" && <p className="text-center italics">Notifications are not supported on web. Please get the iOS/Android app.</p> }
                { notificationsEnabled === NotificationsAllowed.DENIED && <p className="text-center italics">
                    You haven't allowed this app to send notifications. Go to Settings and enable notifications for baseline in order to use this feature. 
                    Once you've changed it, <span onClick={() => setReloadAllowed(Math.random())} className="fake-link">click here to reload.</span></p> }
            </div>
            { !page && globalEditing && <>
                <br />
                <div onClick={() => setLoggingIn!(false)} className="finish-button" style={{"backgroundColor": "black"}}>All done!</div>
            </> }
            { page && <EndSpacer /> }
        </div>
    </>)
};

export default Notifications;