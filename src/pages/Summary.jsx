import { IonContent, IonFab, IonFabButton, IonIcon, IonItem, IonLabel, IonList, IonMenu } from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import ldb from "../db";
import { ref, get, query, startAfter, orderByKey, onValue, off } from "firebase/database";
import { auth, db, signOutAndCleanUp } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { analytics, cashOutline, cogOutline, helpBuoyOutline, menuOutline, notifications, pencil } from "ionicons/icons";
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
import { checkKeys, decrypt, encrypt, parseSettings, setSettings, toast } from "../helpers";
import { FCM } from "@capacitor-community/fcm";

const Summary = () => {
    const [user] = useAuthState(auth);
    const [inFullscreen, setInFullscreen] = useState(false);
    const [gettingData, setGettingData] = useState(true);
    const menuRef = useRef();
    const logsQuery = useLiveQuery(() => ldb.logs.orderBy("timestamp").reverse().toArray());
    const [logs, setLogs] = useState([]);
    const [searchMode, setSearchMode] = useState(false);

    useEffect(() => {
        if (Capacitor.getPlatform() !== "web") FCM.subscribeTo({ topic: "all" });
        const keys = checkKeys();
        if (!keys) {
            signOutAndCleanUp();
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        get(ref(db, `/${user.uid}/pdp/method`))
            .then(snap => snap.val())
            .then(val => {
                setSettings("pdp", val);
            });

        get(ref(db, `/${user.uid}/pdp/passphraseUpdate`))
            .then(snap => snap.val())
            .then(val => {
                const update = parseSettings()["passphraseUpdate"];
                if (update !== val && !(!val && !update)) {
                    toast("Your data protection method has changed elsewhere. To protect your security, we ask that you sign in again.");
                    signOutAndCleanUp();
                }
            });
    }, [user]);

    // Data refresh -- check timestamp and pull in new data
    useEffect(() => {
        if (!user) return;
        const listener = async snap => {
            setGettingData(true);
            let lastUpdated = 0;
            const trueLastUpdated = snap.val();
            const lastLog = await ldb.logs.orderBy("timestamp").reverse().limit(1).first();
            if (trueLastUpdated && lastLog) {
                lastUpdated = lastLog.timestamp;
                if (lastUpdated === trueLastUpdated) {
                    window.location.hash = "";
                    console.log("Up to date!");
                    setGettingData(false);
                    return;
                }
            }

            console.log("Updating...");
            window.location.hash = "#update";
            let newData = (await get(query(ref(db, `/${user.uid}/logs`), orderByKey(), startAfter(String(lastUpdated))))).val();

            if (newData) {
                if (Capacitor.getPlatform() !== "web") LocalNotifications.clearDeliveredNotifications();
                const keys = checkKeys();
                if (keys === "discreet") {
                    setGettingData(false);
                    window.location.hash = "";
                    return;
                }

                // Add timestamp to data object, and decrypt as needed
                const pdpSetting = parseSettings()["pdp"];
                const pwd = sessionStorage.getItem("pwd");
                for (const key in newData) {
                    if ("data" in newData[key] && keys) {
                        newData[key] = JSON.parse(decrypt(newData[key].data, `${keys.visibleKey}${keys.encryptedKeyVisible}`));
                    }
                    newData[key].timestamp = Number(key);
                    if (pdpSetting) {
                        newData[key].ejournal = encrypt(newData[key].journal, pwd);
                        newData[key].journal = "";
                        if (newData[key].files) {
                            newData[key].efiles = encrypt(JSON.stringify(newData[key].files), pwd);
                            delete newData[key].files;
                        }
                    }
                }

                await ldb.logs.bulkAdd(Object.values(newData));
            }
            setGettingData(false);
            window.location.hash = "";
        };
        const lastUpdatedRef = ref(db, `/${auth.currentUser.uid}/lastUpdated`);
        onValue(lastUpdatedRef, listener);

        return () => {
            off(lastUpdatedRef, "value", listener);
        };
    }, [user, setGettingData]);

    useEffect(() => {
        if (parseSettings()["pdp"] && logsQuery) {
            const pwd = sessionStorage.getItem("pwd");
            if (!sessionStorage.getItem("pwd")) {
                setLogs([]);
                return;
            }

            let l = JSON.parse(JSON.stringify(logsQuery));
            for (let i = 0; i < logsQuery.length; ++i) {
                l[i].journal = decrypt(l[i].ejournal, pwd);
                if (l[i].efiles) {
                    l[i].files = JSON.parse(decrypt(l[i].efiles, pwd));
                }
            }

            setLogs(l);
        } else {
            setLogs(logsQuery);
        }
    }, [logsQuery]);

    return (
        <div>
            <div id="mainContent">
                <Media
                    queries={{
                        week: "(max-width: 900px)",
                        month: "(min-width: 901px)",
                    }}
                >
                    {matches => (
                        <>
                            { matches.week && <WeekSummary 
                                inFullscreen={inFullscreen} 
                                setInFullscreen={setInFullscreen} 
                                search={{
                                    get: searchMode,
                                    set: setSearchMode
                                }} 
                                logs={logs} 
                            /> }
                            { matches.month && <MonthSummary inFullscreen={inFullscreen} setInFullscreen={setInFullscreen} logs={logs} /> }
                            { logs && logs.length === 0 && !gettingData && <p className="text-center container">Write your first mood log by clicking on the pencil in the bottom right!</p> }
                            { (!logs || (logs.length === 0 && gettingData)) && <Preloader /> }
                        </>
                    )}
                </Media>
            </div>
            { !inFullscreen && <IonFab vertical="bottom" horizontal="end" slot="fixed" class="journal-fab" id="journal-fab">
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
            <IonMenu ref={menuRef} disabled={inFullscreen} side="end" contentId="mainContent" menuId="mainMenu">
                <IonContent>
                    <IonList className="menu">
                        <div style={{"height": "max(env(safe-area-inset-top), 10px)", "width": "100%"}}></div>
                        <IonItem onClick={() => history.push("/notifications")} mode="ios" >
                            <IonIcon icon={notifications} slot="start" />
                            <IonLabel>Notifications</IonLabel>
                        </IonItem>
                        <IonItem onClick={() => history.push("/gap")} mode="ios">
                            <IonIcon icon={cashOutline} slot="start" />
                            <IonLabel>Gap Fund</IonLabel>
                        </IonItem>
                        <IonItem onClick={() => history.push("/surveys")} mode="ios">
                            <IonIcon icon={analytics} slot="start" />
                            <IonLabel>Surveys</IonLabel>
                        </IonItem>
                        <IonItem onClick={() => history.push("/gethelp")} mode="ios">
                            <IonIcon icon={helpBuoyOutline} slot="start" />
                            <IonLabel>Get Help</IonLabel>
                        </IonItem>
                        <IonItem className="move-rest-down" onClick={() => history.push("/settings")} mode="ios">
                            <IonIcon icon={cogOutline} slot="start" />
                            <IonLabel>Settings</IonLabel>
                        </IonItem>
                        <IonItem onClick={signOutAndCleanUp} mode="ios">
                            <IonLabel>Sign Out</IonLabel>
                        </IonItem>
                        <div style={{"height": "20px"}}></div>
                    </IonList>
                </IonContent>
            </IonMenu>
            <PromptWeekInReview />
        </div>
    );
};

export default Summary;
