import { IonDatetime } from "@ionic/react";
import { LocalNotifications } from "capacitor-local-notifications";
import { useState } from "react";

const NotificationEditor = ({ oldTime, notificationData, globalEditing, setGlobalEditing }) => {
    const [editing, setEditing] = useState(oldTime === "");
    let newTime = oldTime;
    if (newTime.length === 0) newTime = "12:00";
    const [time, setTime] = useState(newTime);

    const edit = () => {
        if (!globalEditing) {
            setGlobalEditing(true);
            setEditing(true);
        }
    }
    
    const cancelNotifications = async notifications => {
        let toCancel = [];
        for (let t of [time, oldTime]) {
            if (t === "") continue;
            const split = t.split(":");
            const hour = parseInt(split[0]);
            const minute = parseInt(split[1]);
            for (let notification of notifications) {
                if (notification.schedule.on.hour === hour && notification.schedule.on.minute === minute) {
                    toCancel.push({ id: notification.id });
                }
            }
        }

        if (toCancel.length === 0) return;
        await LocalNotifications.cancel({
            notifications: toCancel
        });
    }

    const cancel = () => {
        setGlobalEditing(false);
        setEditing(false);
    }

    const done = () => {
        LocalNotifications.getPending().then(async ({ notifications }) => {
            await cancelNotifications(notifications);

            await LocalNotifications.schedule({
                notifications: [
                    {
                        id: Math.round(Math.random() * 10000000000),
                        title: "What's happening?",
                        body: "Take a minute to journal.",
                        schedule: {
                            allowWhileIdle: true,
                            on: {
                                weekday: 2,
                                hour: parseInt(time.split(":")[0]),
                                minute: parseInt(time.split(":")[1]),
                            }
                        }
                    }
                ]
            });

            setGlobalEditing(false);
            setEditing(false);
        });
    };

    const del = () => {
        LocalNotifications.getPending().then(async ({ notifications }) => {
            await cancelNotifications(notifications);

            setGlobalEditing(false);
            setEditing(false);
        });
    };

    return <>
    { !editing && <p>{ oldTime } - <span onClick={edit}>click to edit</span></p>}
    { editing && <>
        <IonDatetime presentation="time" value={time} onIonChange={e => setTime(e.detail.value)} />
        <p onClick={cancel}>Cancel</p>
        <p onClick={done}>Done</p>
        <p onClick={del}>Delete</p>
        </>}
    </>
};

export default NotificationEditor;