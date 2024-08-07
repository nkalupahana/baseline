import { Device } from "@capacitor/device";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { User } from "firebase/auth";
import { DateTime } from "luxon";
import { useState } from "react";
import { makeRequest } from "../../helpers";
import history from "../../history";
import Notifications from "../../pages/Notifications";
import { Capacitor } from "@capacitor/core";
import * as Sentry from "@sentry/react";

const OnboardingNotifications = ({ user } : { user: User }) => {
    const [loadingFlow, setLoadingFlow] = useState(false);

    const continueFlow = async () => {
        setLoadingFlow(true);
        try {
            const platform = Capacitor.getPlatform();
            await FirebaseMessaging.requestPermissions();
            let token;
            try {
                token = await FirebaseMessaging.getToken();
            } catch (e) {
                Sentry.captureException(e, { extra: { handled: true } });
            }

            await makeRequest("accounts/sync", user, {
                offset: DateTime.now().offset,
                fcmToken: token?.token,
                deviceId: (await Device.getId()).identifier,
                platform
            });
            
            // Retried on native layer, so ignore failures
            FirebaseMessaging.subscribeToTopic({ topic: "all" }).catch(() => {});
            FirebaseMessaging.subscribeToTopic({ topic: platform }).catch(() => {});
        } catch {}
        if (localStorage.getItem("onboarding")) {
            localStorage.setItem("onboarding", "howto");
            history.push("/onboarding/howto");
        } else {
            history.replace("/journal");
        }
    }

    return <>
        <Notifications page={false} continueFlow={continueFlow} loadingFlow={loadingFlow} />
        <p style={{"marginTop": "auto", "paddingTop": "12px"}}>{ localStorage.getItem("onboarding") && <>step 2 of 5</> }</p>
    </>;
}

export default OnboardingNotifications;