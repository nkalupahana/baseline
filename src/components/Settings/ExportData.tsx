import { IonButton } from "@ionic/react";
import ldb from "../../db";
import { decrypt, parseSettings } from "../../helpers";
import { useRef } from "react";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

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
        save(JSON.stringify(data), "journal-data.json", "application/json");
    };

    const exportDataAsCSV = async () => {
        const data = await getData();
        let csv = "timestamp,journal,mood,average,zone,files\n";
        for (const entry of (data ?? [])) {
            entry.journal = entry.journal?.replace(/"/g, '""');
            entry.files = entry.files ?? [];
            csv += `${entry.timestamp},"${entry.journal}",${entry.mood},${entry.average},${entry.zone},"${entry.files.join(",")}"\n`;
        }
        save(csv, "journal-data.csv", "text/csv");
    }

    const save = async (data: string, filename: string, filetype: string) => {
        if (Capacitor.getPlatform() === "web") {
            const el = downloadLink.current!;
            el.href = URL.createObjectURL(new Blob([data], {type: filetype}));
            el.download = "journal-data.json";
            el.click();
        } else {
            const { uri } = await Filesystem.writeFile({
                "path": filename,
                "data": data,
                "directory": Directory.Cache,
                "encoding": Encoding.UTF8
            });

            Share.share({
                "title": "Journal Data",
                "files": [uri]
            });
        }
    }

    return <>
        <IonButton onClick={exportDataAsJSON}>Export Journal Data as JSON</IonButton>
        <br />
        <IonButton onClick={exportDataAsCSV}>Export Journal Data as CSV</IonButton>
        { /* eslint-disable-next-line */ }
        <a style={{"display": "none"}} ref={downloadLink} />
    </>;
};

export default ExportData;