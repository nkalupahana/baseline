import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import history from "../history";
import { LocalNotifications, Schedule } from "@moody-app/capacitor-local-notifications";
import { Capacitor } from "@capacitor/core";
import NotificationEditor from "../components/Settings/NotificationEditor";

interface NotificationData {
    [key:string]: Array<
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

const Notifications = () => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [notificationData, setNotificationData] = useState({});
    const [globalEditing, setGlobalEditing] = useState(false);

    useEffect(() => {
        if (Capacitor.getPlatform() === "web") return;
        LocalNotifications.checkPermissions().then(({ display }) => {
            if (display === "denied") {
                setNotificationsEnabled(false);
            } else if (display !== "granted") {
                LocalNotifications.requestPermissions().then(({ display }) => {
                    if (display === "denied") {
                        setNotificationsEnabled(false);
                    }
                });
            }
        });
    }, []);

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
            <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
            <div className="center-journal container">
                <div className="title">Customize Notifications</div>
                <p className="text-center margin-bottom-0">Notifications are a great way to ensure you mood log consistently, so you can build up an accurate picture of your mood over time.</p>
                <p className="text-center">We recommend setting at least two per day, especially if you're just getting started and need reminders.</p>
                { Capacitor.getPlatform() !== "web" && notificationsEnabled && 
                    <>
                        { notificationList(notificationData, globalEditing, setGlobalEditing) }
                        { !globalEditing && <div onClick={() => {
                            setGlobalEditing(true);
                            setNotificationData({...notificationData, "": []})
                        }} className="finish-button">Add Notification</div> }
                    </>
                }
                { Capacitor.getPlatform() === "web" && <p className="text-center italics">Notifications are not supported on web. Please get the iOS/Android app.</p> }
                { !notificationsEnabled && <p className="text-center italics">You haven't allowed this app to send notifications. Go to Settings and enable notifications for moody in order to use this feature.</p> }
            </div>
            <br/><br/><br/><br/><br/><br/><br/><br/>
        </div>
    </>)
};

export default Notifications;