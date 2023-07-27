import { IonButton, IonCheckbox, IonItem, IonLabel, IonList } from "@ionic/react";
import ldb from "../../db";
import { AnyMap, decrypt, parseSettings } from "../../helpers";
import { useRef, useState } from "react";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import "./ExportData.css";
import { DataOption, dataOptionsObjArr } from "./constants";

const ExportData = () => {
    const [dataOptionsArray, setDataOptionsArray] = useState<DataOption[]>(dataOptionsObjArr);

    const onCheck = (option: DataOption) => {
        if (dataOptionsArray.includes(option)) {
            setDataOptionsArray(dataOptionsArray.filter((opt) => opt !== option));
        }
        else {
            setDataOptionsArray([...dataOptionsArray, option]);
        }
    }

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
        let newData = [];
        for (const entry of (data ?? [])) {
            let newEntry: AnyMap = {};
            for (const option of dataOptionsArray) {
                newEntry[option.value] = option.getEntryAttribute(entry);
            }
            newData.push(newEntry);
        }
        save(JSON.stringify(newData), "journal-data.json", "application/json");
    };

    const exportDataAsCSV = async () => {
        const data = await getData();
        let csv = dataOptionsArray.map((option) => option.description).join(",") + "\n";
        for (const entry of (data ?? [])) {
            entry.journal = entry.journal?.replace(/"/g, '""');
            entry.files = entry.files ?? [];
            csv += dataOptionsArray.map((option) => option.getEntryAttribute(entry)).join(",") + "\n";
        }
        save(csv, "journal-data.csv", "text/csv");
    }

    const save = async (data: string, filename: string, filetype: string) => {
        if (Capacitor.getPlatform() === "web") {
            const el = downloadLink.current!;
            el.href = URL.createObjectURL(new Blob([data], {type: filetype}));
            el.download = filename;
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
        <IonList className="checkbox-container" lines="none">
            {dataOptionsObjArr.map((option) => (
                <IonItem key={option.value}>
                    {/* checkbox is checked by default */}
                    <IonCheckbox onIonChange={() => onCheck(option)} checked={dataOptionsArray.includes(option)} id={option.value}></IonCheckbox>
                    <IonLabel>{option.description}</IonLabel>
                </IonItem>
            ))}
        </IonList>
        <IonButton mode="ios" onClick={exportDataAsJSON} disabled={dataOptionsArray.length === 0}>
            Export Journal Data as JSON
        </IonButton>
        <br />
        <IonButton mode="ios" onClick={exportDataAsCSV} disabled={dataOptionsArray.length === 0}>
            Export Journal Data as CSV
        </IonButton>
        { /* eslint-disable-next-line */ }
        <a style={{"display": "none"}} ref={downloadLink} />
    </>;
};

export default ExportData;