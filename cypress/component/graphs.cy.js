import DASSGraph from "../../src/components/graphs/DASSGraph";
import ResilienceGraph from "../../src/components/graphs/ResilienceGraph";
import BaselineGraph from "../../src/components/graphs/BaselineGraph";
import "../../src/theme/variables.css";
import "../../src/components/Journal/JournalComponents.css";
import { DateTime } from "luxon";
import { calculateBaseline } from "../../src/helpers";
import { useState, useEffect } from "react";
import ldb from "../../src/db"
import { ONE_DAY } from "../../src/components/graphs/helpers";

const DASSGraphContainer = ({ data }) => {

    return <DASSGraph
        data={data}
        sync={false}
    />
};

const SPFGraphContainer = ({ data }) => {

    return <ResilienceGraph
        data={data}
        sync={false}
    />
};

const BaselineGraphContainer = () => {
    const [baselineGraph, setBaselineGraph] = useState(undefined);
    useEffect(() => {
        calculateBaseline(setBaselineGraph);
    }, []);

    return (
        <>
            { baselineGraph && typeof baselineGraph === "object" && <BaselineGraph
                data={baselineGraph}
                sync={false}
            /> }
        </>
    );
};

const DASS_PAUSE = false;
const SPF_PAUSE = false;
const BASELINE_PAUSE = false;

const SEED = 293432490;
const CANVAS_WAIT = 1000;

function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

const now = DateTime.now().toMillis();
const week = now - DateTime.now().minus({ days: 7 }).toMillis();
const DASS_POINTS = 29;
let dassData = [];
describe("DASS", () => {
    before(() => {
        const rand = mulberry32(SEED);
        dassData = [{ timestamp: now, d: 1, a: 0.5, s: 0.5 }];
        for (let j = 0; j < DASS_POINTS; j++) {
            dassData.unshift({ timestamp: now - ((j + 1) * week), d: rand() * 4, a: rand() * 4, s: rand() * 4 });
        }
    });

    beforeEach(() => {
        cy.viewport("macbook-13");
    });

    it("One to 30 Points", () => {
        for (let i = DASS_POINTS; i >= 0; i--) {
            const dataSlice = dassData.slice(i);
            cy.mount(<DASSGraphContainer data={dataSlice} />);
            if (DASS_PAUSE) cy.pause();
            cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
        }
    });

    it("Further Out (4)", () => {
        const dataSlice = [{
            timestamp: now - (10 * week),
            d: 1,
            a: 0.5,
            s: 0.5
        }, {
            timestamp: now - (9 * week),
            d: 1,
            a: 0.5,
            s: 0.5
        }, {
            timestamp: now - (8 * week),
            d: 1,
            a: 0.5,
            s: 0.5
        }, {
            timestamp: now - (7 * week),
            d: 1,
            a: 0.5,
            s: 0.5
        }]
        cy.mount(<DASSGraphContainer data={dataSlice} />);
        if (DASS_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })

    it("Further Out (1)", () => {
        const dataSlice = [{
            timestamp: now - (10 * week),
            d: 1,
            a: 0.5,
            s: 0.5
        }]
        cy.mount(<DASSGraphContainer data={dataSlice} />);
        if (DASS_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })

    it("Gap", () => {
        const dataSlice = [{
            timestamp: now - (10 * week),
            d: 1,
            a: 0.5,
            s: 0.5
        }, {
            timestamp: now - (9 * week),
            d: 1,
            a: 0.5,
            s: 0.5
        }, {
            timestamp: now - (5 * week),
            d: 1,
            a: 0.5,
            s: 0.5
        }, {
            timestamp: now - (4 * week),
            d: 1,
            a: 0.5,
            s: 0.5
        }]
        cy.mount(<DASSGraphContainer data={dataSlice} />);
        if (DASS_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })
});

const SPF_POINTS = 12;
let spfData = [];
describe("SPF (Resilience)", () => {
    before(() => {
        const rand = mulberry32(SEED);
        spfData = [{ timestamp: now, value: 1 }];
        for (let j = 0; j < SPF_POINTS * 4; j += 4) {
            spfData.unshift({ timestamp: now - ((j + 1) * week), value: rand() * 3 });
        }
    });

    beforeEach(() => {
        cy.viewport("macbook-13");
    });

    it("One to 30 Points", () => {
        for (let i = SPF_POINTS; i >= 0; i--) {
            const dataSlice = spfData.slice(i);
            console.log(dataSlice)
            cy.mount(<SPFGraphContainer data={dataSlice} />);
            if (SPF_PAUSE) cy.pause();
            cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
        }
    });

    it("Further Out (4)", () => {
        const dataSlice = [
            { timestamp: now - (24 * week), value: 1 },
            { timestamp: now - (20 * week), value: 0.8 },
            { timestamp: now - (16 * week), value: 3 },
            { timestamp: now - (12 * week), value: 1.2 }
        ]
        cy.mount(<SPFGraphContainer data={dataSlice} />);
        if (SPF_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })

    it("Further Out (1)", () => {
        const dataSlice = [
            { timestamp: now - (24 * week), value: 1 },
        ]
        cy.mount(<SPFGraphContainer data={dataSlice} />);
        if (SPF_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })

    it("Gap", () => {
        const dataSlice = [
            { timestamp: now - (24 * week), value: 1 },
            { timestamp: now - (20 * week), value: 0.8 },
            { timestamp: now - (5 * week), value: 1.2 },
            { timestamp: now - (1 * week), value: 1.2 }
        ]

        cy.mount(<SPFGraphContainer data={dataSlice} />);
        if (SPF_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })
});

describe("baseline", () => {
    beforeEach(() => {
        cy.viewport("macbook-13");
    });

    it("Zero", () => {
        ldb.logs.clear();
        for (let i = 0; i < 60; i++) {
            const date = DateTime.fromMillis(now - (i * ONE_DAY));
            ldb.logs.add({ timestamp: date.toMillis(), year: date.year, month: date.month, day: date.day, mood: 0, average: "average" });
        }
        
        cy.mount(<BaselineGraphContainer />);
        cy.get('canvas').should("exist");
        if (BASELINE_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })

    it("Decline", () => {
        ldb.logs.clear();
        for (let i = 0; i < 60; i++) {
            const date = DateTime.fromMillis(now - (i * ONE_DAY));
            ldb.logs.add({ timestamp: date.toMillis(), year: date.year, month: date.month, day: date.day, mood: (i / 30) - 1, average: "average" });
        }
        
        cy.mount(<BaselineGraphContainer />);
        cy.get('canvas').should("exist");
        if (BASELINE_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })

    it("-5 to 5", () => {
        ldb.logs.clear();
        let date = DateTime.now();
        for (let i = 0; i < 15; i++) {
            ldb.logs.add({ timestamp: date.toMillis(), year: date.year, month: date.month, day: date.day, mood: -5, average: "average" });
            date = date.minus({ days: 1 });
        }

        for (let i = 0; i < 60; i++) {
            ldb.logs.add({ timestamp: date.toMillis(), year: date.year, month: date.month, day: date.day, mood: (i / 6) - 5, average: "average" });
            date = date.minus({ days: 1 });
        }

        for (let i = 0; i < 15; i++) {
            ldb.logs.add({ timestamp: date.toMillis(), year: date.year, month: date.month, day: date.day, mood: 5, average: "average" });
            date = date.minus({ days: 1 });
        }
        
        cy.mount(<BaselineGraphContainer />);
        cy.get('canvas').should("exist");
        if (BASELINE_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })

    it("Bottom Axis Only", () => {
        ldb.logs.clear();
        let date = DateTime.now();
        const rand = mulberry32(SEED);

        for (let i = 0; i < 365; i++) {
            ldb.logs.add({ timestamp: date.toMillis(), year: date.year, month: date.month, day: date.day, mood: -Math.round(rand() * 5), average: "average" });
            date = date.minus({ days: 1 });
        }
        
        cy.mount(<BaselineGraphContainer />);
        cy.get('canvas').should("exist");
        if (BASELINE_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })

    it("Down to -5", () => {
        ldb.logs.clear();
        let date = DateTime.now();
        for (let i = 0; i < 15; i++) {
            ldb.logs.add({ timestamp: date.toMillis(), year: date.year, month: date.month, day: date.day, mood: -5, average: "average" });
            date = date.minus({ days: 1 });
        }

        for (let i = 0; i < 30; i++) {
            ldb.logs.add({ timestamp: date.toMillis(), year: date.year, month: date.month, day: date.day, mood: (i / 6) - 3.8, average: "average" });
            date = date.minus({ days: 1 });
        }
        
        cy.mount(<BaselineGraphContainer />);
        cy.get('canvas').should("exist");
        if (BASELINE_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })

    it("Up to 5", () => {
        ldb.logs.clear();
        let date = DateTime.now();
        for (let i = 0; i < 15; i++) {
            ldb.logs.add({ timestamp: date.toMillis(), year: date.year, month: date.month, day: date.day, mood: 5, average: "average" });
            date = date.minus({ days: 1 });
        }

        for (let i = 0; i < 30; i++) {
            ldb.logs.add({ timestamp: date.toMillis(), year: date.year, month: date.month, day: date.day, mood: (i / 6) - 1, average: "average" });
            date = date.minus({ days: 1 });
        }
        
        cy.mount(<BaselineGraphContainer />);
        cy.get('canvas').should("exist");
        if (BASELINE_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })

    it("Random", () => {
        const rand = mulberry32(SEED);
        ldb.logs.clear();
        for (let i = 0; i < 60; i++) {
            const date = DateTime.fromMillis(now - (i * ONE_DAY));
            ldb.logs.add({ timestamp: date.toMillis(), year: date.year, month: date.month, day: date.day, mood: Math.round((rand() * 10) - 5), average: "average" });
        }
        
        cy.mount(<BaselineGraphContainer />);
        cy.get('canvas').should("exist");
        if (BASELINE_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })

    it("Gap", () => {
        const rand = mulberry32(SEED);
        ldb.logs.clear();
        for (let i = 0; i < 180; i++) {
            if (i > 45 && i < 90) continue;
            const date = DateTime.fromMillis(now - (i * ONE_DAY));
            ldb.logs.add({ timestamp: date.toMillis(), year: date.year, month: date.month, day: date.day, mood: Math.round((rand() * 10) - 5), average: "average" });
        }
        
        cy.mount(<BaselineGraphContainer />);
        cy.get('canvas').should("exist");
        if (BASELINE_PAUSE) cy.pause();
        cy.wait(CANVAS_WAIT);
        cy.get("body").happoScreenshot();
    })
})
