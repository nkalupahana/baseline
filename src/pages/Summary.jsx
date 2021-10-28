import { IonContent, IonPage } from "@ionic/react";
import { useEffect } from "react";
import ldb from "../db";
import { getDatabase, ref, get, query, startAt, orderByChild } from "firebase/database";
import { auth } from "../firebase";

const Summary = () => {
    // Data refresh -- check timestamp and pull in new data
    useEffect(() => {
        (async () => {
            let lastUpdated = 0;
            const lastLog = await ldb.logs.orderBy("timestamp").reverse().limit(1).first();
            const db = getDatabase();
            if (lastLog) {
                lastUpdated = lastLog.timestamp;
                const trueLastUpdated = (await get(ref(db, `/${auth.currentUser.uid}/lastUpdated`))).val();

                if (lastUpdated == trueLastUpdated) {
                    console.log("Up to date!");
                    return;
                }
            }
            
            console.log("Updating...");
            const newData = (await get(query(ref(db, `/${auth.currentUser.uid}/logs`), orderByChild("timestamp"), startAt(lastUpdated, "timestamp")))).val();
            if (newData) ldb.logs.bulkPut(Object.values(newData));
        })();
    }, []);

    return (
        <IonPage>
            <IonContent fullscreen>Summary</IonContent>
        </IonPage>
    );
};

export default Summary;
