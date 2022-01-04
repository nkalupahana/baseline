import "./MoodLogCard.css";
import { IonIcon, IonTextarea } from "@ionic/react";
import { useRef, useState } from "react";
import { chevronUp, imagesOutline } from "ionicons/icons";
import ImageCarousel from "./ImageCarousel";

const MoodLogCard = ({ log }) => {
    const [grow, setGrow] = useState(false);
    const textarea = useRef();
    const card = useRef();

    function toggleGrow() {
        if (!grow) {
            if (log.files || textarea.current.offsetHeight !== textarea.current.children[0].children[0].scrollHeight) {
                setGrow(true);
            }
        } else {
            setGrow(false);
            if (card.current.parentElement.getBoundingClientRect().y > card.current.getBoundingClientRect().y) {
                console.log("SCROLL")
                console.log(card.current.scrollTop);
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
            { (log.journal || log.files) && 
                <>
                    { !grow && 
                    <>
                        <IonTextarea ref={textarea} style={{"gridArea": "log"}} rows={2} readonly autoGrow={false} className="tx tx-display tx-card" value={log.journal} placeholder="No mood log" onClick={toggleGrow} />
                        { log.files && <IonIcon className="close-btn" icon={imagesOutline} onClick={toggleGrow} /> }
                    </> }
                    { grow && 
                    <>
                        <IonTextarea ref={textarea} style={{"gridArea": "log"}} readonly autoGrow={true} className="tx tx-display tx-card" value={log.journal} placeholder="No mood log" /> 
                        { log.files && <ImageCarousel files={log.files}></ImageCarousel>}
                        <IonIcon className="close-btn" icon={chevronUp} onClick={toggleGrow} />
                    </> }
                </>
            }
        </div>
    );
};

export default MoodLogCard;