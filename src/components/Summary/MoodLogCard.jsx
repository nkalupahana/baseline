import "./MoodLogCard.css";
import { IonIcon } from "@ionic/react";
import { useRef, useState } from "react";
import { chevronUp, imagesOutline } from "ionicons/icons";
import ImageCarousel from "./ImageCarousel";

const MoodLogCard = ({ log, setMenuDisabled }) => {
    const [grow, setGrow] = useState(false);
    const card = useRef();
    const logContainer = useRef();
    const NOGROW_HEIGHT = 58;

    function toggleGrow() {
        if (!grow) {
            if (log.files || logContainer.current.offsetHeight === NOGROW_HEIGHT) {
                setGrow(true);
            }
        } else {
            setGrow(false);
            if (card.current.parentElement.getBoundingClientRect().y > card.current.getBoundingClientRect().y) {
                card.current.parentElement.scrollTo({
                    top: card.current.offsetTop - card.current.parentElement.offsetTop - 50,
                    left: 0,
                    behavior: "smooth"
                });
            }
        }
    }

    // TODO: temp, need to be turned into official symbols
    let symbol;
    if (log.average === "average") symbol = "~";
    if (log.average === "above") symbol = "↑";
    if (log.average === "below") symbol = "↓";

    return (
        <div className="mood-card" ref={card}>
            <span className="bold" style={{"gridArea": "time", "paddingLeft": "8px"}}>{ log.time }</span>
            <span className="bold" style={{"gridArea": "labels", "paddingRight": "10px", "textAlign": "right"}}>{ symbol } { log.mood }</span>
            { log.journal && <div ref={logContainer} onClick={grow ? () => {} : toggleGrow} className="mood-card-log" style={grow ? {"height": "auto"} : {"maxHeight": `${NOGROW_HEIGHT}px`, "overflow": "hidden"}}>text</div> }
            
            { !grow && 
            <>
                { log.files && <IonIcon className="close-btn" icon={imagesOutline} onClick={toggleGrow} /> }
            </> }

            { grow && 
            <>
                { log.files && <ImageCarousel setMenuDisabled={setMenuDisabled} files={log.files}></ImageCarousel>}
                <IonIcon className="close-btn" icon={chevronUp} onClick={toggleGrow} />
            </> }
        </div>
    );
};

export default MoodLogCard;