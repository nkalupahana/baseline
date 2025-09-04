import "./MoodLogCard.css";
import { IonIcon } from "@ionic/react";
import { useRef, useState } from "react";
import {
    caretDownOutline,
    caretForwardOutline,
    caretUpOutline,
    chevronUp,
    imagesOutline,
    musicalNotes,
    pencil,
    volumeHigh,
    cloudOfflineOutline,
} from "ionicons/icons";
import ImageCarousel from "./ImageCarousel";
import { Log } from "../../db";
import { AnyMap } from "../../helpers";
import { ONE_MINUTE } from "../graphs/helpers";
import history from "../../history";
import { Spotify } from "react-spotify-embed";
import AudioViewer from "./AudioViewer";

interface Props {
    log: Log;
    setInFullscreen: (inFullscreen: boolean) => void;
    reduceMotion: boolean;
    LOCATOR_OFFSET: number;
    colors: AnyMap;
    now: number;
}

const MoodLogCard = ({
    log,
    setInFullscreen,
    reduceMotion,
    LOCATOR_OFFSET,
    colors,
    now,
}: Props) => {
    const [grow, setGrow] = useState(false);
    const card = useRef<HTMLDivElement>(null);
    const logContainer = useRef<HTMLDivElement>(null);
    const NOGROW_HEIGHT = 58;

    function toggleGrow() {
        if (!grow) {
            if (
                (log.files && log.files.length > 0) ||
                log.song ||
                log.audio ||
                log.audioArrayBuffer ||
                logContainer.current?.offsetHeight === NOGROW_HEIGHT
            ) {
                setGrow(true);
            }
        } else {
            setGrow(false);
        }

        if (
            card.current?.parentElement &&
            card.current.parentElement.getBoundingClientRect().y >
                card.current.getBoundingClientRect().y
        ) {
            card.current.parentElement.scrollTo({
                top:
                    card.current.offsetTop -
                    card.current.parentElement.offsetTop -
                    LOCATOR_OFFSET -
                    25,
                left: 0,
                behavior: reduceMotion ? "auto" : "smooth",
            });
        }
    }

    function goToEdit() {
        localStorage.setItem("autosave", log.journal ?? "");
        localStorage.setItem("editMood", String(log.mood));
        localStorage.setItem("editAverage", log.average);
        localStorage.setItem("editTimestamp", String(log.timestamp));
        history.push(`/journal`);
    }

    const SYMBOL_MAP: AnyMap = {
        below: caretDownOutline,
        average: caretForwardOutline,
        above: caretUpOutline,
    };

    const displayedTime = log.addFlag === "summary" ? "Summary" : log.time;

    return (
        <div className="mood-card" ref={card}>
            <span
                className="bold"
                style={{
                    gridArea: "time",
                    paddingLeft: "8px",
                    display: "flex",
                    alignItems: "flex-end",
                }}
            >
                {displayedTime}
                {log.unsynced && (
                    <IonIcon className="close-btn" icon={cloudOfflineOutline} id="cloudOffline" />
                )}
            </span>
            <span
                className="bold"
                style={{
                    gridArea: "labels",
                    paddingRight: "10px",
                    textAlign: "right",
                }}
            >
                <div
                    className="display-point"
                    style={{ backgroundColor: colors[log.mood] }}
                ></div>
                <IonIcon
                    style={{ transform: "translateY(2px)" }}
                    icon={SYMBOL_MAP[log.average]}
                />{" "}
                {log.mood}
            </span>
            {log.journal && (
                <div
                    ref={logContainer}
                    onClick={grow ? undefined : toggleGrow}
                    className="mood-card-log"
                    style={
                        grow
                            ? { height: "auto" }
                            : {
                                  maxHeight: `${NOGROW_HEIGHT}px`,
                                  overflow: "hidden",
                              }
                    }
                >
                    {localStorage.getItem("fake") ? "Test data" : log.journal}
                </div>
            )}
            <div style={{ gridArea: "bottom" }}>
                {!grow && (
                    <>
                        {log.files && log.files.length > 0 && (
                            <IonIcon
                                className="close-btn"
                                icon={imagesOutline}
                                onClick={toggleGrow}
                            />
                        )}
                        {log.song && (
                            <IonIcon
                                className="close-btn mood-edit-btn"
                                icon={musicalNotes}
                                onClick={toggleGrow}
                            />
                        )}
                        {(log.audio || log.audioArrayBuffer) && (
                            <IonIcon
                                className="close-btn mood-edit-btn audio-btn"
                                icon={volumeHigh}
                                onClick={toggleGrow}
                            />
                        )}
                    </>
                )}

                {grow && (
                    <>
                        {((log.files && log.files.length > 0) ||
                            log.audio || log.audioArrayBuffer ||
                            log.song) &&
                            !window.navigator.onLine && (
                                <p className="pad-left">
                                    <i>
                                        Internet connection required to load
                                        media.
                                    </i>
                                </p>
                            )}
                        {window.navigator.onLine && (
                            <>
                                {log.song && (
                                    <div className="spotify-embed-box">
                                        <Spotify
                                            className="spotify-embed"
                                            wide={true}
                                            link={
                                                "https://open.spotify.com/track/" +
                                                log.song.split(":")[2]
                                            }
                                        />
                                    </div>
                                )}
                                {log.audio && log.audio !== "inprogress" && (
                                    <AudioViewer filename={log.audio} />
                                )}
                                {log.files && log.files.length > 0 && (
                                    <ImageCarousel
                                        setInFullscreen={setInFullscreen}
                                        files={log.files}
                                    ></ImageCarousel>
                                )}
                            </>
                        )}
                        <IonIcon
                            className="close-btn"
                            icon={chevronUp}
                            onClick={toggleGrow}
                        />
                    </>
                )}
                {now - (log.timeLogged ?? log.timestamp) < ONE_MINUTE * 15 &&
                    log.audio !== "inprogress" && !log.audioArrayBuffer && (
                        <IonIcon
                            className="close-btn mood-edit-btn"
                            icon={pencil}
                            onClick={goToEdit}
                        />
                    )}
            </div>
        </div>
    );
};

export default MoodLogCard;
