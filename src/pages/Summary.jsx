import { IonContent, IonPage, IonFab, IonFabButton, IonIcon } from "@ionic/react";
import { useEffect } from "react";
import ldb from "../db";
import { getDatabase, ref, get, query, startAfter, orderByKey } from "firebase/database";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { pencil } from "ionicons/icons";
import history from "../history";
import "./Container.css";

const Summary = () => {
    const [, loading] = useAuthState(auth);

    // Data refresh -- check timestamp and pull in new data
    useEffect(() => {
        (async () => {
            if (loading) {
                console.log("no auth yet");
                return;
            }

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
            let newData = (
                await get(query(ref(db, `/${auth.currentUser.uid}/logs`), orderByKey(), startAfter(String(lastUpdated))))
            ).val();
            
            if (newData) {
                // Add timestamp to data object
                for (let key in newData) {
                    newData[key].timestamp = Number(key);
                }

                ldb.logs.bulkAdd(Object.values(newData));
            }
        })();
    }, [loading]);

    return (
        <IonPage>
            <IonContent fullscreen>
                <div className="container">
                    <br/><br/>
                    Summary
                </div>
                <IonFab vertical="bottom" horizontal="end" slot="fixed" onClick={() => { history.push("/journal") }}>
                    <IonFabButton>
                        <IonIcon icon={pencil} />
                    </IonFabButton>
                </IonFab>
            </IonContent>
        </IonPage>
    );
};

export default Summary;
