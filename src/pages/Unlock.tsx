import { SyntheticEvent, useEffect, useState } from "react";
import history from "../history";
import UnlockCmp from "../components/Settings/UnlockCmp";
import hash from "crypto-js/sha512";
import { checkPassphrase, toast } from "../helpers";
import { signOutAndCleanUp } from "../firebase";

const Unlock = () => {
    const [passphrase, setPassphrase] = useState("");
    useEffect(() => {
        if (!(localStorage.getItem("ekeys") && !sessionStorage.getItem("pwd"))) history.replace("/summary");
    }, []);

    const unlock = (e: SyntheticEvent) => {
        e.preventDefault();
        if (checkPassphrase(passphrase)) {
            sessionStorage.setItem("pwd", hash(passphrase).toString());
            history.replace("/summary");
        } else {
            toast("Your passphrase is incorrect, please try again.");
        }
    };

    return <>
        <div className="center-summary container grid-heading">
            <UnlockCmp unlock={unlock} getter={passphrase} setter={setPassphrase} />
            <p>Stuck? <span onClick={signOutAndCleanUp} className="fake-link">Click here to sign out.</span> Note that in order to sign back in, you will still need this passphrase.</p>
        </div>
    </>
}

export default Unlock;