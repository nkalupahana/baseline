import { IonDatetime, IonIcon } from "@ionic/react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { checkmarkOutline, closeOutline, pencil, trashOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import "./NotificationEditor.css";

const WEEKDAY_TO_DAY = {
    1: "Sun",
    2: "Mon",
    3: "Tue",
    4: "Wed",
    5: "Thu",
    6: "Fri",
    7: "Sat"
};

const WEEKDAY_TO_LETTER = {
    1: "S",
    2: "M",
    3: "T",
    4: "W",
    5: "T",
    6: "F",
    7: "S"
}

function formatTime(time) {
    let [hour, minute] = time.split(":");
    hour = Number(hour);
    let meridiem = hour < 12 ? "AM" : "PM";
    if (hour === 0) hour += 12;
    if (hour > 12) hour -= 12;
    return `${hour}:${minute} ${meridiem} `;
}

const NotificationEditor = ({ oldTime, notificationData, globalEditing, setGlobalEditing }) => {
    const [editing, setEditing] = useState(oldTime === "");
    let newTime = oldTime;
    if (newTime.length === 0) newTime = "12:00";
    const [time, setTime] = useState(newTime);
    const [weekdays, setWeekdays] = useState(oldTime ? notificationData[oldTime].map(n => n.weekday) : [1, 2, 3, 4, 5, 6, 7]);

    // Reset to defaults when editing view opened
    useEffect(() => {
        if (!editing) return;

        let newTime = oldTime;
        if (newTime.length === 0) newTime = "12:00";
        setTime(newTime);
        setWeekdays(oldTime ? notificationData[oldTime].map(n => n.weekday) : [1, 2, 3, 4, 5, 6, 7]);
    }, [editing, notificationData, oldTime]);

    const edit = () => {
        if (!globalEditing) {
            setGlobalEditing(true);
            setEditing(true);
        }
    }
    
    const cancelNotifications = async notifications => {
        // Cancel notifications on old time,
        // and anything on this new time we're setting to
        let times = [oldTime, time];

        let toCancel = [];
        for (let time of times) {
            if (!time) continue;
            const split = time.split(":");
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
        if (oldTime) setEditing(false);
    }

    const done = () => {
        LocalNotifications.getPending().then(async ({ notifications }) => {
            await cancelNotifications(notifications);
            let promises = [];
            for (let weekday of weekdays) {
                promises.push(LocalNotifications.schedule({
                    notifications: [
                        {
                            id: Math.round(Math.random() * 1_000_000_000),
                            title: "What's happening?",
                            body: "Take a minute to journal.",
                            threadIdentifier: "reminder",
                            timeSensitive: true,
                            schedule: {
                                allowWhileIdle: true,
                                on: {
                                    weekday,
                                    hour: parseInt(time.split(":")[0]),
                                    minute: parseInt(time.split(":")[1]),
                                }
                            }
                        }
                    ]
                }));
            }

            await Promise.all(promises);

            setGlobalEditing(false);
            setEditing(false);
        });
    };

    const del = () => {
        LocalNotifications.getPending().then(async ({ notifications }) => {
            await cancelNotifications(notifications);

            setGlobalEditing(false);
            if (oldTime) setEditing(false);
        });
    };

    const weekdaySelectors = () => {
        let ret = [];
        const toggle = (weekday) => {
            if (weekdays.includes(weekday)) {
                setWeekdays(weekdays.filter(w => w !== weekday));
            } else {
                setWeekdays([...weekdays, weekday]);
            }
        }

        for (let weekday in WEEKDAY_TO_LETTER) {
            const nweekday = Number(weekday);
            ret.push(<div 
                        key={nweekday} 
                        onClick={() => toggle(nweekday)} 
                        className="weekday-selector" 
                        style={weekdays.includes(nweekday) ? {backgroundColor: "var(--notification-green)"} : {backgroundColor: "#ef5350"}}>
                            { WEEKDAY_TO_LETTER[nweekday] }
                    </div>)
        }

        return ret;
    };

    return <div className="notification-editor">
    { !editing && <>
        <p className="margin-bottom-0">
            { formatTime(time) } 
            { !globalEditing && <IonIcon style={{transform: "translateY(2px)"}} icon={pencil} onClick={edit} /> }
        </p>
        <p style={{marginTop: "4px"}}>
            { weekdays.length === 7 ? 
                "Every Day" : 
                weekdays.sort().map(n => WEEKDAY_TO_DAY[n]).join(", ") }
        </p>
    </> }

    { editing && <>
        <IonDatetime className="datetime-round" presentation="time" value={time} onIonChange={e => setTime(e.detail.value)} />
        <div className="weekday-selectors">
            { weekdaySelectors() }
        </div>
        <div className="notification-edit-buttons">
            <IonIcon onClick={cancel} icon={closeOutline} /> 
            <IonIcon onClick={del} icon={trashOutline} /> 
            { weekdays.length !== 0 && <IonIcon onClick={done} icon={checkmarkOutline} /> }
        </div>
    </>}
    </div>
};

export default NotificationEditor;