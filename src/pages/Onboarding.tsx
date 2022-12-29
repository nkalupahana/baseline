import { useAuthState } from "react-firebase-hooks/auth";
import { Route } from "react-router-dom";
import OnboardingHowToJournal from "../components/Onboarding/OnboardingHowToJournal";
import OnboardingMode from "../components/Onboarding/OnboardingMode";
import OnboardingNotifications from "../components/Onboarding/OnboardingNotifications";
import { auth } from "../firebase";

const Onboarding = () => {
    const [user] = useAuthState(auth);

    return <div className="container inner-scroll max-width-600">
        <div className="column-flex text-center center-summary">
            <Route exact path="/onboarding/start">  
                <OnboardingMode user={user} />
            </Route>
            <Route exact path="/onboarding/notifications">
                <OnboardingNotifications user={user} />
            </Route>
            <Route exact path="/onboarding/howto">  
                <OnboardingHowToJournal user={user} />
            </Route>
        </div>
    </div>;
}

export default Onboarding;