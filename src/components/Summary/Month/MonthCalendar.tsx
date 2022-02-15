import { DateTime } from "luxon";
import { Log } from "../../../db";
import { createPoints, getDateFromLog } from "../../../helpers";

interface Props {
    logs: Log[];
}

function createCalendarCard(date: DateTime, data:Log[] = []) {
    const points = createPoints(data);
    const locator = "c-locator-" + date.toISODate();
    return (<div key={locator} id={locator} className="calendar-card">
                <div className="calendar-card-date">{date.toFormat("ccc")}</div>
                <div className="calendar-card-date">{date.toFormat("L/d")}</div>
                {points}
            </div>);
}

const MonthCalendar = ({ logs } : Props) => {
    let els = [];
    let i = 0;
    let current = getDateFromLog(logs[0]);

    // Create cards from today to first entry
    let now = DateTime.now().startOf("day");
    while (!now.equals(current) && now > current) {
        els.push(createCalendarCard(now));
        now = now.minus({days: 1});
    }

    while (i < logs.length) {
        let todaysLogs: Log[] = [];
        while (i < logs.length && getDateFromLog(logs[i]).equals(current)) {
            todaysLogs.push(logs[i]);
            i++;
        }

        // Create card for current day
        els.push(createCalendarCard(current, todaysLogs));
        if (i === logs.length) break;

        // Create cards back to next populated day
        let next = getDateFromLog(logs[i]);
        while (!current.equals(next)) {
            current = current.minus({ days: 1 });
            if (!current.equals(next)) els.push(createCalendarCard(current));
        }
    }

    // Create empty cards for final week
    for (let i = 0; i < 6; i++) {
        current = current.minus({ days: 1 });
        els.push(createCalendarCard(current));
    }

    return <div className="month-calendar">{els}</div>
}

export default MonthCalendar;