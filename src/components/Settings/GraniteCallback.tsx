import Preloader from "../../pages/Preloader";
import history from "../../history";

const GraniteCallback = () => {
    const resetFlow = () => {
        history.replace("/settings");
    };

    return <>
        <div className="container text-center">
            <Preloader message="One minute, we're linking your account." />
            <div className="br"></div>
            <p>Been stuck here for over a minute?<div className="br"></div><span className="fake-link" onClick={resetFlow}>Click here to try again.</span></p>
        </div>
    </>;
};

export default GraniteCallback;