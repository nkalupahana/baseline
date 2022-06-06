import { Redirect, Route } from "react-router-dom";
import { IonApp, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Switch } from "react-router";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
import "toastify-js/src/toastify.css"

/* Theme variables */
import "./theme/variables.css";

import { auth, signOutAndCleanUp } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { checkKeys } from "./helpers";
import history from "./history";
import { Capacitor } from "@capacitor/core";
import "./lifecycle";
import smoothscroll from "smoothscroll-polyfill";

import Summary from "./pages/Summary";
import Journal from "./pages/Journal";
import Login from "./pages/Login";
import Preloader from "./pages/Preloader";
import Notifications from "./pages/Notifications";
import WeekInReview from "./pages/WeekInReview";
import GapFund from "./pages/GapFund";
import Donate from "./pages/Donate";
import Settings from "./pages/Settings";
import Unlock from "./pages/Unlock";
import RSummary from "./pages/RSummary";
import GetHelp from "./pages/GetHelp";
import WeekInReviewReview from "./components/Review/WeekInReviewReview";

setupIonicReact({
    mode: (Capacitor.getPlatform() === "android" ? "md" : "ios")
});

const App = () => {
    const [user, loading] = useAuthState(auth);
    const [loggingIn, setLoggingIn] = useState(false);
    const keys = checkKeys();
    
    useEffect(() => {
        smoothscroll.polyfill();
        if (!keys) {
            signOutAndCleanUp();
        }
    }, [keys]);

    return (
        <IonApp>
            { loading && !keys && <Preloader /> }
            { !loading && (!user || loggingIn) && <Login setLoggingIn={setLoggingIn}></Login> }
            { ((!loading && user && !loggingIn) || (loading && keys)) && <IonReactRouter history={history}>
                <Switch>
                    <Route path="/journal" component={Journal} />
                    <Route path="/unlock" component={Unlock} />
                    <Route path="/summary" component={Summary} />
                    <Route path="/notifications" component={Notifications} />
                    <Route path="/gap" component={GapFund} />
                    <Route path="/donate" component={Donate} />
                    <Route path="/review" component={WeekInReviewReview} />
                    <Route path="/settings" component={Settings} />
                    <Route path="/gethelp" component={GetHelp} />
                    <Route path="/rsummary" component={RSummary} />
                    <Redirect to="/journal" />
                </Switch>
            </IonReactRouter> }
        </IonApp>
    );
};

export default App;
