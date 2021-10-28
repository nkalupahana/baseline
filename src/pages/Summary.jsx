import { IonContent, IonPage } from "@ionic/react";
import { useEffect } from "react";
import ldb from "../db";
import { getDatabase, ref, get, query, startAt, orderByKey } from "firebase/database";
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
            let newData = (await get(query(ref(db, `/${auth.currentUser.uid}/logs`), orderByKey("timestamp"), startAt(String(lastUpdated))))).val();
            if (newData) {
                // Add timestamp to data object
                for (let key in newData) {
                    newData[key].timestamp = Number(key);
                }

                ldb.logs.bulkAdd(Object.values(newData));
            }
        })();
    }, []);

    return (
        <IonPage>
            <IonContent fullscreen>Summary</IonContent>
        </IonPage>
    );
};

export default Summary;
