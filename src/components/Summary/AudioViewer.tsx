import { useEffect, useState } from "react";
import { BASE_URL, checkKeys } from "../../helpers";
import { getIdToken } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";

interface Props {
    filename: string;
}

const AudioViewer = ({ filename } : Props) => {
    const [user] = useAuthState(auth);
    const [audio, setAudio] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!user) return;
        let url: string | undefined = undefined;
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
            url = URL.createObjectURL(blob);
            setAudio(url); 
        })();

        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [filename, user]);

    return <>
        { audio && <audio controls src={audio} /> }
    </>;
};

export default AudioViewer;