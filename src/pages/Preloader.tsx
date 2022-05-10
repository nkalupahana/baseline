import { IonSpinner } from "@ionic/react";
import "./Container.css";

const Preloader = ({ message="One second, we're getting things ready." } : { message?: string }) => {
    return (
        <div className="container column-flex">
            <br/><br/><br/><br/>
            <IonSpinner className="loader" name="crescent" class="bigger-spinner" />
            <p style={{"paddingTop": "25px"}} className="text-center container">{ message }</p>
        </div>
    );
};

export default Preloader;
