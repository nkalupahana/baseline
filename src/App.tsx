import { Router, Redirect, Route } from "react-router-dom";
import { setupIonicReact } from "@ionic/react";
import { isMobile } from "react-device-detect";

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
import { AnyMap, checkKeys, makeRequest } from "./helpers";
import history from "./history";
import { Capacitor } from "@capacitor/core";
import "./lifecycle";

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
import MyData from "./pages/MyData";
import { CSSTransition } from "react-transition-group";
import LastWeekInReview from "./pages/LastWeekInReview";
import Onboarding from "./pages/Onboarding";
import * as Sentry from "@sentry/react";
import { DateTime } from "luxon";
import WrappedSummary from "./pages/WrappedSummary";

setupIonicReact({
    mode: Capacitor.getPlatform() === "android" ? "md" : "ios",
});

const App = () => {
    const [user, loading] = useAuthState(auth);
    const [loggingIn, setLoggingIn] = useState(false);
    const keys = checkKeys();
    const mobileIntervention = isMobile && !localStorage.getItem("mobileOverride") && Capacitor.getPlatform() === "web";

    const overrideWeb = () => {
        localStorage.setItem("mobileOverride", "true");
        window.location.reload();
    };

    useEffect(() => {
        if (!user) return;
        Sentry.setUser({
            id: user.uid
        });

        // Sync basic information whenever app is opened
        const platform = Capacitor.getPlatform();
        let data: AnyMap = {
            offset: DateTime.now().offset,
            platform
        };
        makeRequest("accounts/sync", user, data, undefined, true);
    }, [user]);

    useEffect(() => {
        if (!keys) {
            Sentry.addBreadcrumb({
                category: "App.tsx",
                message: "Sign Out"
            });
            signOutAndCleanUp();
        } else {
            const onboarding = localStorage.getItem("onboarding");
            if (onboarding) {
                history.replace(`/onboarding/${onboarding}`);
            }
        }
    }, [keys]);

    const routes = [
        { path: "/journal", Component: Journal },
        { path: "/unlock", Component: Unlock },
        { path: "/summary", Component: WrappedSummary },
        { path: "/notifications", Component: Notifications },
        { path: "/gap", Component: GapFund },
        { path: "/donate", Component: Donate },
        { path: "/review", Component: WeekInReview },
        { path: "/lastreview", Component: LastWeekInReview },
        { path: "/settings", Component: Settings },
        { path: "/gethelp", Component: GetHelp },
        { path: "/rsummary", Component: RSummary },
        { path: "/surveys", Component: SurveyResults },
        { path: "/onboarding", Component: Onboarding },
        { path: "/mydata", Component: MyData }
    ];

    return (
        <>
            { loading && !keys && !mobileIntervention && <>
                <div className="spacer"></div>
                <Preloader spacing={false} />
            </> }
            { !loading && !mobileIntervention && (!user || loggingIn) && <Login setLoggingIn={setLoggingIn}></Login> }
            { mobileIntervention && <div className="container center-summary">
                <div className="title">One second!</div>
                    <p className="text-center">
                        It looks like you're using a mobile browser. 
                        baseline has a mobile app for Android and iOS, and it's
                        a way better experience than this website &mdash; in fact, the web 
                        version will likely have issues running on a mobile 
                        device. <a href="https://getbaseline.app">Check out 
                        our website to install the app!</a> <div className="br"></div><div className="br"></div>
                        Or, click <span className="fake-link" onClick={overrideWeb}>here</span> to 
                        continue to the web version anyways.
                    </p>
            </div> }
            { !mobileIntervention && ((!loading && user && !loggingIn) || (loading && keys)) && (
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
