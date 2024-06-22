import { IonButton } from "@ionic/react";
import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import "./RecordJournal.css";
import { AnyMap } from "../../helpers";

interface Props {
    audioChunks: MutableRefObject<Blob[]>;
}

const RecordJournal = ({ audioChunks } : Props) => {
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const timeRef = useRef<HTMLParagraphElement>(null);
    const visualizerRef = useRef<HTMLDivElement>(null);
    const [recording, setRecording] = useState(false);

    const setUpRecording = useCallback(() => {
        console.log("set up recording");
        const onSuccess = (stream: MediaStream) => {
            mediaRecorder.current = new MediaRecorder(stream);

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
            };
                
            mediaRecorder.current.onstop = () => {
                setRecording(false);
                stream.getTracks().forEach(track => track.stop());    
                mediaRecorder.current = null;

                audioContext?.close();
                audioContext = null;
            };

            const frequencyData = new Uint8Array(analyser.frequencyBinCount);
            const visualizer = () => {
                if (!mediaRecorder.current) return;
                try {
                    timeRef.current!.textContent = (parseInt(timeRef.current!.textContent!) + 1).toString();

                    analyser.getByteFrequencyData(frequencyData);
                    const bars = visualizerRef.current!.children;
                    const dataMap: AnyMap = { 0: 9, 1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 6, 15: 7, 16: 9 };
                    for (let i = 0; i < bars.length; i++) {
                        const value = frequencyData[dataMap[i]] / 255;
                        const elmStyles = (bars[i] as HTMLDivElement).style;
                        elmStyles.transform = `scaleY(${Math.max(0.05, value)})`;
                        elmStyles.opacity = Math.max(0.25, value * 2).toFixed(4);
                    }
                } catch {}
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
    }, [audioChunks]);

    useEffect(() => {
        return () => {
            mediaRecorder.current?.stop();
        };
    }, []);
    
    return (
        <div>
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
            <p ref={timeRef}>0</p>
            <IonButton onClick={!recording ? setUpRecording : () => {mediaRecorder.current?.stop();}}>{ recording ? "Stop Recording" : "Obtain Stream" }</IonButton>
        </div>
    );
};

export default RecordJournal;