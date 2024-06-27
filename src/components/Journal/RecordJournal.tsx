import { IonIcon } from "@ionic/react";
import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./RecordJournal.css";
import { AnyMap, timeToString, toast } from "../../helpers";
import { closeCircleOutline, pencil } from "ionicons/icons";
import * as Sentry from "@sentry/react";

interface Props {
    audioChunks: MutableRefObject<Blob[]>;
    elapsedTime: number;
    setElapsedTime: (time: number) => void;
    next: () => void;
    setAudioView: (view: boolean) => void;
}

const MAX_RECORDING_LENGTH_SECS = 60 * 15;

const RecordJournal = ({ audioChunks, elapsedTime, setElapsedTime, next, setAudioView } : Props) => {
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const visualizerRef = useRef<HTMLDivElement>(null);
    const [recording, setRecording] = useState(false);
    const [timeDisplay, setTimeDisplay] = useState("00:00");
    const [restart, setRestart] = useState(false);

    const clear = useCallback(() => {
        audioChunks.current = [];
        setElapsedTime(0);
        setTimeDisplay("00:00");
        setRestart(false);
    }, [audioChunks, setElapsedTime]);

    const setUpRecording = useCallback(() => {
        if (elapsedTime >= MAX_RECORDING_LENGTH_SECS) return;

        const onSuccess = (stream: MediaStream) => {
            if (mediaRecorder.current) {
                // If there's a currently running recording,
                // cancel this one
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            mediaRecorder.current = new MediaRecorder(stream);
            let startTime = Math.round(Date.now() / 1000);
            let tryRestart = false;

            let audioContext: AudioContext | null = new AudioContext();
            const analyser = audioContext.createAnalyser();
            analyser.minDecibels = -100;
            analyser.maxDecibels = -20;
            analyser.fftSize = 32;
            analyser.smoothingTimeConstant = 0.55;
            
            let source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            // If the audio context is suspended, resume it
            // (Happens due to some input device changes)
            audioContext.onstatechange = e => {
                if (stream.active && audioContext?.state === "suspended") {
                    audioContext?.resume();
                }
            }
            
            // If stream dies, stop recording and request instant restart
            stream.getTracks()[0].onended = () => {
                toast("Microphone access was lost. Attempting to restart recording...", "bottom");
                tryRestart = true;
                mediaRecorder.current?.stop();
            }

            mediaRecorder.current.ondataavailable = (e: BlobEvent) => {
                audioChunks.current.push(e.data);
            };
            
            mediaRecorder.current.onstart = () => {
                setRecording(true);
                startTime = Math.round(Date.now() / 1000);
            };

            mediaRecorder.current.onerror = (e: any) => {
                toast(`An error occurred while recording. Please try again. (${e.error.code}, ${e.error.message})`);
                Sentry.captureException(e.error);
            };
                
            mediaRecorder.current.onstop = () => {
                const time = Math.round(Date.now() / 1000) - startTime;
                setElapsedTime(elapsedTime + time);
                setRecording(false);
                if (tryRestart) {
                    // Request instant restart
                    setRestart(true);
                }

                stream.getTracks().forEach(track => track.stop());    
                mediaRecorder.current = null;

                audioContext?.close();
                audioContext = null;

                // Reset visualizer bars
                const bars = visualizerRef.current!.children;
                for (let i = 0; i < bars.length; i++) {
                    const elmStyles = (bars[i] as HTMLDivElement).style;
                    elmStyles.transform = "";
                    elmStyles.opacity = "";
                }
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

        navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, (err) => {
            toast(`Couldn't access microphone to record. (${err.name}, ${err.message})`, "bottom");
            Sentry.captureException(err);
        });
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

    // If instant restart requested,
    // attempt restart
    useEffect(() => {
        if (restart) {
            setRestart(false);
            setUpRecording();
        }
    }, [restart, setUpRecording]);

    const recordButtonClass = useMemo(() => {
        return "fake-button rj-record rj-color-animate" 
            + (recording ? " rj-red" : "") 
            + (elapsedTime >= MAX_RECORDING_LENGTH_SECS ? " rj-disabled" : "");
    }, [recording, elapsedTime]);

    const stopRecording = () => {
        mediaRecorder.current?.stop();
    };
    
    return (
        <div>
            <p className="rj-timedisplay">{ timeDisplay } / 15:00&nbsp;
                { !recording && elapsedTime > 0 && <IonIcon className="rj-close" icon={closeCircleOutline} onClick={clear} /> }
            </p>
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
            <div className="rj-buttons">
                <div className={recordButtonClass} onClick={!recording ? setUpRecording : stopRecording}>{ recording ? "Stop Recording" : "Record" }</div>
                { elapsedTime === 0 && !recording && <p onClick={() => setAudioView(false)} className="input-sizer sizing-only rj-switch text-center">
                    <IonIcon icon={pencil} className="rj-switch-icon" />
                    <span style={{"paddingLeft": "5px"}}>Switch to Written Journal</span>
                </p> }
                { elapsedTime > 0 && !recording && <>
                    <div onClick={next} className="fake-button">Continue</div>
                </> }
            </div>
        </div>
    );
};

export default RecordJournal;