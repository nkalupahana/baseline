import { IonButton } from "@ionic/react";
import { MutableRefObject, useCallback, useRef } from "react";
import history from "../../history";

interface Props {
    audioChunks: MutableRefObject<Blob[]>;
}

const RecordJournal = ({ audioChunks } : Props) => {
    const startRecording = useRef<HTMLIonButtonElement | null>(null);
    const stopRecording = useRef<HTMLIonButtonElement | null>(null);

    const setUpRecording = useCallback(() => {
        console.log("set up recording");
        const onSuccess = (stream: MediaStream) => {
            console.log(stream);
            console.log(stream.getTracks());
            console.log(stream.getTracks()[0].getSettings());
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e: BlobEvent) => {
                console.log("data data")
                console.log(e.data);
                console.log(e.data.size);
                audioChunks.current.push(e.data);
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
    }, [audioChunks]);

    return (
        <div>
            <IonButton onClick={setUpRecording}>Obtain Stream</IonButton>
            <IonButton ref={startRecording}>Start Recording</IonButton>
            <IonButton ref={stopRecording}>Stop Recording</IonButton>
        </div>
    );
};

export default RecordJournal;