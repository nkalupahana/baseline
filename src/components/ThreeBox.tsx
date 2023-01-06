import { IonIcon } from "@ionic/react";
import "./ThreeBox.css";

interface Props {
    icon: string;
    title: string;
    description: JSX.Element | string;
}

const ThreeBox = ({ icon, title, description } : Props) => {
    return <div className="threebox">
        <IonIcon icon={icon} className="threebox-icon" />
        <b className="threebox-title">{ title }</b>
        <p className="threebox-desc">{ description }</p>
    </div>;
}

export default ThreeBox;