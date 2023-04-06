import Preloader from "../../pages/Preloader";
import history from "../../history";

const GraniteCallback = () => {
    const resetFlow = () => {
        history.replace("/settings");
    };

    return <>
        <div className="container text-center">
            <Preloader message="One minute, we're linking your account." />
            <br />
            <p>Been stuck here for over a minute?<br /><span className="fake-link" onClick={resetFlow}>Click here to try again.</span></p>
        </div>
    </>;
};

export default GraniteCallback;