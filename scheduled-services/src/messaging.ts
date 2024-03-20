import { getMessaging } from "firebase-admin/messaging";
import { BigQuery } from "@google-cloud/bigquery";
import { DateTime, FixedOffsetZone } from "luxon";
import { sample } from "underscore";
import { makeInternalRequest } from "./index.js";
import { Request, Response } from "express";
import { getDatabase } from "firebase-admin/database";
import _ from "lodash";

interface AnyMap {
    [key: string]: any;
}

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

export const removeUserNotifications = async (req: Request, res: Response) => {
    console.log(req.body);
    res.sendStatus(200);
};

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

export const logReminder = async (req: Request, res: Response) => {
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

    let usersToNotify = [];
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

        const barrier = now.minus({ weeks: 1, days: 3 });
        if (lastUpdated < barrier && barrier.weekday === 7) {
            usersToNotify.push({ user, tag: "reacquire" });
        }

        if (user.userId === "bSOnX5iFg5NpBOrhXyPYgaGSKsP2") {
            usersToNotify.push({ user, tag: "recent" });
        }
    }

    let messages = [];
    let userMessageAssociation = [];
    for (let messageCtx of usersToNotify) {
        for (let deviceId in messageCtx.user.fcm) {
            messages.push({
                notification: sample(MESSAGES[messageCtx.tag]),
                token: messageCtx.user.fcm[deviceId].token,
                android: {
                    collapseKey: "standarduserretention"
                },
                apns: {
                    headers: {
                        "apns-collapse-id": "standarduserretention"
                    }
                }
            });

            userMessageAssociation.push({
                userId: messageCtx.user.userId,
                deviceId
            });
        }
    }
    
    if (messages.length > 0) {
        const chunkedMessages = _.chunk(messages, 500);
        const chunkedAssociations = _.chunk(userMessageAssociation, 500);
        for (let i = 0; i < chunkedMessages.length; ++i) {
            const messagingResult = await getMessaging().sendAll(chunkedMessages[i]);
            console.log(JSON.stringify(messagingResult));
            makeInternalRequest(req, "messaging/cleanUpTokens", {
                userMessageAssociation: chunkedAssociations[i],
                messagingResult: messagingResult.responses
            });
        }
    }

    res.send(200);
};

export const cleanUpTokens = async (req: Request, res: Response) => {
    const { userMessageAssociation, messagingResult } = req.body;
    if (userMessageAssociation.length !== messagingResult.length) {
        throw new Error("user message association and messaging result lengths don't match");
    }

    const db = getDatabase();
    let promises: Promise<void>[] = [];
    for (let i = 0; i < messagingResult.length; i++) {
        if (!messagingResult[i].success) {  
            if (messagingResult[i].error.code === "messaging/registration-token-not-registered") {
                promises.push(db.ref(`${userMessageAssociation[i].userId}/info/fcm/${userMessageAssociation[i].deviceId}`).remove());
            } else {
                console.warn("Unknown error code", messagingResult[i].error.code);
            }
        }
    }

    await Promise.all(promises);
    res.send(200);
};