import { IonContent, IonPage } from "@ionic/react";
import { useEffect } from "react";
import ldb from "../db";
import { getDatabase, ref, get, query, startAt, orderByChild } from "firebase/database";
import { auth } from "../firebase";

const Summary = () => {
    useEffect(() => {
        (async () => {
            let lastUpdated = 0;
            const count = await ldb.logs.count();
            console.log(count);
            const db = getDatabase();
            if (count !== 0) {
                const lastLog = await ldb.logs.orderBy("timestamp").reverse().limit(1).first();
                lastUpdated = lastLog.timestamp;
                console.log(lastUpdated);

                const trueLastUpdated = (await get(ref(db, `/${auth.currentUser.uid}/lastUpdated`))).val();
                console.log(trueLastUpdated);

                if (lastUpdated == trueLastUpdated) {
                    console.log("Up to date!");
                    return;
                }
            }
            
            console.log("Updating...");
            const newData = (await get(query(ref(db, `/${auth.currentUser.uid}/logs`), orderByChild("timestamp"), startAt(lastUpdated, "timestamp")))).val();
            console.log(newData);
            ldb.logs.bulkPut(Object.values(newData));
        })();
    }, []);

    return (
        <IonPage>
            <IonContent fullscreen>Summary</IonContent>
        </IonPage>
    );
};

export default Summary;
