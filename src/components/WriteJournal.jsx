import { withRouter } from "react-router-dom";
import "./Journal.css";
import { IonTextarea } from "@ionic/react";

const WriteJournal = withRouter(props => {
    const next = () => {
        props.history.push("/journal/finish");
    };

    const loseFocus = () => {
        if (props.text) {
            next();
        }
    };

    return (
        <div className="center-main">
            <div className="title">What's happening?</div>
            <p className="text-center" onClick={next}>If you don't want to write right now, tap here to jump to mood logging.</p>
            <IonTextarea autofocus 	auto-grow={true} className="tx" value={props.text} placeholder="Start typing here!" onIonBlur={loseFocus} onIonChange={e => props.setText(e.detail.value)}/>
            { props.text && <div onClick={next} className="fake-button">Continue</div> }
            <br />
        </div>
    );
});

export default WriteJournal;
