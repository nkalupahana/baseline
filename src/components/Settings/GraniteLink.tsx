import { IonSpinner } from "@ionic/react";
import { useEffect, useState } from "react";
import Preloader from "../../pages/Preloader";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { DataSnapshot, off, onValue, ref } from "firebase/database";
import { OAuth2Client } from "@byteowls/capacitor-oauth2";
import { makeRequest, toast } from "../../helpers";
import hash from "crypto-js/sha256";
import base64 from "crypto-js/enc-base64url"
import { Capacitor } from "@capacitor/core";
import ga from "./GraniteAccess.png";

const GraniteLink = () => {
    const [user] = useAuthState(auth);
    const [submitting, setSubmitting] = useState(false);
    const [linkData, setLinkData] = useState<boolean | undefined>(undefined);
    useEffect(() => {
        if (!user) return;
        const listener = async (snap: DataSnapshot) => {
            setLinkData(!!snap.val());
            setSubmitting(false);
        }
        const graniteRef = ref(db, `/${user.uid}/partners/granite`)
        onValue(graniteRef, listener);

        return () => {
            off(graniteRef, "value", listener);
        };
    }, [user]);

    const graniteAccess = async () => {
        setSubmitting(true);
        let redirectUrl = "";
        if (Capacitor.getPlatform() === "web") {
            redirectUrl = `${window.location.origin}/granite/callback`;
        } else {
            redirectUrl = "app.getbaseline.baseline:/";
        }

        try {
            const code_verifier = crypto.randomUUID() + crypto.randomUUID();
            const res = await OAuth2Client.authenticate({
                appId: "J2TW2CuBnWMoiBSp",
                authorizationBaseUrl: "https://granite-platform.herokuapp.com/oidc/auth",
                accessTokenEndpoint: "https://granite-platform.herokuapp.com/oidc/token",
                responseType: "code",
                scope: "openid",
                pkceEnabled: true,
                redirectUrl,
                web: {
                    accessTokenEndpoint: "",
                    pkceEnabled: false,
                    additionalParameters: {
                        code_challenge: hash(code_verifier).toString(base64),
                        code_challenge_method: "S256"
                    }
                }
            });
            
            if (Capacitor.getPlatform() === "web") {
                await makeRequest("accounts//granite/link", user, {
                    flow: "code",
                    code: res.authorization_response.code,
                    redirect_uri: redirectUrl,
                    code_verifier
                }, setSubmitting);
            } else {
                await makeRequest("accounts/granite/link", user, {
                    flow: "token",
                    access_token: res.access_token_response.access_token,
                    id_token: res.access_token_response.id_token
                }, setSubmitting);
            }
        } catch (e: any) {
            toast(`Connection error, please try again. (${e.message})`);
            setSubmitting(false);
            throw e; // surfaces to Sentry
        }
    };

    return <>
        { linkData === false && <div className="margin-top-12">
            { !submitting && <img src={ga} onClick={graniteAccess} alt="Connect with GraniteAccess" style={{"maxWidth": "200px"}} /> }
            { submitting && <><IonSpinner className="loader" name="crescent" /> <span className="fake-link" onClick={() => setSubmitting(false)}>Connecting with GraniteAccess, tap to cancel.</span></> }
        </div> }
        { linkData === true && <p className="margin-top-12 margin-bottom-0">Linked with GraniteAccess!</p> }
        { linkData === undefined && <Preloader message="" /> }
    </>;
};

export default GraniteLink;