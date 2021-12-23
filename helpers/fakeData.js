const { DateTime } = require("luxon");
const faker = require("faker");
const fs = require("fs");

let now = DateTime.local();
let logs = {}
for (let i = 0; i < 1000; i++) {
    logs[Math.round(now.toMillis())] = {
        year: now.year,
        month: now.month,
        day: now.day,
        time: now.toLocaleString(DateTime.TIME_SIMPLE),
        zone: now.zone.offsetName(now.toMillis(), {format: "short"}),
        mood: (Math.round(Math.random() * 10) % 11) - 5,
        journal: faker.lorem.paragraph(),
        average: faker.random.arrayElement(["average", "below", "above"])
    }
    now = now.minus({hours: Math.random() * 5});
}

fs.writeFileSync("data.json", JSON.stringify(logs));