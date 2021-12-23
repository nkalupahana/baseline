import { IonContent, IonPage, IonFab, IonFabButton, IonIcon, IonFabList } from "@ionic/react";
import { useEffect, Fragment } from "react";
import ldb from "../db";
import { getDatabase, ref, get, query, startAfter, orderByKey } from "firebase/database";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { cog, pencil } from "ionicons/icons";
import Media from "react-media";
import WeekSummary from "../components/WeekSummary";
import MonthSummary from "../components/MonthSummary";
import history from "../history";
import "./Container.css";
import "./Summary.css";
import SummaryHeader from "../components/SummaryHeader";

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
            let newData = (await get(query(ref(db, `/${auth.currentUser.uid}/logs`), orderByKey(), startAfter(String(lastUpdated))))).val();

            if (newData) {
                // Add timestamp to data object
                for (let key in newData) {
                    newData[key].timestamp = Number(key);
                }

                ldb.logs.bulkAdd(Object.values(newData));
            }
        })();
    }, [loading]);

    useEffect(() => {
        setTimeout(() => {
            document.getElementById("journal-fab").style.opacity = 1;
        }, 500);
    }, []);

    return (
        <div>
            <div className="container">
                <Media
                    queries={{
                        week: "(max-width: 700px)",
                        month: "(min-width: 701px)",
                    }}
                >
                    {matches => (
                        <Fragment>
                            {matches.week && <WeekSummary />}
                            {matches.month && <MonthSummary />}
                        </Fragment>
                    )}
                </Media>
            </div>
            <IonFab
                vertical="bottom"
                horizontal="end"
                slot="fixed"
                class="journal-fab"
                id="journal-fab"
                activated={true}
            >
                <IonFabButton closeIcon={pencil} activated={false} onClick={() => {
                    history.push("/journal");
                }}>
                    <IonIcon icon={pencil} />
                </IonFabButton>
                <IonFabList side="top">
                    <IonFabButton onClick={() => {
                        history.push("/settings");
                    }}>
                        <IonIcon icon={cog} />
                    </IonFabButton>
                </IonFabList>
            </IonFab>
        </div>
    );
};

export default Summary;
