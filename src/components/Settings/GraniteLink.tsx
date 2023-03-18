import { IonButton } from "@ionic/react";

const GraniteLink = () => {
    const graniteAccess = () => {
        const redirect_uri = `${window.location.origin}/granite/callback`;
        localStorage.setItem("redirect_uri", redirect_uri);
        window.location.href = `https://granite-labs.herokuapp.com/oauth2/authorize?client_id=76217571-ce1c-4492-bd0f-7c4d2aeb0026&redirect_uri=${redirect_uri}`;
    };

    return <IonButton onClick={graniteAccess}>Connect with GraniteAccess</IonButton>;
};

export default GraniteLink;