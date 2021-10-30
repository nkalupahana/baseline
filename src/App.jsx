import { Redirect, Route } from "react-router-dom";
import { IonApp } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import Summary from "./pages/Summary";
import Journal from "./pages/Journal";
import Login from "./pages/Login";
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

/* Theme variables */
import "./theme/variables.css";

import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import Dexie from "dexie";
import { useEffect, useState } from "react";
import history from "./history";
import "./lifecycle";

const App = () => {
    const [user, loading, error] = useAuthState(auth);
    const [authLikely, setAuthLikely] = useState(false);
    
    useEffect(() => {
        (async () => {
            if (await Dexie.exists("ldb")) {
                setAuthLikely(true);
            }
        })();
    }, []);

    return (
        <IonApp>
            { loading && !authLikely && <p>Loading... { error } </p> }
            { !loading && !user && <Login></Login> }
            { ((!loading && user) || (loading && authLikely)) && <IonReactRouter history={history}>
                <Switch>
                    <Route path="/journal" component={Journal} />
                    <Route path="/summary" component={Summary} />
                    <Redirect to="/journal" />
                </Switch>
            </IonReactRouter> }
        </IonApp>
    );
};

export default App;
