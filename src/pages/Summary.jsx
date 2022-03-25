import { IonContent, IonFab, IonFabButton, IonIcon, IonItem, IonLabel, IonList, IonMenu } from "@ionic/react";
import { useEffect, useRef, useState, Fragment } from "react";
import ldb from "../db";
import { ref, get, query, startAfter, orderByKey, onValue, off } from "firebase/database";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { menuOutline, notifications, pencil } from "ionicons/icons";
import Media from "react-media";
import WeekSummary from "../components/Summary/Week/WeekSummary";
import MonthSummary from "../components/Summary/Month/MonthSummary";
import history from "../history";
import "./Container.css";
import "./Summary.css";
import PromptWeekInReview from "../components/Review/PromptWeekInReview";
import { LocalNotifications } from "@moody-app/capacitor-local-notifications";
import { Capacitor } from "@capacitor/core";
import { useLiveQuery } from "dexie-react-hooks";
import Preloader from "./Preloader";

const Summary = () => {
    const [, loading] = useAuthState(auth);
    const [menuDisabled, setMenuDisabled] = useState(false);
    const [gettingData, setGettingData] = useState(true);
    const menuRef = useRef();
    const logs = useLiveQuery(() => ldb.logs.orderBy("timestamp").reverse().toArray());

    // Data refresh -- check timestamp and pull in new data
    useEffect(() => {
        if (loading) return;
        const listener = async snap => {
            setGettingData(true);
            let lastUpdated = 0;
            const trueLastUpdated = snap.val();
            const lastLog = await ldb.logs.orderBy("timestamp").reverse().limit(1).first();
            if (trueLastUpdated && lastLog) {
                lastUpdated = lastLog.timestamp;
                if (lastUpdated === trueLastUpdated) {
                    console.log("Up to date!");
                    setGettingData(false);
                    return;
                }
            }

            console.log("Updating...");
            let newData = (await get(query(ref(db, `/${auth.currentUser.uid}/logs`), orderByKey(), startAfter(String(lastUpdated))))).val();

            if (newData) {
                if (Capacitor.getPlatform() !== "web") LocalNotifications.clearDeliveredNotifications();

                // Add timestamp to data object
                for (let key in newData) {
                    newData[key].timestamp = Number(key);
                }

                await ldb.logs.bulkAdd(Object.values(newData));
            }
            setGettingData(false);
        };
        const lastUpdatedRef = ref(db, `/${auth.currentUser.uid}/lastUpdated`);
        onValue(lastUpdatedRef, listener);

        return () => {
            off(lastUpdatedRef, "value", listener);
        };
    }, [loading, setGettingData]);

    return (
        <div>
            <div id="mainContent">
                <Media
                    queries={{
                        week: "(max-width: 850px)",
                        month: "(min-width: 851px)",
                    }}
                >
                    {matches => (
                        <Fragment>
                            { matches.week && <WeekSummary gettingData={gettingData} setMenuDisabled={setMenuDisabled} logs={logs} /> }
                            { matches.month && <MonthSummary gettingData={gettingData} setMenuDisabled={setMenuDisabled} logs={logs} /> }
                            { logs && logs.length === 0 && !gettingData && <p className="text-center container">Write your first mood log by clicking on the pencil in the bottom right!</p> }
                            { (!logs || (logs.length === 0 && gettingData)) && <Preloader /> }
                        </Fragment>
                    )}
                </Media>
            </div>
            { !menuDisabled && <IonFab vertical="bottom" horizontal="end" slot="fixed" class="journal-fab" id="journal-fab">
                <IonFabButton
                    size="small"
                    color="light"
                    style={{ marginBottom: "16px" }}
                    onClick={() => menuRef.current?.open()}
                >
                    <IonIcon style={{fontSize: "22px"}} icon={menuOutline} />
                </IonFabButton>
                <IonFabButton
                    closeIcon={pencil}
                    activated={true}
                    onClick={() => {
                        history.push("/journal");
                    }}
                >
                    <IonIcon icon={pencil} />
                </IonFabButton>
            </IonFab> }
            <IonMenu ref={menuRef} disabled={menuDisabled} side="end" contentId="mainContent" menuId="mainMenu">
                <IonContent>
                    <IonList>
                        <div style={{"height": "25px", "width": "100%"}}></div>
                        <IonItem onClick={() => history.push("/notifications")}>
                            <IonIcon icon={notifications} slot="start" />
                            <IonLabel>Notifications</IonLabel>
                        </IonItem>
                    </IonList>
                </IonContent>
            </IonMenu>
            <PromptWeekInReview />
        </div>
    );
};

export default Summary;
