import { IonIcon } from "@ionic/react";
import "./MarketingBox.css";

interface Props {
    icon: string;
    title: string;
    description: JSX.Element | string;
}

const MarketingBox = ({ icon, title, description } : Props) => {
    return <div className="marketing-box">
        <IonIcon icon={icon} className="marketing-icon" />
        <b className="marketing-title">{ title }</b>
        <p className="marketing-desc">{ description }</p>
    </div>;
}

export default MarketingBox;