import Dexie from "dexie"
import { DateTime } from "luxon"

/* global cy */

describe("Mobile Flow", () => {
    beforeEach(() => {
        cy.viewport("iphone-x")
    })

    it("Load Main Page", () => {
        cy.visit("/")
        cy.get("body").then(($body) => {
            if ($body.text().includes("What's happening")) {
              cy.contains("What's happening").click()
            }
        })

        cy.contains("Anonymous").should("exist")
        cy.contains("Google").should("exist")
        cy.get("body").happoScreenshot()
    })

    it("Login as Anonymous", () => {
        cy.contains("Anonymous").click()
        cy.contains("What's happening").should("exist")
        cy.get("body").happoScreenshot()
    })

    it("Check Mobile Summary Page", () => {
        cy.get(".top-corner").click()
        cy.contains("week").should("exist")
        cy.contains("first mood log").should("exist")
        cy.get(".mood-card").should("not.exist")
        cy.get("body").happoScreenshot()
    })

    it("Write Mood Log", () => {
        cy.get(".fab-button-close-active").click()
        cy.contains("What's happening").should("exist")
        cy.get("textarea").type("Hello world!")
        cy.get('body').happoScreenshot()
        cy.contains("Continue").should("exist").click()
    })

    it("Finish Mood Log", () => {
        cy.get("svg").should("exist")
        cy.get("textarea").should("have.value", "Hello world!")
        cy.get(".segment-button-checked").should("exist").should("have.text", "Average")
        cy.get("body").happoScreenshot()

        cy.contains("Above Average").should("exist").parents("ion-segment-button").click()
        cy.get(".segment-button-checked").should("exist").should("have.text", "Above Average")
        cy.get("ion-segment").happoScreenshot();
        cy.contains("Below Average").should("exist").parents("ion-segment-button").click()
        cy.get(".segment-button-checked").should("exist").should("have.text", "Below Average")
        cy.get("ion-segment").happoScreenshot()

        cy.contains("Done!").should("exist").click()
        cy.get(".loader").should("exist")
        cy.get("body").happoScreenshot()
        cy.url().should("include", "/summary")
    })

    it("Verify Mood Log on Summary", () => {
        cy.contains("Hello world!").should("exist")
        cy.contains("no more logs").should("exist")
    })

    it("Log a Few More Times", () => {
        for (let i = 0; i < 5; ++i) {
            cy.get(".fab-button-close-active").should("exist").click()
            cy.contains("What's happening").should("exist")
            cy.waitUntil(() => Cypress.$("ion-toast").length === 0)
            cy.get("textarea").should("exist").focus().type(`Test ${i}`).should("have.value", `Test ${i}`)
            cy.contains("Continue").should("exist").click()
            cy.contains("Done!").should("exist").click({ force: true })
            cy.url().should("include", "/summary")
            cy.contains(`Test ${i}`).should("exist")
        }
    })

    it("Scroll Through Log List", () => {
        // Load check
        cy.get("#moodLogList").should("exist")
        cy.contains("Hello world!").should("exist")
        cy.get(".week-mood-graph").should("exist")
        // Test scroll
        cy.get("#moodLogList").scrollTo(0, 500, { ensureScrollable: false, duration: 1000 })
        cy.get(".log-list-expand").should("have.css", "height").and("match", /^0px$/)
        cy.get("#moodLogList").scrollTo(0, 0, { ensureScrollable: false, duration: 1000 })
        cy.get(".log-list-expand").should("have.css", "height").and("not.match", /^0px$/)
    })

    it("Test -5 Warning Behavior", () => {
        cy.get(".fab-button-close-active").should("exist").click()
        cy.contains("What's happening").should("exist")
        cy.waitUntil(() => Cypress.$("ion-toast").length === 0)
        cy.get("textarea").should("exist").focus().type(`-5`).should("have.value", `-5`)
        cy.contains("Continue").should("exist").click()
        cy.get("span.bold > div > div:first")
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: 100, clientY: 0, pageX: 100, pageY: 0, screenX: 100, screenY: 0 })
            .trigger('mouseup', { force: true })

        cy.contains("Done!").should("exist").click()

        // -5 time
        cy.url().should("include", "/neg")
        cy.get(".loader").should("exist")
        cy.contains("crisis").should("exist")
        cy.contains("apply now").should("exist").click()

        // Gap fund page
        cy.url().should("include", "/gap")
        cy.contains("Gap Fund").should("exist")

        // Back to summary
        cy.get(".top-corner").click()
        cy.url().should("include", "/neg")
        cy.contains("crisis").should("exist")
        cy.get(".top-corner").click()
        cy.url().should("include", "/summary")
        cy.contains("week").should("exist")
    })
})

describe("Desktop Flow", () => {
    beforeEach(() => {
        cy.viewport("macbook-13")
    })

    it("Write Mood Log", () => {
        cy.visit("/")
        cy.contains("What's happening").should("exist")
        cy.get("textarea").type("Hello desktop world!")
        cy.get("body").happoScreenshot()
        cy.contains("Continue").should("exist").click()
    })

    it("Finish Mood Log", () => {
        cy.get("svg").should("exist")
        cy.get("textarea").should("have.value", "Hello desktop world!")
        cy.get(".segment-button-checked").should("exist").should("have.text", "Average")
        cy.get("body").happoScreenshot()

        cy.contains("Above Average").should("exist").parents("ion-segment-button").click()
        cy.get(".segment-button-checked").should("exist").should("have.text", "Above Average")
        cy.get("ion-segment").happoScreenshot();
        cy.contains("Below Average").should("exist").parents("ion-segment-button").click()
        cy.get(".segment-button-checked").should("exist").should("have.text", "Below Average")
        cy.get("ion-segment").happoScreenshot();

        cy.contains("Done!").should("exist").click()
        cy.get(".loader").should("exist")
        cy.get("body").happoScreenshot()
        cy.url().should("include", "/summary")
    })

    it("Verify Mood Log on Summary", () => {
        cy.contains("Hello desktop world!").should("exist")
        cy.contains("no more logs").should("exist")
        cy.get(".calendar-card").last().within(el => {
            el.click()
            cy.get(".less-highlight-day").should("not.exist")
        })
        cy.get(".month-calendar").contains(new Date().getDate()).first().within(el => {
            el.click()
        })
        cy.get("#moodLogList").scrollTo(0, 500, { ensureScrollable: false, duration: 1000 })
        cy.get("#moodLogList").scrollTo(0, 0, { ensureScrollable: false, duration: 1000 })
    })

    it("Verify Notifications Page", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.get("body").happoScreenshot()
        cy.contains("Notifications").should("exist").click()
        cy.url().should("include", "notifications")
        cy.contains("not supported").should("exist")
        cy.get("body").happoScreenshot()
        cy.get(".top-corner").click()
        cy.url().should("include", "summary")
    })

    it("Verify Non-Eligible Gap Fund Page", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Gap Fund").should("exist").click()
        cy.url().should("include", "gap")
        cy.contains("eligible").should("exist")
        cy.get("body").happoScreenshot()

        cy.contains("donate").should("exist").click()
        cy.url().should("include", "donate")
        cy.get("body").happoScreenshot()
        cy.get(".top-corner").click()
        cy.url().should("include", "gap")
        cy.contains("eligible").should("exist")

        cy.get(".top-corner").click()
        cy.url().should("include", "summary")
    })

    it("Makes User Eligible (Week In Review, Gap Fund)", () => {
        const ldb = new Dexie('ldb');
        ldb.version(1).stores({
            logs: `&timestamp, year, month, day, time, zone, mood, journal, average`
        });

        const date =  DateTime.now().minus({ week: 1 });
        ldb.logs.add({
            timestamp: date.toMillis(),
            month: date.month,
            day: date.day,
            year: date.year,
            time: "1:00 CST",
            zone: "America/Chicago",
            average: "average",
            mood: 0,
            journal: "fake"
        });

        cy.get(".fab-button-close-active").click()
        cy.contains("What's happening").should("exist")
        cy.get(".top-corner").click()
        cy.contains("Week In Review").should("exist")
        cy.get(".prompt-prompt").happoScreenshot()
    })

    it("Complete Week In Review", () => {
        cy.contains("Later").click()
        cy.contains("Week In Review").should("not.exist")
        cy.get(".fab-button-close-active").click()
        cy.contains("What's happening").should("exist")
        cy.get(".top-corner").click()
        cy.contains("Week In Review").should("exist")
        cy.contains("Start").click()

        cy.contains("three parts").should("exist")
        cy.get("body").happoScreenshot()
        cy.contains("Start Primary").click()
        cy.contains("Question 1/21").should("exist")
        for (let i = 0; i < 21; ++i) {
            cy.contains("Never").click()
        }

        cy.get(".loader").should("exist")
        cy.get(".loader").should("not.exist", { timeout: 10000 })
        cy.contains("Question 1/").should("exist").then(el => {
            let questions = Number(el.text().split("/")[1]);
            if (questions === 5) --questions; // Removes skipped question in asQ
            for (let i = 0; i < questions; ++i) {
                cy.get(".finish-button").first().click()
            }
        })

        cy.get(".loader").should("exist")
        cy.get(".loader").should("not.exist", { timeout: 10000 })
        cy.contains("d=0, a=0, s=0").should("exist")
        cy.contains("Finish").should("exist").click()
        cy.url().should("include", "summary")
    })

    it("Attempts Gap Fund Request", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Gap Fund").should("exist").click()
        cy.url().should("include", "gap")
        cy.contains("Make sure you get this right").should("exist")
    })
})