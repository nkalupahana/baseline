import { DateTime } from "luxon";
import { Log } from "../../../db";
import { createPoints, getDateFromLog } from "../../../helpers";
import { chunk } from "lodash";

interface Props {
    logs: Log[];
}

function createCalendarCard(date: DateTime, data:Log[] = []) {
    const points = createPoints(data);
    const locator = "c-locator-" + date.toISODate();
    let dayHighlight = "";
    const today = DateTime.local();
    if (date.day === today.day && date.month === today.month && date.year === today.year) {
        dayHighlight += " highlight-day";
    }
    if (date.day === 1) {
        dayHighlight += " bold";
    }

    let monthHighlight = " " + (Math.abs(today.month - date.month) % 2 === 0 ? "one-month" : "two-month");

    return (<div key={locator} id={locator} className={"calendar-card" + monthHighlight}>
                <div className={"calendar-card-date" + dayHighlight}>{date.day === 1 ? date.toFormat("LLL d yy") : date.toFormat("d")}</div>
                {points}
            </div>);
}

const MonthCalendar = ({ logs } : Props) => {
    let els = [];
    let i = 0;
    let current = getDateFromLog(logs[0]);

    // Create cards from today to first entry
    let now = DateTime.now().startOf("day").startOf("week").plus({ weeks: 1 }).minus({ days: 2 });
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

    // 7 days in a week, 6 rows by default = 42
    while (els.length < 42) {
        current = current.minus({ days: 1 });
        els.push(createCalendarCard(current));
    }

    // Create empty cards for final week
    while (current.weekday !== 7) {
        current = current.minus({ days: 1 });
        els.push(createCalendarCard(current));
    }

    let rows: JSX.Element[] = [];
    chunk(els, 7).forEach((row: JSX.Element[]) => {
        rows.push(<div key={row[0].key + "-row"} className="calendar-row">{row}</div>);
    });

    return <div className="month-calendar">{rows}</div>
}

export default MonthCalendar;