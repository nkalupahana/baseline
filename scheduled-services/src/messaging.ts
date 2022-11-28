import { getMessaging } from "firebase-admin/messaging";
import { BigQuery } from "@google-cloud/bigquery";
import { DateTime, FixedOffsetZone } from "luxon";
import { sample } from "underscore";

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

interface AnyMap {
    [key: string]: any;
}

const MESSAGES: AnyMap = {
    "recent": [
        {
            title: "Don't forget to journal today.",
            body: "It only takes a few minutes to keep building this positive habit. Tap here to start writing.",
        },
        {
            title: "How was your day?",
            body: "Take a minute to pause and reflect. Tap here to start.",
        },
        {
            title: "Don't forget to reflect.",
            body: "Journaling is a great way to keep track of how you've been feeling. Tap here to start.",
        }, {
            title: "Don't forget to journal!",
            body: "Writing and reflecting is proven to help people feel better in the long run. Tap here to get started.",
        },
        {
            title: "Mental health is complex.",
            body: "Journaling is a great way to start figuring it out. Tap here to begin.",
        }
    ],
    "reacquire": [
        {
            title: "Mental health is complex.",
            body: "Journaling is a great way to start figuring it out. Tap here to begin.",
        },
        {
            title: "Start journaling again today.",
            body: "Journaling is proven to help people improve their mental health — and it only takes a few minutes. Tap here to start.",
        },
        {
            title: "How was your week?",
            body: "Reflect on your past week and start this one off on the right foot. Tap here to start writing.",
        }
    ]
};

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
    console.log(JSON.stringify(rows));
    console.log("--------2");

    let usersToNotify = []
    for (let user of rows) {
        let lastUpdated = user.lastUpdated ?? user.creationTime;
        const userZone = FixedOffsetZone.instance(user.offset);
        lastUpdated = DateTime.fromMillis(lastUpdated, { zone: userZone });
        const now = DateTime.local({ zone: userZone })

        const checkDays = [now.minus({ days: 2 }), now.minus({ days: 4 }), now.minus({ weeks: 1 })];
        for (const day of checkDays) {
            if (day.toISODate() === lastUpdated.toISODate()) {
                usersToNotify.push({ user, tag: "recent" });
            }
        }

        const barrier =  now.minus({ weeks: 1, days: 3 });
        if (lastUpdated < barrier && barrier.weekday === 7) {
            usersToNotify.push({ user, tag: "reacquire" });
        }

        if (user.userId === "bSOnX5iFg5NpBOrhXyPYgaGSKsP2") {
            usersToNotify.push({ user, tag: "recent" });
        }
    }

    let messages = [];
    console.log(JSON.stringify(usersToNotify));
    for (let messageCtx of usersToNotify) {
        for (let tokenData of Object.values(messageCtx.user.fcm)) {
            messages.push({
                notification: sample(MESSAGES[messageCtx.tag]),
                token: (tokenData as any).token,
            });
        }
    }
    
    console.log(JSON.stringify(messages));
    if (messages.length > 0) {
        const response = await getMessaging().sendAll(messages);
        console.log(JSON.stringify(response));
    }
}