import { getMessaging } from "firebase-admin/messaging";
import { BigQuery } from "@google-cloud/bigquery";
import { DateTime } from "luxon";

export const sendCleanUpMessage = async () => {
    await getMessaging().send({
        topic: "all",
        apns: {
            payload: {
                aps: {
                    contentAvailable: true,
                }
            },
        },
        data: {
            cleanUp: "true"
        }
    });
}

export const logReminder = async () => {
    const bigquery = new BigQuery();
    // These should send in UTC from 6 - 8 PM (18 - 20)
    // Possible time offsets -- -11 to +14
    const time = DateTime.utc().hour;
    let filters = [];
    let hourOffset = 18 - time;
    for (let offset of [hourOffset, hourOffset + 1]) {
        if (offset > 14) offset -= 24;
        filters.push(`(offset >= ${offset * 60} AND offset < ${offset * 60 + 59})`);
        if ([13, 14].includes(offset)) {
            offset -= 24;
            filters.push(`(offset >= ${offset * 60} AND offset < ${offset * 60 + 59})`);
        }
    }

    const query = `SELECT * FROM 
                        (SELECT * FROM \`getbaselineapp.bi.users\` AS users WHERE 
                            fcm IS NOT NULL AND
                            (
                                ${filters.join(" OR \n")}
                            )
                        )
                    INNER JOIN \`getbaselineapp.bi.accounts\` USING (userId);`;

    console.log("QUERY");
    console.log(query);
    const [job] = await bigquery.createQueryJob({
        query,
        location: "US"
    });

    let [rows] = await job.getQueryResults();
    rows = rows.map(x => {
        return {
            ...x, 
            fcm: JSON.parse(Buffer.from(x.fcm, "base64").toString("ascii"))
        }
    });
    console.log(rows);
    /*for (let user of rows) {
        let lastUpdated = user.lastUpdated ?? user.creationTime;
        const userZone = FixedOffsetZone.instance(user.offset);
        lastUpdated = DateTime.fromMillis(lastUpdated, { zone: userZone });
        const now = DateTime.local({ zone: userZone })

        const checkDays = [now.minus({ days: 1 }), now.minus({ days: 3 }), now.minus({ weeks: 1 })];
    }*/
}