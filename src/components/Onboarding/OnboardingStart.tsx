import history from "../../history";

const OnboardingStart = () => {
    const next = () => {
        localStorage.setItem("onboarding", "mode");
        history.replace("/onboarding/mode");
    };

    return <>
        <div className="spacer"></div>
        <div className="title">Welcome to baseline.</div>
        <p className="margin-bottom-24">
            <span className="line">Let's get started with some 
            onboarding.</span> <span className="line">Don't worry, it'll only take a few minutes.</span></p>
        <div className="finish-button" onClick={next} style={{"maxWidth": "150px"}}>Get Started</div>
        <p style={{"marginTop": "auto"}}>step 1 of 5</p>
    </>;
};

export default OnboardingStart;