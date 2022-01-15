import { IonSpinner, IonPage } from "@ionic/react";
import "./Container.css";

const Preloader = () => {
    return (
        <div className="container column-flex">
            <br/><br/><br/><br/>
            <IonSpinner className="loader" name="crescent" class="bigger-spinner" />
            <p>One second, we're getting things ready.</p>
        </div>
    );
};

export default Preloader;
