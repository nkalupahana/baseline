import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { goBackSafely } from "../helpers";

const Donate = () => {
    return (<div className="container">
        <IonIcon className="top-corner x" icon={closeOutline} onClick={goBackSafely}></IonIcon>
        <div className="center-journal container">
            <div className="title">
                Donate!
            </div>
            <p className="text-center margin-bottom-0">
                Thank you for considering a donation to baseline. Financial contributions
                are what allow us to run programs like the gap fund, and help this app continue to scale and reach more people.
                Donations are tax-deductible in the US, and baseline is 100% volunteer-run, so there is <b>zero</b> overhead for
                any donations.
            </p>
            <p className="text-center margin-bottom-0">
                <a href="https://donorbox.org/baseline" target="_blank" rel="noreferrer">
                    Donate now on Donorbox using a credit card number, 
                    bank information, Venmo, or PayPal.
                </a>
            </p>
            <p className="text-center">Of course, financial contributions aren't the only ones that help. If you have programming expertise, consider
                contributing to baseline itself. This project is completely 
                open source on <a href="https://github.com/nkalupahana/baseline" target="_blank" rel="noreferrer">GitHub.</a> And of course, 
                if you have any feedback, please send it our way at <a href="mailto:feedback@getbaseline.app">feedback@getbaseline.app</a>.
            </p>
        </div>
    </div>);
};

export default Donate;