import { IonButton } from "@ionic/react";
import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import "./RecordJournal.css";
import { AnyMap, timeToString } from "../../helpers";

interface Props {
    audioChunks: MutableRefObject<Blob[]>;
    elapsedTime: number;
    setElapsedTime: (time: number) => void;
    next: () => void;
    setAudioView: (view: boolean) => void;
}

const MAX_RECORDING_LENGTH_SECS = 60 * 60;

const RecordJournal = ({ audioChunks, elapsedTime, setElapsedTime, next, setAudioView } : Props) => {
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const visualizerRef = useRef<HTMLDivElement>(null);
    const [recording, setRecording] = useState(false);
    const [timeDisplay, setTimeDisplay] = useState("00:00");

    const clear = useCallback(() => {
        audioChunks.current = [];
        setElapsedTime(0);
        setTimeDisplay("00:00");
    }, [audioChunks, setElapsedTime]);

    const setUpRecording = useCallback(() => {
        if (elapsedTime >= MAX_RECORDING_LENGTH_SECS) return;

        console.log("set up recording");
        const onSuccess = (stream: MediaStream) => {
            mediaRecorder.current = new MediaRecorder(stream);
            let startTime = Math.round(Date.now() / 1000);

            let audioContext: AudioContext | null = new AudioContext();
            const analyser = audioContext.createAnalyser();
            analyser.minDecibels = -100;
            analyser.maxDecibels = -20;
            analyser.fftSize = 32;
            analyser.smoothingTimeConstant = 0.55;
            
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            mediaRecorder.current.ondataavailable = (e: BlobEvent) => {
                audioChunks.current.push(e.data);
            };
            
            mediaRecorder.current.onstart = () => {
                setRecording(true);
                startTime = Math.round(Date.now() / 1000);
            };
                
            mediaRecorder.current.onstop = () => {
                const time = Math.round(Date.now() / 1000) - startTime;
                setElapsedTime(elapsedTime + time);
                setRecording(false);
                stream.getTracks().forEach(track => track.stop());    
                mediaRecorder.current = null;

                audioContext?.close();
                audioContext = null;
            };

            const frequencyData = new Uint8Array(analyser.frequencyBinCount);
            const visualizer = () => {
                // Update time display
                const time = (Math.round(Date.now() / 1000) - startTime) + elapsedTime;
                setTimeDisplay(timeToString(time));

                // Stop recording if time is up, or recorder was stopped
                if (time >= MAX_RECORDING_LENGTH_SECS) {
                    mediaRecorder.current?.stop();
                    return;
                }
                if (!mediaRecorder.current) return;

                // Update visualizer
                try {
                    analyser.getByteFrequencyData(frequencyData);
                    const bars = visualizerRef.current!.children;
                    const dataMap: AnyMap = { 0: 9, 1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 6, 15: 7, 16: 9 };
                    for (let i = 0; i < bars.length; i++) {
                        const value = frequencyData[dataMap[i]] / 255;
                        const elmStyles = (bars[i] as HTMLDivElement).style;
                        elmStyles.transform = `scaleY(${Math.max(0.05, value)})`;
                        elmStyles.opacity = Math.min(Math.max(0.25, value * 2), 1).toFixed(4);
                    }
                } catch {}

                // Request next frame
                requestAnimationFrame(visualizer);
            };

            mediaRecorder.current.start();

            requestAnimationFrame(visualizer);
        }

        const constraints: MediaStreamConstraints = {
            audio: {
                channelCount: {
                    ideal: 1
                },
                sampleRate: {
                    ideal: 96_000
                },
                sampleSize: {
                    ideal: 16
                },
            },
            video: false
        };

        navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, console.log);
    }, [audioChunks, elapsedTime, setElapsedTime]);

    // Exit on unmount
    useEffect(() => {
        return () => {
            mediaRecorder.current?.stop();
        };
    }, []);

    useEffect(() => {
        setTimeDisplay(timeToString(elapsedTime));
    }, [elapsedTime]);
    
    return (
        <div>
            <p>{ timeDisplay } / 1:00</p>
            <div className="rj-visualizer" ref={visualizerRef}>
                { /* 17 bars */ }
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <IonButton onClick={!recording ? setUpRecording : () => {mediaRecorder.current?.stop();}}>{ recording ? "Stop Recording" : "Obtain Stream" }</IonButton>
            { audioChunks.current.length === 0 && !recording && <>
                <IonButton onClick={() => setAudioView(false)}>Switch to Text Journaling</IonButton>
            </> }
            { audioChunks.current.length > 0 && !recording && <>
                <IonButton onClick={clear}>Clear Recording</IonButton>
                <div onClick={next} className="fake-button">Continue</div>
            </> }
        </div>
    );
};

export default RecordJournal;