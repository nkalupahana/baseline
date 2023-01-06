import { Device } from "@capacitor/device";
import { FirebaseMessaging } from "@getbaseline/capacitor-firebase-messaging";
import { User } from "firebase/auth";
import { DateTime } from "luxon";
import { useState } from "react";
import { makeRequest } from "../../helpers";
import history from "../../history";
import Notifications from "../../pages/Notifications";

const OnboardingNotifications = ({ user } : { user: User }) => {
    const [loadingFlow, setLoadingFlow] = useState(false);

    const continueFlow = async () => {
        setLoadingFlow(true);
        try {
            await FirebaseMessaging.requestPermissions();
            const token = await FirebaseMessaging.getToken();
            await makeRequest("accounts/sync", user, {
                offset: DateTime.now().offset,
                fcmToken: token.token,
                deviceId: (await Device.getId()).uuid,
                utm_source: localStorage.getItem("utm_source"),
                utm_campaign: localStorage.getItem("utm_campaign"),
            });
            await FirebaseMessaging.subscribeToTopic({ topic: "all" });
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