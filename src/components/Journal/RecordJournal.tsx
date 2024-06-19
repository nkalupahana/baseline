import { IonButton } from "@ionic/react";
import { useCallback, useRef } from "react";
import history from "../../history";

interface Props {
    setAudio: (audio: Blob) => void;
}

const RecordJournal = ({ setAudio } : Props) => {
    const chunks = useRef<Blob[]>([]);
    const startRecording = useRef<HTMLIonButtonElement | null>(null);
    const stopRecording = useRef<HTMLIonButtonElement | null>(null);

    const setUpRecording = useCallback(() => {
        const onSuccess = (stream: MediaStream) => {
            console.log(stream);
            console.log(stream.getTracks());
            console.log(stream.getTracks()[0].getSettings());
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e: BlobEvent) => {
                console.log("data data")
                console.log(e.data);
                console.log(e.data.size);
                chunks.current.push(e.data);
            };

            mediaRecorder.onstart = () => {
                console.log("Recording started");
            }

            mediaRecorder.onstop = () => {
                console.log("Recording stopped");
            }

            startRecording.current!.onclick = () => {
                mediaRecorder.start();
            }

            stopRecording.current!.onclick = () => {
                mediaRecorder.stop();
                stream.getTracks().forEach(track => track.stop());
                
                console.log(chunks.current)
                const blob = new Blob(chunks.current, { type: mediaRecorder.mimeType });
                console.log("--");
                console.log(blob);
                console.log(blob.size);
                console.log(blob.type);
                setAudio(blob);
                history.push("/journal/finish");
            }
        }
 
        const constraints: MediaStreamConstraints = { 
            audio: {
                channelCount: {
                    ideal: 1
                },
                sampleRate: {
                    ideal: 90_000
                },
                sampleSize: {
                    ideal: 16
                },
            },
            video: false 
        };

        navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, console.log);
    }, [setAudio]);

    return (
        <div>
            <IonButton onClick={setUpRecording}>Obtain Stream</IonButton>
            <IonButton ref={startRecording}>Start Recording</IonButton>
            <IonButton ref={stopRecording}>Stop Recording</IonButton>
        </div>
    );
};

export default RecordJournal;