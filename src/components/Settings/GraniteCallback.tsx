import { useEffect } from "react";
import { makeRequest, toast } from "../../helpers";
import Preloader from "../../pages/Preloader";
import history from "../../history";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";

const GraniteCallback = () => {
    const [user] = useAuthState(auth);

    useEffect(() => {
        if (!user) return;
        (async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");
            const redirect_uri = localStorage.getItem("redirect_uri");
            if (!code || !redirect_uri) {
                toast("Something went wrong. Please try again.");
                history.replace("/settings");
                return;
            }

            localStorage.removeItem("redirect_uri");
            const success = await makeRequest("accounts/granite/link", user, {
                code,
                redirect_uri
            });

            if (success) {
                toast("Account linked!");
            }
            history.replace("/settings");
        })();
    }, [user]);

    const resetFlow = () => {
        localStorage.removeItem("redirect_uri");
        history.replace("/settings");
    };

    return <>
        <Preloader message="One minute, we're linking your account." />
        <br />
        <p>Been stuck here for over a minute?<br /><span className="fake-link" onClick={resetFlow}>Click here to try again.</span></p>
    </>;
};

export default GraniteCallback;