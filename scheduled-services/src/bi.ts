import { getAuth } from "firebase-admin/auth";
import { DateTime } from "luxon";
import { BigQuery } from "@google-cloud/bigquery";
import { Storage } from "@google-cloud/storage";
import { getFirestore } from "firebase-admin/firestore";
import { DateTimeMap, NumberMap } from "./helpers.js";

export const loadBasicBIData = async (db: any) => {
    const bigquery = new BigQuery();
    const storage = new Storage();

    // Create CSV row with required data
    let actions: string[] = [];
    const addAction = (userId: string, timestamp: string, action: string) => {
        const dt = DateTime.fromMillis(Number(timestamp), { zone: "utc" });
        actions.push([timestamp, userId, dt.toISODate(), dt.toLocaleString(DateTime.TIME_24_WITH_SECONDS), action].join(","));
    }

    let logLengths: string[] = [];
    const addLength = (userId: string, timestamp: string, logLength: number) => {
        const bucket = Math.floor(logLength / 600);
        logLengths.push([Number(timestamp), userId, Math.round(logLength), `${bucket}: ${bucket * 600} - ${(bucket * 600) + 599}`].join(","));
    };

    let users: string[] = [];
    let userToLastUpdated: NumberMap = {};
    const addUser = (userId: string, lastUpdated: number, country: string, region: string, offset: number, fcm: string) => {
        userToLastUpdated[userId] = lastUpdated;
        users.push([
            userId,
            lastUpdated,
            country,
            region.replace(/,/g, " "),
            offset,
            (fcm === "{}" ? "" : Buffer.from(fcm).toString("base64"))
        ].join(","));
    }

    let granite: string[] = [];
    const addGranite = (userId: string, graniteUserId: string, timestamps: string) => {
        granite.push([userId, graniteUserId, timestamps].join(","));
    }

    let gapFund: string[] = [];

    let convData: string[] = [];
    const addConversion = (timestamp: number, state: string, utm_source: string, utm_campaign: string, userId: string, lastUpdated: number | undefined, daysUsed: number | undefined) => {
        convData.push([
            timestamp,
            state,
            utm_source,
            utm_campaign,
            userId,
            lastUpdated,
            daysUsed
        ].join(","));
    };

    // Get account data
    let accounts: string[] = [];
    let usersToCreationTime: DateTimeMap = {};
    const getAllUsers = async (nextPageToken?: string) => {
        try {
            const listUsersResult = await getAuth().listUsers(1000, nextPageToken);
            listUsersResult.users.forEach(userRecord => {
                if (userRecord.providerData.length > 0) {
                    const email = userRecord.providerData[0].email ?? userRecord.email ?? "";
                    const dt = DateTime.fromRFC2822(userRecord.metadata.creationTime);
                    usersToCreationTime[userRecord.uid] = dt;
                    accounts.push(`${userRecord.uid},${email},${dt.toMillis()}`);
                }
            });

            // List next batch of users, if it exists.
            if (listUsersResult.pageToken) {
                await getAllUsers(listUsersResult.pageToken);
            }
        } catch (error) {
            console.log("Error listing users:", error);
        }
    };

    await getAllUsers();

    // Go through all users, and add data to CSVs
    for (let userId in db) {
        if (!("encryption" in db[userId]) || db[userId]["encryption"]["id"] === "anonymous") continue;
        addUser(
            userId,
            db[userId]["lastUpdated"],
            db[userId].info?.country ?? "",
            db[userId].info?.region ?? "",
            db[userId].info?.offset ?? 0,
            JSON.stringify(db[userId].info?.fcm ?? {})
        );

        const creationTime = usersToCreationTime[userId];
        const lastUpdated = userToLastUpdated[userId];
        let daysUsed = undefined;
        if (creationTime && lastUpdated) {
            daysUsed = Math.round(DateTime.fromMillis(lastUpdated).diff(creationTime, "days").days);
        }
        addConversion(creationTime?.toMillis() ?? 0, "signed_up", db[userId].info?.utm_source, db[userId].info?.utm_campaign, userId, lastUpdated, daysUsed);
        
        for (let timestamp in db[userId]["logs"] ?? {}) {
            addAction(userId, timestamp, "moodLog");

            // Calculate log length data
            const log = db[userId]["logs"][timestamp];
            if ("data" in log) {
                // Regress approximate log length from encrypted content
                let logLength = (0.748879 * log["data"].length) - 158.323;
                if (logLength < 0) logLength = 0;
                addLength(userId, timestamp, logLength);
            } else if ("journal" in log) {
                // For the rare unencrypted journals from the pre-encryption days
                addLength(userId, timestamp, log["journal"].length);
            }
        }

        for (let timestamp in db[userId]["surveys"] ?? {}) {
            addAction(userId, timestamp, "survey");
        }

        if ("gapFund" in db[userId]) {
            gapFund.push(userId);
        }

        if ("partners" in db[userId]) {
            if ("granite" in db[userId]["partners"]) {
                let [_, payload, __] = db[userId]["partners"]["granite"]["id_token"].split(".")
                payload = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
                addGranite(
                    userId,
                    payload.sub,
                    Object.keys(db[userId]["logs"] ?? {}).join(";")
                );
            }
        }
    }

    // Get Firestore conversion data
    const firestore = getFirestore();
    const convSnapshot = await firestore.collection("conversions").get();
    const conversions = convSnapshot.docs.map(doc => doc.data());
    for (const convs of conversions) {
        for (const conv of Object.values(convs)) {
            if (conv.uid) continue; // Added in user step from RTDB data
            addConversion(conv.timestamp.toMillis(), conv.state, conv.utm_source, conv.utm_campaign, conv.uid, undefined, undefined);
        }
    }

    // Send CSVs/data to storage
    let promises = [];
    promises.push(storage.bucket("baseline-bi").file("actions.csv").save(actions.join("\n")));
    promises.push(storage.bucket("baseline-bi").file("lengths.csv").save(logLengths.join("\n")));
    promises.push(storage.bucket("baseline-bi").file("gapfund.csv").save(gapFund.join("\n")));
    promises.push(storage.bucket("baseline-bi").file("users.csv").save(users.join("\n")));
    promises.push(storage.bucket("baseline-bi").file("accounts.csv").save(accounts.join("\n")));
    promises.push(storage.bucket("baseline-bi").file("conversions.csv").save(convData.join("\n")));
    promises.push(storage.bucket("baseline-bi").file("granite.csv").save(granite.join("\n")));

    await Promise.all(promises);


    promises = [];
    // Send actions CSV to BigQuery
    const actionsMetadata = {
        sourceFormat: "CSV",
        schema: {
            fields: [
                { name: "timestamp", type: "INTEGER" },
                { name: "userId", type: "STRING" },
                { name: "date", type: "DATE" },
                { name: "time", type: "TIME" },
                { name: "action", type: "STRING" }
            ],
        },
        location: "US",
        writeDisposition: "WRITE_TRUNCATE"
    };
    promises.push(bigquery.dataset("bi").table("actions").load(storage.bucket("baseline-bi").file("actions.csv"), actionsMetadata));

    // Send lengths CSV to BigQuery
    const lengthsMetadata = {
        sourceFormat: "CSV",
        schema: {
            fields: [
                { name: "timestamp", type: "INTEGER" },
                { name: "userId", type: "STRING" },
                { name: "len", type: "INTEGER" },
                { name: "bucket", type: "STRING" }
            ],
        },
        location: "US",
        writeDisposition: "WRITE_TRUNCATE"
    };
    promises.push(bigquery.dataset("bi").table("log_length").load(storage.bucket("baseline-bi").file("lengths.csv"), lengthsMetadata));

    // Send gap fund CSV to BigQuery
    const gapMetadata = {
        sourceFormat: "CSV",
        schema: {
            fields: [
                { name: "userId", type: "STRING" }
            ]
        },
        location: "US",
        writeDisposition: "WRITE_TRUNCATE"
    };
    promises.push(bigquery.dataset("bi").table("gap_fund").load(storage.bucket("baseline-bi").file("gapfund.csv"), gapMetadata));

    // Send users CSV to BigQuery
    const usersMetadata = {
        sourceFormat: "CSV",
        schema: {
            fields: [
                { name: "userId", type: "STRING" },
                { name: "lastUpdated", type: "INTEGER" },
                { name: "country", type: "STRING" },
                { name: "region", type: "STRING" },
                { name: "offset", type: "INTEGER" },
                { name: "fcm", type: "STRING" }
            ]
        },
        location: "US",
        writeDisposition: "WRITE_TRUNCATE"
    };
    promises.push(bigquery.dataset("bi").table("users").load(storage.bucket("baseline-bi").file("users.csv"), usersMetadata));

    // Send accounts CSV to BigQuery
    const accountsMetadata = {
        sourceFormat: "CSV",
        schema: {
            fields: [
                { name: "userId", type: "STRING" },
                { name: "email", type: "STRING" },
                { name: "creationTime", type: "INTEGER" }
            ]
        },
        location: "US",
        writeDisposition: "WRITE_TRUNCATE"
    };
    promises.push(bigquery.dataset("bi").table("accounts").load(storage.bucket("baseline-bi").file("accounts.csv"), accountsMetadata));

    // Send conversions CSV to BigQuery
    const convMetadata = {
        sourceFormat: "CSV",
        schema: {
            fields: [
                { name: "timestamp", type: "INTEGER" },
                { name: "state", type: "STRING" },
                { name: "utm_source", type: "STRING" },
                { name: "utm_campaign", type: "STRING" },
                { name: "userId", type: "STRING" },
                { name: "lastUpdated", type: "INTEGER" },
                { name: "daysUsed", type: "INTEGER" }
            ]
        },
        location: "US",
        writeDisposition: "WRITE_TRUNCATE"
    };
    promises.push(bigquery.dataset("bi").table("conversions").load(storage.bucket("baseline-bi").file("conversions.csv"), convMetadata));

    await Promise.all(promises);

    // Send granite CSV to BigQuery
    const graniteMetadata = {
        sourceFormat: "CSV",
        schema: {
            fields: [
                { name: "baselineUserId", type: "STRING" },
                { name: "graniteUserId", type: "STRING" },
                { name: "timestamps", type: "STRING" }
            ]
        },
        location: "US",
        writeDisposition: "WRITE_TRUNCATE"
    };
    promises.push(bigquery.dataset("bi_granite").table("granite_main").load(storage.bucket("baseline-bi").file("granite.csv"), graniteMetadata));

    await Promise.all(promises);
}
