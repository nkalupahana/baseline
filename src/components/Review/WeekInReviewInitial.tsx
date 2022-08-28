import { parseSettings } from "../../helpers";

const WeekInReviewInitial = ({ incrementStage } : { incrementStage: () => void }) => {
    return <div className="container">
        <div className="center-summary container" style={{display: "flex", flexDirection: "column"}}>
            <div className="title">Let's get started.</div>
            <p style={{marginBottom: "8px"}} className="text-center">
                Week in Review is a quick weekly check-in for you and your mental health. 
                Don't worry, it shouldn't take more than a few minutes.
            </p>
            <p className="text-center p-inner">
                We'll be asking you two sets of questions about your mental health. 
                Then, you'll get a chance to review your answers and get some insights 
                into your mental health over time.
            </p>
            <p className="text-center p-inner">
                Your privacy is our top priority. Your answers are private and cannot be 
                viewed by anyone other than you. We will never share the results of your 
                surveys &mdash; in fact, we don't even have the ability to, because 
                we can't see them.
            </p>
            { parseSettings()["pdp"] && <p className="text-center p-inner bold">
                Since you have a password set, try not to close this while doing Week In 
                Review &mdash; for your safety, you'll have to start over.
            </p> }
            <br />
            <div className="finish-button" onClick={incrementStage}>Start Surveys</div>
            <br /><br /><br /><br />
        </div>
    </div>
};

export default WeekInReviewInitial;