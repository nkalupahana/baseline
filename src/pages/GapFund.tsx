import { DataSnapshot, off, ref, serverTimestamp, set } from "@firebase/database";
import { IonIcon, IonInput, IonItem, IonLabel, IonSpinner, IonTextarea, useIonToast } from "@ionic/react";
import { onValue } from "firebase/database";
import { closeOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import EndSpacer from "../components/EndSpacer";
import Textarea from "../components/Textarea";
import { auth, db } from "../firebase";
import history from "../history";
import Preloader from "./Preloader";

const GapFund = () => {
    const [email, setEmail] = useState("");
    const [confirmEmail, setConfirmEmail] = useState("");
    const [need, setNeed] = useState("");
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [gapFundData, setGapFundData] = useState(false);

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
    useEffect(() => {
        if (loading) return;
        const listener = async (data: DataSnapshot) => {
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
                { gapFundData === false && <Preloader />}
                { gapFundData === null && <>
                    <p className="text-center">something about capitalism you know the drill</p>
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
                { gapFundData && <p>submitted</p>}
            </div>
            <EndSpacer />
        </div>
    );
};

export default GapFund;