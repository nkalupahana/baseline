const Onboarding = () => {
    /*
    const finishSignIn = async () => {
        try {
            await FirebaseMessaging.requestPermissions();
            const token = await FirebaseMessaging.getToken();
            await makeRequest("accounts/sync", auth.currentUser!, {
                offset: DateTime.now().offset,
                fcmToken: token.token,
                deviceId: (await Device.getId()).uuid,
                utm_source: localStorage.getItem("utm_source"),
                utm_campaign: localStorage.getItem("utm_campaign"),
            });
            await FirebaseMessaging.subscribeToTopic({ topic: "all" });
        } catch {}
        setLoggingIn(false);
    }
    */

    return <p>onboarding</p>;
}

export default Onboarding;