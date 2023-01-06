import { Capacitor } from "@capacitor/core";
import { ref, remove, serverTimestamp, set } from "@firebase/database";
import { IonSpinner } from "@ionic/react";
import { User } from "firebase/auth";
import { colorWandOutline, flameOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { setSettings } from "../../helpers";
import history from "../../history";
import ThreeBox from "../ThreeBox";
import "./Onboarding.css";

enum Selection {
    STANDARD,
    EXPERT
}

const OnboardingMode = ({ user } : { user: User }) => {
    const [selection, setSelection] = useState<Selection>(Selection.STANDARD);
    const notSelected = {"border": "1px solid grey"};
    const selected = {"border": "2px solid var(--background-color-inverted)"};
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!submitting || !user) return;
        (async () => {
            const r = ref(db, `${user.uid}/onboarding/beginner`);
            if (selection === Selection.STANDARD) {
                await set(r, serverTimestamp());
                setSettings("beginner", Date.now());
            } else {
                await remove(r);
                setSettings("beginner", false);
            }

            if (Capacitor.getPlatform() !== "web") {
                localStorage.setItem("onboarding", "notifications");
                history.push("/onboarding/notifications");
            } else {
                localStorage.setItem("onboarding", "howto");
                history.push("/onboarding/howto");
            }
        })();
    }, [submitting, selection, user]);

    return <>
        <div className="title">New to journaling?</div>
        <p className="margin-bottom-24">
            baseline is designed to capture your mood in 
            the moment a few times a day. If you haven't done journaling 
            like this consistently before, we recommend sticking with Standard Mode.
        </p>
        <div style={{"width": "90%"}}>
            <div
                className="onboarding-box" 
                style={selection === Selection.STANDARD ? selected : notSelected}
                onClick={() => !submitting && setSelection(Selection.STANDARD)}
            >
                <ThreeBox 
                    icon={colorWandOutline} 
                    title={"Standard (recommended)"} 
                    description={"New to this type of journaling? Get some extra support for your first few weeks."}
                />
            </div>
            <br />
            <div 
                className="onboarding-box margin-bottom-12" 
                style={selection === Selection.EXPERT ? selected : notSelected}
                onClick={() => !submitting && setSelection(Selection.EXPERT)}
            >
                <ThreeBox 
                    icon={flameOutline} 
                    title={"Expert"} 
                    description={"Already done a lot of this before? We'll leave you alone."}
                />
            </div>
            <br />
        </div>
        { selection !== undefined && user && <div className="finish-button max-width-500" onClick={() => setSubmitting(true)}>
            { !submitting && <>Continue</> }
            { submitting && <IonSpinner className="loader" name="crescent" /> }
        </div> }
        <p style={{"marginTop": "auto"}}>step 1 of 5</p>
    </>;
};

export default OnboardingMode;