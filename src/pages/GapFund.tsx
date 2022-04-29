import { DataSnapshot, off, ref, serverTimestamp, set } from "@firebase/database";
import { IonIcon, IonInput, IonItem, IonLabel, IonSpinner, useIonToast } from "@ionic/react";
import { get, onValue } from "firebase/database";
import { closeOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import EndSpacer from "../components/EndSpacer";
import Textarea from "../components/Textarea";
import { auth, db } from "../firebase";
import history from "../history";
import Preloader from "./Preloader";

interface GapFundData {
    email: string;
    need: string;
    amount: string;
    method: string;
}

const GapFund = () => {
    const [email, setEmail] = useState("");
    const [confirmEmail, setConfirmEmail] = useState("");
    const [need, setNeed] = useState("");
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [gapFundData, setGapFundData] = useState<boolean | null | GapFundData>(false);
    const [gapFundAvailable, setGapFundAvailable] = useState(null);

    const [present] = useIonToast();
    const [, loading] = useAuthState(auth);

    const toast = (message: string) => {
        present({
            message,
            position: "bottom",
            duration: 3000
        });
        setSubmitting(false);
    };

    // Preload until auth is ready and gap fund data is loaded
    // Also ensure that gap fund is available before displaying
    useEffect(() => {
        if (loading) return;

        const listener = async (data: DataSnapshot) => {
            setGapFundAvailable(await (await get(ref(db, "/config/gapFundAvailable"))).val());
            setGapFundData(await data.val());
        }
        const gapFundRef = ref(db, `/${auth?.currentUser?.uid}/gapFund`);
        onValue(gapFundRef, listener);

        return () => {
            off(gapFundRef, "value", listener);
        };
    }, [loading]);

    const submit = async () => {
        if (submitting) return;
        setSubmitting(true);
        if (!email || email.length >= 1000) {
            toast("Please enter your email address. It must be under 1000 characters.");
            return;
        }

        if (email !== confirmEmail) {
            toast("Your email addresses do not match!");
            return;
        }

        if (!need || need.length >= 10000) {
            toast("Please tell us what you need money for. It must be under 10000 characters.");
            return;
        }

        if (!amount || amount.length >= 10000) {
            toast("Please tell us how much money you want. It must be under 10000 characters.");
            return;
        }

        if (!method || method.length >= 10000) {
            toast("Please tell us how we can get money to you. It must be under 10000 characters.");
            return;
        }
        
        try {
            await set(ref(db, `/${auth?.currentUser?.uid}/gapFund`), {
                email,
                need,
                amount,
                method,
                timestamp: serverTimestamp()
            });
        } catch {
            toast("There was an error submitting your request. Please try again.");
            return;
        }
    };

    return (
        <div className="container">
            <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.length > 2 ? history.goBack() : history.push("/summary")}></IonIcon>
            <div className="center-journal container">
                <div className="title">baseline Gap Fund</div>
                <p className="text-center">capitalism sucks. get your money here.</p>
                { gapFundData === false && <Preloader />}
                { gapFundData === null && gapFundAvailable && <>
                    <div style={{"width": "90%"}}>
                        <IonItem>
                            <IonLabel className="ion-text-wrap" position="stacked">Email</IonLabel>
                            <IonInput value={email} inputMode="email" onIonChange={e => setEmail(e.detail.value!)}></IonInput>
                        </IonItem>
                        <IonItem>
                            <IonLabel className="ion-text-wrap" position="stacked">Confirm Email</IonLabel>
                            <IonInput value={confirmEmail} inputMode="email" onIonChange={e => setConfirmEmail(e.detail.value!)}></IonInput>
                        </IonItem>
                        <p>Make sure you get this right -- we'll be sending more information here. If your email is monitored by people
                            you don't want seeing this request, make a burner email, or list a safer contact method above.
                        </p>
                        <br />
                        <IonItem>
                            <IonLabel className="ion-text-wrap" position="stacked">What do you need money for?</IonLabel>
                            <Textarea getter={need} setter={setNeed} />
                        </IonItem>
                        <br />
                        <IonItem>
                            <IonLabel className="ion-text-wrap" position="stacked">How much money do you want?</IonLabel>
                            <Textarea getter={amount} setter={setAmount} />
                        </IonItem>
                        <p>We may not be able to give the full amount you need due to financial limitations, 
                            so list multiple amounts if there are different ways we can help you.
                            We'll try our best to complete your full request.</p>
                        <br />
                        <IonItem>
                            <IonLabel className="ion-text-wrap" position="stacked">Paypal / Venmo / Cash App / Zelle</IonLabel>
                            <Textarea getter={method} setter={setMethod} />
                        </IonItem>
                        <p>If you need us to use a different method to get you money, explain it above and we'll reach out to you.</p>
                        <br />
                        <div className="finish-button" onClick={submit}>
                            { !submitting && <>Submit</> }
                            { submitting && <IonSpinner className="loader" name="crescent" /> }
                        </div>
                    </div>
                </> }
                { gapFundData === null && !gapFundAvailable && 
                    <p>Unfortunately, due to financial limitations from the number of requests we've received,
                        we can't accept any more requests at this time. Please check back later. If you have
                        some extra money and can donate to help us fund more people, please do!
                    </p> }
                { gapFundData && typeof gapFundData === "object" && <>
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