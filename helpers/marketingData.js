const { DateTime } = require("luxon");
const faker = require("faker");
const admin = require("firebase-admin");
const { sampleSize, max } = require("lodash")

let time = DateTime.local().minus({ weeks: 30 }).startOf("day");
const now = DateTime.local().endOf("day").minus({ days: 1 });
let logs = {}
const hours = [9, 13, 16, 19];
let currentMood = 0;

/**
 * - Student going to school
 * - Really tough week with work
 * - Falling out with a friend
 * - Process what's going on through writing
 * - Get better by end of week!
 */
const writtenLogs = [
    // Day 1
    {
        journal: "Doing okay. Classes are starting today after a break, so I'm a little nervous. I'm not sure how much work they're going to try to throw at us now that we've gotten a break.",
        mood: 0,
        average: "average"
    }, {
        journal: "First class went well! Things are looking up.",
        mood: 2,
        average: "average"
    },
    {
        journal: "Oh boy. Just got out of my new CS class. This is not going to be good. The professor was really intimidating, and he already gave us a huge assignment. I'm worried I'm not going to be able to get through all of it.",
        mood: -1,
        average: "average"
    },
    {
        journal: "I'm kind of spiraling about this new CS class and the assignment. I'm not sure if I'm going to be able to get through it all. I'm going to try to talk to my professor about it, but I'm not sure if he'll want to help me.",
        mood: -2,
        average: "below"
    },
    // Day 2
    {
        journal: "Woke up and immediately had a spike of anxiety about the assignment. Going to try to get an early start on it this morning.",
        mood: -1,
        average: "below"
    },
    {
        journal: "Had a couple more classes, which went... okay. Feeling a little better - having a distraction was nice, at least.",
        mood: 0,
        average: "average"
    },
    {
        journal: "I'm feeling a little better today. Haven't been working on CS at all. So... maybe that's why. I guess I'll do it tonight? Or maybe I'll keep putting it off? I can really feel it weighing down on my mood. Anyways, gonna go get dinner with my bestie Lexie and then go work.",
        mood: 1,
        average: "average"
    },
    {
        journal: "Dinner with Lexie was okay. But I'm just going to go to sleep early. I can't do this.",
        mood: 0,
        average: "below"
    },
    // Day 3
    {
        journal: "No classes today, so I'm just gonna work on that assignment. Feeling kinda on edge.",
        mood: 0,
        average: "average"
    },
    {
        journal: "Oh god, I have no idea what I'm doing. Really spiraling. I have no idea how to do this, and I'm just getting more and more frustrated as I try to work on it.",
        mood: -2,
        average: "below"
    },
    {
        journal: "Linked lists are going to be the death of me. I'm going to go get coffee with Lexie now",
        mood: -2,
        average: "below"
    },
    {
        journal: "Coffee with Lexie felt... a little stressed. She seemed kinda mad at me. I don't know why. Everything feels terrible right now.",
        mood: -3,
        average: "below"
    },
    // Day 4
    {
        journal: "Woke up today and Lexie sent me a super long text and she seems mad. I don't know what I did. I'm just going to go to class and try to ignore it.",
        mood: -4,
        average: "below"
    },
    {
        journal: "Everything is going so terribly right now, and I have no idea why. Almost cried in class.",
        mood: -4,
        average: "below"
    },
    {
        journal: "Okay, time to write about how I feel. I'm not doing well. This assignment is really hurting me, and it's rubbing off on other parts of my life, including my friendship with Lexie. I need to take a step back, take a deep breath, and take this on more slowly. Maybe I can go to office hours? And I need to smooth things over with Lexie. I feel bad.",
        mood: -1,
        average: "below"
    },
    {
        journal: "Okay. Going to talk to Lexie. Need to apologize and figure out why she was so mad at me.",
        mood: 0,
        average: "average"
    },
    // Day 5
    {
        journal: "Talking to Lexie was so nice. She did't realize I was struggling so much, and I didn't realize that my stress was rubbing off on other parts of my life so much. That was a really good talk.",
        mood: 2,
        average: "above"
    },
    {
        journal: "Oh my god, I should've gone to office hours sooner. I was making such a simple mistake. Stress was really for nothing. Things are really looking up now",
        mood: 3,
        average: "above"
    }, 
    {
        journal: "Got food with Lexie. Things are going better.",
        mood: 2,
        average: "average"
    }, 
    {
        journal: "Man, what a week. So much stress. I'm really glad I got everything resolved. And now I think I've gotten better at managing so stress, so that's really good.",
        mood: 2,
        average: "average"
    }
]

let sentences = [];
for (let log of writtenLogs) {
    sentences.push(...log.journal.match( /[^\.!\?]+[\.!\?]+/g ).map(s => s.trim()));
}

let i = 0;
while (time < now) {
    for (let hour of hours) {
        currentMood += faker.datatype.number({ min: -2, max: 2 });
        if (currentMood < -5) currentMood = -3;
        if (currentMood > 5) currentMood = 3;
        let fullTime = time.plus({ hours: hour, minutes: faker.datatype.number({ min: 0, max: 59 }) });
        let data = {
            year: time.year,
            month: time.month,
            day: time.day,
            time: fullTime.toFormat("h:mm a"),
            zone: "America/Los_Angeles",
        };

        // Fake data before story, else story
        if (time < now.minus({ days: 5 })) {
            data = {
                ...data,
                mood: currentMood,
                journal: sampleSize(sentences, 5).join(" "),
                //journal: faker.lorem.paragraph(),
                average: faker.random.arrayElement(["average", "below", "above"])
            };
            console.log(currentMood);
        } else {
            const log = writtenLogs[i];
            data = {
                ...data,
                mood: log.mood,
                journal: log.journal,
                average: log.average
            }
            ++i;
        }

        logs[fullTime.toMillis()] = data;
    }

    time = time.plus({ days: 1 });
}

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://getbaselineapp-default-rtdb.firebaseio.com/",
});

// Marketing user UID
const uid = "AW5CwvuMioWpifdwViryDrjU5eq1"
const db = admin.database();

(async () => {
    await db.ref(`${uid}/logs`).set(logs);
    const lastUpdated = max(Object.keys(logs).map(Number));
    await db.ref(`${uid}/lastUpdated`).set(lastUpdated);
    await db.ref(`${uid}/lastWeekInReview`).set(lastUpdated);
    process.exit();
})();
