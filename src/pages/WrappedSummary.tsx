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

    componentDidCatch(error: any, errorInfo: any) {
        console.log("Error, likely from fetching data from Dexie (caught).");
        console.error(error);
        console.error(errorInfo);
        Sentry.captureException(error, {tags: {caught: true}, extra: errorInfo});

        setTimeout(async () => {
            Sentry.addBreadcrumb({
                category: "IndexedDB",
                message: "Attempting to flush and reload"
            });
            await Sentry.flush();
            window.location.reload();
        }, 2000);
    }

    render() {
        if (this.state.hasError) {
            return <Preloader message={"IndexedDB broken, reloading..."} />
        }

        return <Summary />
    }
}

export default WrappedSummary;