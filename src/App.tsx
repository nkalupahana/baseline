import { Router, Redirect, Route } from "react-router-dom";
import { setupIonicReact } from "@ionic/react";

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
import "toastify-js/src/toastify.css";

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
import GapFund from "./pages/GapFund";
import Donate from "./pages/Donate";
import Settings from "./pages/Settings";
import Unlock from "./pages/Unlock";
import RSummary from "./pages/RSummary";
import GetHelp from "./pages/GetHelp";
import WeekInReview from "./pages/WeekInReview";
import SurveyResults from "./pages/SurveyResults";
import { CSSTransition } from "react-transition-group";

setupIonicReact({
    mode: Capacitor.getPlatform() === "android" ? "md" : "ios",
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

    const routes = [
        { path: "/journal", Component: Journal },
        { path: "/unlock", Component: Unlock },
        { path: "/summary", Component: Summary },
        { path: "/notifications", Component: Notifications },
        { path: "/gap", Component: GapFund },
        { path: "/donate", Component: Donate },
        { path: "/review", Component: WeekInReview },
        { path: "/settings", Component: Settings },
        { path: "/gethelp", Component: GetHelp },
        { path: "/rsummary", Component: RSummary },
        { path: "/surveys", Component: SurveyResults },
    ];

    return (
        <>
            { loading && !keys && <Preloader /> }
            { !loading && (!user || loggingIn) && <Login setLoggingIn={setLoggingIn}></Login> }
            { ((!loading && user && !loggingIn) || (loading && keys)) && (
                <Router history={history}>
                    {routes.map(({ path, Component }) => {
                        return (
                            <Route key={path} path={path}>
                                {({ match }) => (
                                    <CSSTransition in={match != null} timeout={300} classNames="page" unmountOnExit>
                                        <div className="page">
                                            <Component />
                                        </div>
                                    </CSSTransition>
                                )}
                            </Route>
                        );
                    })}
                    <Route exact path="/">
                        <Redirect to="/journal" />
                    </Route>
                </Router>
            ) }
        </>
    );
};

export default App;
