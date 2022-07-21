import "./MoodLogCard.css";
import { IonIcon } from "@ionic/react";
import { useRef, useState } from "react";
import { caretDownOutline, caretForwardOutline, caretUpOutline, chevronUp, imagesOutline } from "ionicons/icons";
import ImageCarousel from "./ImageCarousel";

const MoodLogCard = ({ log, setInFullscreen, reduceMotion, LOCATOR_OFFSET }) => {
    const [grow, setGrow] = useState(false);
    const card = useRef();
    const logContainer = useRef();
    const NOGROW_HEIGHT = 58;

    function toggleGrow() {
        if (!grow) {
            if ((log.files && log.files.length > 0) || logContainer.current.offsetHeight === NOGROW_HEIGHT) {
                setGrow(true);
            }
        } else {
            setGrow(false);
        }

        if (card.current.parentElement.getBoundingClientRect().y > card.current.getBoundingClientRect().y) {
            card.current.parentElement.scrollTo({
                top: card.current.offsetTop - card.current.parentElement.offsetTop - LOCATOR_OFFSET - 25,
                left: 0,
                behavior: reduceMotion ? "auto" : "smooth"
            });
        }
    }

    const SYMBOL_MAP = {
        "below": caretDownOutline,
        "average": caretForwardOutline,
        "above": caretUpOutline
    };

    return (
        <div className="mood-card" ref={card}>
            <span className="bold" style={{"gridArea": "time", "paddingLeft": "8px"}}>{ log.time }</span>
            <span className="bold" style={{"gridArea": "labels", "paddingRight": "10px", "textAlign": "right"}}><IonIcon style={{"transform": "translateY(2px)"}} icon={SYMBOL_MAP[log.average]} /> { log.mood }</span>
            { log.journal && 
            <div 
                ref={logContainer} 
                onClick={grow ? undefined : toggleGrow} 
                className="mood-card-log" 
                style={grow ? {"height": "auto"} : {"maxHeight": `${NOGROW_HEIGHT}px`, "overflow": "hidden"}}>
                    { localStorage.getItem("fake") ? "Test data" : log.journal }
            </div> }
            
            { !grow && 
            <>
                { log.files && log.files.length > 0 && <IonIcon className="close-btn" icon={imagesOutline} onClick={toggleGrow} /> }
            </> }

            { grow && 
            <>
                { log.files && log.files.length > 0 && <ImageCarousel setInFullscreen={setInFullscreen} files={log.files}></ImageCarousel> }
                <IonIcon className="close-btn" icon={chevronUp} onClick={toggleGrow} />
            </> }
        </div>
    );
};

export default MoodLogCard;