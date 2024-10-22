import React from "react";
import Summary from "./Summary";
import Preloader from "./Preloader";
import * as Sentry from "@sentry/react";

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
        let info = "";
        try {
            info += `name: ${error.name}, message: ${error.message}`;
        } catch {
            info += `Could not get error data. ${error}`;
        }

        alert(`IndexedDB error, refreshing. ${info}`);

        Sentry.addBreadcrumb({
            category: "IndexedDB",
            message: "Error, refreshing!"
        });
        window.location.reload();
    }

    render() {
        if (this.state.hasError) {
            return <Preloader message={"IndexedDB broken, reloading..."} />
        }

        return <Summary />
    }
}

export default WrappedSummary;