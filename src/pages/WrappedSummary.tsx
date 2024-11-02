import React from "react";
import Summary from "./Summary";
import Preloader from "./Preloader";
import * as Sentry from "@sentry/react";
import { ONE_MINUTE } from "../components/graphs/helpers";

interface Props {}

interface State {
    hasError: boolean;
}

class WrappedSummary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error) {
        console.log("Error, likely from fetching data from Dexie (caught). WRAPPED");
        let info = "Caught error in Wrapped Summary! ";
        try {
            info += `name: ${error.name}, message: ${error.message}`;
        } catch {
            info += `Could not get error data. ${error}`;
        }

        Sentry.captureException(new Error(info));
        const lastRefresh = localStorage.getItem("lastRefresh");
        if (!lastRefresh || Date.now() - parseInt(lastRefresh) > ONE_MINUTE) {
            localStorage.setItem("lastRefresh", Date.now().toString());
            window.location.reload();
        } else {
            Sentry.captureException(new Error("Critical error in WrappedSummary, reloading did not fix the issue."));
            Sentry.captureException(error);
            alert("baseline has run into a critical error. Please force quit and reopen the app. If the issue persists, contact us at hello@getbaseline.app.");
        }
    }

    render() {
        if (this.state.hasError) {
            return <Preloader message={"IndexedDB broken, reloading..."} />
        }

        return <Summary />
    }
}

export default WrappedSummary;