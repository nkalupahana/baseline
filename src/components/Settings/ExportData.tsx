import { IonButton } from "@ionic/react";
import ldb from "../../db";
import { decrypt, parseSettings } from "../../helpers";
import { useRef } from "react";

const ExportData = () => {
    const downloadLink = useRef<HTMLAnchorElement>(null);

    const getData = async () => {
        const entries = await ldb.logs.orderBy("timestamp").toArray();
        if (parseSettings()["pdp"]) {
            const pwd = sessionStorage.getItem("pwd");
            if (!pwd) return;

            for (const entry of entries) {
                entry.journal = decrypt(entry.ejournal!, pwd);
                if (entry.efiles) {
                    entry.files = JSON.parse(decrypt(entry.efiles!, pwd));
                }
            }
        }

        return entries;
    };

    const exportDataAsJSON = async () => {
        const data = await getData();
        const blob = new Blob([JSON.stringify(data)], {type: "application/json"});
        const el = downloadLink.current!;
        el.href = URL.createObjectURL(blob);
        el.download = "journal-data.json";
        el.click();
    };

    const exportDataAsCSV = async () => {
        const data = await getData();
        let csv = "timestamp,journal,mood,average,zone,files\n";
        for (const entry of (data ?? [])) {
            entry.journal = entry.journal?.replace(/"/g, '""');
            entry.files = entry.files ?? [];
            csv += `${entry.timestamp},"${entry.journal}",${entry.mood},${entry.average},${entry.zone},"${entry.files.join(",")}"\n`;
        }
        const blob = new Blob([csv], {type: "text/csv"});
        const el = downloadLink.current!;
        el.href = URL.createObjectURL(blob);
        el.download = "journal-data.csv";
        el.click();
    }

    return <>
        <IonButton onClick={exportDataAsJSON}>Export Journal Data as JSON</IonButton>
        <IonButton onClick={exportDataAsCSV}>Export Journal Data as CSV</IonButton>
        { /* eslint-disable-next-line */ }
        <a style={{"display": "none"}} ref={downloadLink} />
    </>;
};

export default ExportData;