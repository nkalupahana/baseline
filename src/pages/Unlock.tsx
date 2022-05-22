import { IonButton } from "@ionic/react"
import ldb from "../db";
import history from "../history";

const Unlock = () => {
    return <>
        <br /><br /><br /><br />
        <IonButton onClick={async () => {
            try {
                const ekeys = localStorage.getItem("ekeys");
                if (ekeys) localStorage.setItem("keys",  ekeys);
                const edata = await ldb.elogs.get(0);
                if (edata) await ldb.logs.bulkAdd(JSON.parse(edata.data));
            } catch (e) {
                console.log(e);
            } finally {
                history.replace("/summary");
            }
        }}>Unlock</IonButton>
    </>
}

export default Unlock;