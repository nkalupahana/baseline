import { useEffect } from "react";
import history from "../history";

const RSummary = () => {
    useEffect(() => {
        history.push("/summary");
    }, []);
    
    return <div className="center-journal container text-center">
        <p className="fake-link" onClick={() => history.push("/summary")}>Click here if you aren't automatically redirected.</p>
    </div>;
}

export default RSummary;