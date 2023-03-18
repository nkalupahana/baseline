import { IonButton } from "@ionic/react";
import { useEffect, useState } from "react";
import Preloader from "../../pages/Preloader";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { get, ref } from "firebase/database";

const GraniteLink = () => {
    const [user] = useAuthState(auth);
    const [linkData, setLinkData] = useState<boolean | undefined>(undefined);
    useEffect(() => {
        if (!user) return;
        (async () => {
            const v = await get(ref(db, `/${user.uid}/partners/granite`));
            setLinkData(!!v.val());
        })();
    }, [user]);

    const graniteAccess = () => {
        const redirect_uri = `${window.location.origin}/granite/callback`;
        localStorage.setItem("redirect_uri", redirect_uri);
        window.location.href = `https://granite-labs.herokuapp.com/oauth2/authorize?client_id=76217571-ce1c-4492-bd0f-7c4d2aeb0026&redirect_uri=${redirect_uri}`;
    };

    return <>
        { linkData === false && <IonButton onClick={graniteAccess}>Connect with GraniteAccess</IonButton> }
        { linkData === true && <p className="margin-top-0 margin-bottom-0">Linked with Granite!</p> }
        { linkData === undefined && <Preloader message="" /> }
    </>;
};

export default GraniteLink;