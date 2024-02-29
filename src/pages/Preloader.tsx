import { IonSpinner } from "@ionic/react";
import "./Container.css";

const Preloader = ({ message="One second, we're getting things ready.", spacing=true } : { message?: string, spacing?: boolean }) => {
    return (
        <div className="container column-flex">
            { spacing && <><div className="br"></div><div className="br"></div><div className="br"></div><div className="br"></div></> }
            <IonSpinner className="loader" name="crescent" class="bigger-spinner" />
            <p style={{"paddingTop": "25px"}} className="text-center container">{ message }</p>
        </div>
    );
};

export default Preloader;
