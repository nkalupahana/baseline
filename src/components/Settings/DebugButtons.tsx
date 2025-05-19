import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { useCallback } from "react";
import { ref, remove } from "firebase/database";
import { toast } from "../../helpers";
import { IonButton } from "@ionic/react";
import { DateTime } from "luxon";
import ldb from "../../db";

const addWIRFakeData = () => {
    let date = DateTime.now().minus({ days: 2 });
    for (let i = 0; i < 28; i++) {
        ldb.logs.add({
            timestamp: date.toMillis(),
            month: date.month,
            day: date.day,
            year: date.year,
            time: "1:00",
            zone: date.zoneName,
            average: "average",
            mood: Math.round((Math.random() * 10) - 5),
            journal: "fake",
            files: []
        })
        
        date = date.minus({ days: 1 });
    }

    toast("Added fake data!");
};

const setOneTodayOneTomorrow = () => {
    ldb.logs.clear();
    const d1 = DateTime.now().plus({ days: 1 });
    ldb.logs.add({
        timestamp: d1.toMillis(),
        month: d1.month,
        day: d1.day,
        year: d1.year,
        time: "1:00",
        zone: d1.zoneName,
        average: "average",
        mood: Math.round((Math.random() * 10) - 5),
        journal: "fake",
        files: []
    })

    // This log happens the day before, but has a higher timestamp!
    const d2 = DateTime.now()
    ldb.logs.add({
        timestamp: d1.toMillis() + 1000,
        month: d2.month,
        day: d2.day,
        year: d2.year,
        time: "1:00",
        zone: d2.zoneName,
        average: "average",
        mood: Math.round((Math.random() * 10) - 5),
        journal: "fake",
        files: []
    })
}

const setOneYesterdayOneTomorrow = () => {
    ldb.logs.clear();
    const d1 = DateTime.now().plus({ days: 1 });
    ldb.logs.add({
        timestamp: d1.toMillis(),
        month: d1.month,
        day: d1.day,
        year: d1.year,
        time: "1:00",
        zone: d1.zoneName,
        average: "average",
        mood: Math.round((Math.random() * 10) - 5),
        journal: "fake",
        files: []
    })

    const d2 = DateTime.now().minus({ days: 1 })
    ldb.logs.add({
        timestamp: d2.toMillis(),
        month: d2.month,
        day: d2.day,
        year: d2.year,
        time: "1:00",
        zone: d2.zoneName,
        average: "average",
        mood: Math.round((Math.random() * 10) - 5),
        journal: "fake",
        files: []
    })
}

const setOneTwoDaysAgoOneTodayOneTomorrow = () => {
    ldb.logs.clear();
    const d1 = DateTime.now().plus({ days: 1 });
    ldb.logs.add({
        timestamp: d1.toMillis(),
        month: d1.month,
        day: d1.day,
        year: d1.year,
        time: "1:00",
        zone: d1.zoneName,
        average: "average",
        mood: Math.round((Math.random() * 10) - 5),
        journal: "fake",
        files: []
    })

    const d2 = DateTime.now().minus({ days: 2 })
    ldb.logs.add({
        timestamp: d2.toMillis(),
        month: d2.month,
        day: d2.day,
        year: d2.year,
        time: "1:00",
        zone: d2.zoneName,
        average: "average",
        mood: Math.round((Math.random() * 10) - 5),
        journal: "fake",
        files: []
    })

    // This log happens the "today", but has a higher timestamp that tomorrow!
    const d3 = DateTime.now()
    ldb.logs.add({
        timestamp: d1.toMillis() + 1000,
        month: d3.month,
        day: d3.day,
        year: d3.year,
        time: "1:00",
        zone: d3.zoneName,
        average: "average",
        mood: Math.round((Math.random() * 10) - 5),
        journal: "fake",
        files: []
    })
}

const DebugButtons = () => {
    const [user] = useAuthState(auth);
    const clearJournalPrompt = useCallback(() => {
        if (!user) return;
        
        remove(ref(db, `${user.uid}/prompts/streak`)).then(() => {
            toast("Cleared journal prompt from DB!");
        });
    }, [user]);

    return <>
        <IonButton style={{"display": "none"}} mode="ios" onClick={addWIRFakeData}>Add Local Fake Data For WIR</IonButton>
        <IonButton style={{"display": "none"}} mode="ios" onClick={setOneTodayOneTomorrow}>One Today One Tomorrow</IonButton>
        <IonButton style={{"display": "none"}} mode="ios" onClick={setOneYesterdayOneTomorrow}>One Yesterday One Tomorrow</IonButton>
        <IonButton style={{"display": "none"}} mode="ios" onClick={setOneTwoDaysAgoOneTodayOneTomorrow}>One Two Days Ago One Today One Tomorrow</IonButton>
        { user && <IonButton style={{"display": "none"}} mode="ios" onClick={clearJournalPrompt}>Clear Journal Prompt from DB</IonButton> }
    </>

}

export default DebugButtons;