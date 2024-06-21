import { useEffect } from "react";
import { BASE_URL, checkKeys } from "../../helpers";
import { getIdToken } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";

interface Props {
    filename: string;
}

const AudioViewer = ({ filename } : Props) => {
    const [user] = useAuthState(auth);

    useEffect(() => {
        if (!user) return;

        (async () => {
            const keys = JSON.stringify(checkKeys());
            const resp = await fetch(`${BASE_URL}/getAudio`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getIdToken(user)}`
                },
                body: JSON.stringify({ 
                    filename,
                    keys
                })
            });
            const blob = await resp.blob();
            console.log(blob);
            const url = URL.createObjectURL(blob);
            console.log(url);
        })();
    }, [filename, user]);

    return <p>Audio Viewer { filename }</p>;
};

export default AudioViewer;