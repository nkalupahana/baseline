import { useEffect, useState } from "react";
import history from "../history";
import UnlockCmp from "../components/Settings/UnlockCmp";
import hash from "crypto-js/sha512";
import aesutf8 from "crypto-js/enc-utf8";
import AES from "crypto-js/aes";
import { toast } from "../helpers";
import { signOutAndCleanUp } from "../firebase";

const Unlock = () => {
    const [passphrase, setPassphrase] = useState("");
    useEffect(() => {
        if (!(localStorage.getItem("ekeys") && !sessionStorage.getItem("pwd"))) history.replace("/summary");
    }, []);

    const unlock = () => {
        const keyData = JSON.parse(localStorage.getItem("ekeys") ?? "{}");
        const h = hash(passphrase).toString();
        if (hash(AES.decrypt(keyData.keys, h).toString(aesutf8)).toString() === keyData.hash) {
            sessionStorage.setItem("pwd", h);
            history.replace("/summary");
        } else {
            toast("Your passphrase is incorrect, please try again.");
        }
    };

    return <>
        <div style={{ gridArea: "heading" }} className="center-summary container">
            <UnlockCmp unlock={unlock} getter={passphrase} setter={setPassphrase} />
            <p>Stuck? <span onClick={signOutAndCleanUp} className="fake-link">Click here to sign out.</span> Note that in order to sign back in, you will still need this passphrase.</p>
        </div>
    </>
}

export default Unlock;