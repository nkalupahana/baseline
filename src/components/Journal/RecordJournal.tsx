import { IonButton } from "@ionic/react";
import { useCallback, useRef } from "react";
import history from "../../history";

interface Props {
    setAudio: (audio: Blob) => void;
}

const RecordJournal = ({ setAudio } : Props) => {
    const chunks = useRef<Blob[]>([]);
    const stopRecording = useRef<HTMLIonButtonElement | null>(null);
    const setUpRecording = useCallback(() => {
        const onSuccess = (stream: MediaStream) => {
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e: BlobEvent) => {
                console.log("data data")
                chunks.current.push(e.data);
            };

            stopRecording.current!.onclick = () => {
                mediaRecorder.stop();
                stream.getTracks().forEach(track => track.stop());
                
                console.log(chunks.current)
                const blob = new Blob(chunks.current, { type: mediaRecorder.mimeType });
                setAudio(blob);
                history.push("/journal/finish");
            }

            mediaRecorder.start();
        }

        navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(onSuccess, console.log);
    }, []);

    return (
        <div>
            <IonButton onClick={setUpRecording}>Record Journal</IonButton>
            <IonButton ref={stopRecording}>Stop Recording</IonButton>
        </div>
    );
};

export default RecordJournal;