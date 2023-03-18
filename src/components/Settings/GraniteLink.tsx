import { IonButton } from "@ionic/react";
import { useEffect, useState } from "react";
import Preloader from "../../pages/Preloader";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { DataSnapshot, off, onValue, ref } from "firebase/database";
import { OAuth2Client } from "@byteowls/capacitor-oauth2";
import { toast } from "../../helpers";

const GraniteLink = () => {
    const [user] = useAuthState(auth);
    const [linkData, setLinkData] = useState<boolean | undefined>(undefined);
    useEffect(() => {
        if (!user) return;
        const listener = async (snap: DataSnapshot) => {
            setLinkData(!!snap.val());
        }
        const graniteRef = ref(db, `/${user.uid}/partners/granite`)
        onValue(graniteRef, listener);

        return () => {
            off(graniteRef, "value", listener);
        };
    }, [user]);

    const graniteAccess = async () => {
        const redirect_uri = `${window.location.origin}/granite/callback`;
        localStorage.setItem("redirect_uri", redirect_uri);
        try {
            await OAuth2Client.authenticate({
                appId: "76217571-ce1c-4492-bd0f-7c4d2aeb0026",
                authorizationBaseUrl: "https://granite-labs.herokuapp.com/oauth2/authorize",
                redirectUrl: redirect_uri
            });
        } catch (e: any) {
            toast(`Connection error, please try again. (${e.message})`);
            throw e; // surfaces to Sentry
        }
    };

    return <>
        { linkData === false && <IonButton onClick={graniteAccess}>Connect with GraniteAccess</IonButton> }
        { linkData === true && <p className="margin-top-0 margin-bottom-0">Linked with Granite!</p> }
        { linkData === undefined && <Preloader message="" /> }
    </>;
};

export default GraniteLink;