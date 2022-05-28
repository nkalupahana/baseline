import { DataSnapshot, off, ref } from "@firebase/database";
import { IonIcon, IonInput, IonItem, IonLabel, IonSpinner } from "@ionic/react";
import { get, onValue } from "firebase/database";
import { closeOutline } from "ionicons/icons";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import EndSpacer from "../components/EndSpacer";
import Textarea from "../components/Textarea";
import ldb from "../db";
import { auth, db, signOutAndCleanUp } from "../firebase";
import { checkKeys, decrypt, goBackSafely, makeRequest, toast } from "../helpers";
import history from "../history";
import Preloader from "./Preloader";

interface GapFundData {
    email: string;
    need: string;
    amount: string;
    method: string;
}

enum SubmissionState {
    NO_DATA_YET,
    NO_SUBMISSION,
    NOT_ELIGIBLE
}

const GapFund = () => {
    const [email, setEmail] = useState("");
    const [confirmEmail, setConfirmEmail] = useState("");
    const [need, setNeed] = useState("");
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [gapFundData, setGapFundData] = useState<SubmissionState | GapFundData>(SubmissionState.NO_DATA_YET);
    const [gapFundAvailable, setGapFundAvailable] = useState(null);
    const [user, loading] = useAuthState(auth);
    const keys = checkKeys();

    // Preload until auth is ready and gap fund data is loaded
    // Also ensure that gap fund is available before displaying
    useEffect(() => {
        if (loading) return;

        const listener = async (snap: DataSnapshot) => {
            setGapFundAvailable(await (await get(ref(db, "/config/gapFundAvailable"))).val());
            let data = await snap.val();
            if (data === null) {
                const firstLogTime = await ldb.logs.orderBy("timestamp").limit(1).first();
                const numLogs = await ldb.logs.count();
                // Must have 7+ logs, and the first log must be from at least a week ago
                if (!firstLogTime || DateTime.now().toMillis() - firstLogTime.timestamp < 604800000 || numLogs < 7) {
                    setGapFundData(SubmissionState.NOT_ELIGIBLE);
                } else {
                    setGapFundData(SubmissionState.NO_SUBMISSION);
                }
            } else {
                console.log(data);
                if ("data" in data) {
                    if (!keys) {
                        signOutAndCleanUp();
                        return;
                    } else if (typeof keys === "string") {
                        return;
                    }
                    
                    data = JSON.parse(decrypt(data["data"], `${keys.visibleKey}${keys.encryptedKeyVisible}`));
                }
                setGapFundData(data);
            }
        }
        const gapFundRef = ref(db, `/${auth?.currentUser?.uid}/gapFund`);
        onValue(gapFundRef, listener);

        return () => {
            off(gapFundRef, "value", listener);
        };
    }, [loading, keys]);

    const submit = async () => {
        if (submitting) return;
        setSubmitting(true);
        if (!email.trim() || !need.trim() || !amount.trim() || !method.trim()) {
            toast("Please complete all fields before submitting!");
            setSubmitting(false);
            return;
        }

        if (email !== confirmEmail) {
            toast("Your email addresses must match!");
            setSubmitting(false);
            return;
        }

        if (email.length >= 10000 || need.length >= 10000 || amount.length >= 10000 || method.length >= 10000) {
            toast("Each field must be under 10,000 characters.");
            setSubmitting(false);
            return;
        }

        makeRequest("gapFund", user, {
            email,
            need,
            amount,
            method,
            keys: JSON.stringify(keys)
        }, setSubmitting);
    };

    return (
        <div className="container">
            <IonIcon class="top-corner x" icon={closeOutline} onClick={goBackSafely}></IonIcon>
            <div className="center-journal container">
                <div className="title">baseline Gap Fund</div>
                <p className="text-center">
                    Even when everything goes right, mental health can still be a struggle. But when money's involved,
                    we recognize that things can get way, way harder. If you're struggling with money
                    and it's negatively impacting you, the baseline gap fund can help you "fill in the gaps" and get
                    financial assistance quickly. This money can be used for pretty much anything, 
                    including therapy, medication, transportation, basic necessities like food and shelter, and more. Requests are typically $50
                    or less, but if you need more, it never hurts to request it &mdash; we'll work with you to help you get what you need.
                </p>
                <p className="text-center">
                    This is a volunteer operation funded by donations. If you have money to spare to help people in need, 
                    please <span className="fake-link" onClick={() => {history.push("/donate")}}>donate it here!</span> 100% of donations go to the gap fund.
                </p>
                <div style={{width: "100%", height: "25px", borderTop: "1px #d2d1d1 solid"}}></div>
                { gapFundData === SubmissionState.NO_DATA_YET && <Preloader /> }
                { gapFundData === SubmissionState.NOT_ELIGIBLE && <p>
                    You haven't used baseline for long enough to be eligible to request gap funds! 
                    Come back after you've consistently used baseline for at least a week.
                    If you need help, contact us at <a href="mailto:gapfund@getbaseline.app">gapfund@getbaseline.app</a>.
                </p> }
                { gapFundData === SubmissionState.NO_SUBMISSION && gapFundAvailable && <>
                    <div style={{"width": "90%"}}>
                        <IonItem>
                            <IonLabel className="ion-text-wrap" position="stacked">Email</IonLabel>
                            <IonInput id="email" value={email} inputMode="email" onIonChange={e => setEmail(e.detail.value!)}></IonInput>
                        </IonItem>
                        <IonItem>
                            <IonLabel className="ion-text-wrap" position="stacked">Confirm Email</IonLabel>
                            <IonInput id="confirmEmail" value={confirmEmail} inputMode="email" onIonChange={e => setConfirmEmail(e.detail.value!)}></IonInput>
                        </IonItem>
                        <p>Make sure you get this right -- we'll be sending more information here. If your email is monitored by people
                            you don't want seeing this request, make a burner email, or list a safer contact method above.
                        </p>
                        <br />
                        <IonItem>
                            <IonLabel className="ion-text-wrap" position="stacked">What do you need money for?</IonLabel>
                            <Textarea id="need" getter={need} setter={setNeed} />
                        </IonItem>
                        <br />
                        <IonItem>
                            <IonLabel className="ion-text-wrap" position="stacked">How much money do you want?</IonLabel>
                            <Textarea id="amount" getter={amount} setter={setAmount} />
                        </IonItem>
                        <p>We may not be able to give the full amount you need due to financial limitations, 
                            so list multiple amounts if there are different ways we can help you.
                            We'll try our best to complete your full request.</p>
                        <br />
                        <IonItem>
                            <IonLabel className="ion-text-wrap" position="stacked">Paypal / Venmo / Cash App / Zelle</IonLabel>
                            <Textarea id="method" getter={method} setter={setMethod} placeholder={"Venmo: @username"} />
                        </IonItem>
                        <p>If you need us to use a different method to get you money, explain it above and we'll reach out to you.</p>
                        <br />
                        <div className="finish-button" onClick={submit}>
                            { !submitting && <>Submit</> }
                            { submitting && <IonSpinner className="loader" name="crescent" /> }
                        </div>
                    </div>
                </> }
                { (gapFundData === SubmissionState.NO_SUBMISSION && !gapFundAvailable) && 
                    <p>Unfortunately, due to financial limitations from the number of requests we've received,
                        we can't accept any more requests at this time. Please check back later. If you have
                        some extra money and can donate to help us fund more people, please do!
                    </p> }
                { typeof gapFundData === "object" && <>
                    <p>Thanks for submitting the gap fund request detailed below. You should
                        get an email from us about your funding in the next few days. 
                        In the meantime, if you have any questions, 
                        email us at <a href="mailto:gapfund@getbaseline.app">gapfund@getbaseline.app</a> (ideally from the email you submitted in your gap fund request).
                    </p>
                    <div style={{"width": "100%"}}>
                        <p className="margin-bottom-0">Email: { gapFundData.email }</p>
                        <p className="margin-bottom-0">Need: { gapFundData.need }</p>
                        <p className="margin-bottom-0">Amount: { gapFundData.amount }</p>
                        <p className="margin-bottom-0">Payment Method: { gapFundData.method }</p>
                    </div>
                </> }
            </div>
            <EndSpacer />
        </div>
    );
};

export default GapFund;