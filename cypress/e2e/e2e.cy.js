import Dexie from "dexie"
import { DateTime } from "luxon"

/* global cy */

// This is a temporary solution -- some elements
// and views are inconsistent, so this just ensures
// everything is okay before continuing
const WAIT_FOR_CONSISTENCY = 4000;

describe("Mobile Flow", () => {
    beforeEach(() => {
        cy.viewport("iphone-x")
        Cypress.config('defaultCommandTimeout', 8000);
    })

    it("Load Main Page", () => {
        cy.visit("/")
        cy.contains("Google").should("exist")
        cy.get("body").happoScreenshot()
    })

    it("Login as Anonymous", () => {
        cy.get("ion-button").click({ force: true })
        cy.contains("Logging in").should("exist")
        cy.contains("try again").should("exist").click()
        cy.contains("Anonymous").should("exist")
        cy.wait(WAIT_FOR_CONSISTENCY)
        cy.contains("Anonymous").click({ force: true })
        cy.contains("Logging in").should("exist")
        cy.contains("keys").should("exist")
        cy.contains("onboarding").should("exist", { timeout: 16000 })
    })

    it("Goes Through Onboarding", () => {
        cy.get("body").happoScreenshot()
        cy.get(".finish-button").should("exist").click()
        
        cy.contains("Expert").should("exist").click()
        cy.get("body").happoScreenshot()
        cy.contains("recommended").should("exist").click()
        cy.get(".finish-button").should("exist").click()

        cy.contains("in the moment").should("exist")
        cy.get("body").happoScreenshot()
        cy.get(".finish-button").should("exist").click()

        cy.contains("three things").should("exist")
        cy.get("body").happoScreenshot()
        cy.get(".finish-button").should("exist").click()

        cy.contains("good").should("exist")
        cy.get("body").happoScreenshot()
        cy.get(".finish-button").should("exist").click()

        cy.contains("ready").should("exist")
        cy.get("body").happoScreenshot()
        cy.get(".finish-button").should("exist").click()

        cy.contains("Don't forget").should("exist")
        cy.get("body").happoScreenshot()
        cy.get("ion-toggle").eq(0).should("not.have.class", "toggle-checked")
        cy.get("ion-toggle").eq(0).click()
        cy.get("ion-toggle").eq(0).should("have.class", "toggle-checked")
        cy.get("ion-toggle").eq(0).click()
        cy.get("ion-toggle").eq(0).should("not.have.class", "toggle-checked")
        cy.get(".finish-button").should("exist").click()
        
        cy.url().should("include", "/journal")
    })

    it("Check Mobile Summary Page", () => {
        cy.get(".top-corner").should("have.length", 1).click()
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

        cy.get("span.bold > div > div:first")
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: 200, clientY: 0, pageX: 200, pageY: 0, screenX: 200, screenY: 0 })
            .trigger('mouseup', { force: true })

        cy.contains("Done!").should("exist").click()
        cy.get(".loader").should("exist")
        cy.get("canvas").should("exist")
        cy.get("body").happoScreenshot()
        cy.url().should("include", "/summary")
        cy.get("textarea").should("not.exist")
    })

    it("Verify Mood Log on Summary", () => {
        cy.contains("Hello world!").should("exist")
        cy.get("div.toastify").invoke("remove")
        
        // This is due to the segment button not resetting.
        // How does this happen? No idea.
        cy.wait(WAIT_FOR_CONSISTENCY)
    })

    it("Test Beginner Mode Dialog", () => {
        cy.get(".fab-button-close-active").should("exist").click()
        cy.contains("What's happening").should("exist")
        cy.contains("feel").should("exist")
        cy.get("textarea").should("exist").focus().clear().type(`Bad beginner`).should("have.value", `Bad beginner`)
        cy.contains("Continue").should("exist").click()

        cy.get(".dialog-background").should("exist").happoScreenshot()
        cy.contains("Go back and write").click()
        cy.get("textarea").should("exist").should("have.value", `Bad beginner`)
        cy.contains("Continue").should("exist").click()
        cy.contains("Done!").should("exist").click()
        cy.url().should("include", "/summary")
        cy.contains(`Bad beginner`).should("exist")
    })

    it("Turn off Beginner Mode", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.contains("Reduce Motion").should("exist")
        cy.get(".settings-box-grid").eq(0).happoScreenshot()
        cy.get("ion-toggle").eq(0).should("have.class", "toggle-checked")
        cy.get("ion-toggle").eq(0).click()
        cy.get("ion-toggle").eq(0).should("not.have.class", "toggle-checked")
        cy.get(".settings-box-grid").eq(0).happoScreenshot()

        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/summary")

        cy.wait(WAIT_FOR_CONSISTENCY)
    })

    it("Log a Few More Times and test FinishJournal Dialogs", () => {
        for (let i = 0; i < 12; ++i) {
            cy.get(".fab-button-close-active").should("exist").click()
            cy.contains("What's happening").should("exist")
            cy.contains("tap here").should("exist")
            cy.get("textarea").should("exist").focus().clear().type(`Test ${i}`).should("have.value", `Test ${i}`)
            cy.contains("Continue").should("exist").click()

            if (i === 0) {
                cy.get(".dialog-background").should("exist").happoScreenshot()
                cy.contains("Go back and write").click()
                cy.get("textarea").should("exist").should("have.value", `Test ${i}`)
                cy.contains("Continue").should("exist").click()
            } else if (i === 10) {
                cy.get(".dialog-background").should("exist").happoScreenshot()
                cy.contains("Before you continue")
                cy.contains("Sounds good").should("exist").click()
            }

            cy.get("span.bold > div > div:first")
                .trigger('mousedown', { which: 1 })
                .trigger('mousemove', { clientX: 200, clientY: 0, pageX: 200, pageY: 0, screenX: 200, screenY: 0 })
                .trigger('mouseup', { force: true })

            cy.contains("Done!").should("exist").click()
            cy.url().should("include", "/summary")
            cy.contains(`Test ${i}`).should("exist")
            cy.get("div.toastify").invoke("remove")
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

    it("Test Search and Filter", () => {
        cy.contains("Search").click()
        cy.get(".searchbar").type("Hello world")
        cy.get(".mood-card").should("have.length", 1)

        cy.get(".searchbar").clear().type("Nonsense")
        cy.contains("No Results").should("exist")

        cy.get(".searchbar").clear()
        cy.get("No Results").should("not.exist")
        cy.get(".image-btn").click()
        cy.contains("No Results").should("exist")

        cy.get(".image-btn").click()
        cy.contains("No Results").should("not.exist")

        cy.get(".top-corner").click()
        cy.contains("week has been looking").should("exist")
    })

    it("Test -5 Warning Behavior", () => {
        cy.get(".fab-button-close-active").should("exist").click()
        cy.contains("What's happening").should("exist")
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
        cy.get(".finish-button").should("not.exist")
        cy.contains("crisis").should("exist")
        cy.contains("apply now").should("exist").click()

        // Gap fund page
        cy.url().should("include", "/gap")
        cy.contains("Gap Fund").should("exist")

        // Back to summary
        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/neg")
        cy.contains("crisis").should("exist")
        cy.get(".top-corner").should("have.length", 1).click()
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
        cy.get(".calendar-card").last().within(el => {
            el.click()
            cy.get(".less-highlight-day").should("not.exist")
        })
        cy.get(".month-calendar").contains(new Date().getDate()).first().within(el => {
            el.click()
        })
        cy.get("#moodLogList").scrollTo(0, 500, { ensureScrollable: false, duration: 1000 })
        cy.get("#moodLogList").scrollTo(0, 0, { ensureScrollable: false, duration: 1000 })
        cy.get(".marker").last().happoScreenshot()
    })

    it("Test Colorblind Mode", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.contains("Skip").should("exist")
        cy.get(".settings-box-grid").eq(2).happoScreenshot()
        cy.get("ion-toggle").eq(2).should("not.have.class", "toggle-checked")
        cy.get("ion-toggle").eq(2).click()
        cy.get("ion-toggle").eq(2).should("have.class", "toggle-checked")
        cy.get(".settings-box-grid").eq(2).happoScreenshot()

        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/summary")
        cy.get(".marker").last().happoScreenshot()
    })

    it("Test Search and Filter", () => {
        cy.get(".image-btn").click()
        cy.contains("No Results").should("exist")
        
        cy.get(".image-btn").click()
        cy.contains("No Results").should("not.exist")
    })

    it("Verify Notifications Page", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Notifications").should("exist")
        cy.get("ion-menu").happoScreenshot()
        cy.contains("Notifications").click()
        cy.get("ion-menu").should("not.exist")
        cy.url().should("include", "notifications")
        cy.contains("not supported").should("exist")
        cy.get("body").happoScreenshot()
        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "summary")
    })

    it("Verify Get Help Page", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Get Help").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.contains("Hi there").should("exist")
        cy.get("body").happoScreenshot()
        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "summary")
    })

    it("Verify Non-Eligible Gap Fund Page", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Gap Fund").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.url().should("include", "gap")
        cy.contains("eligible").should("exist")
        cy.get("body").happoScreenshot()

        cy.contains("donate").should("exist").click()
        cy.url().should("include", "donate")
        cy.get("body").happoScreenshot()
        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "gap")
        cy.contains("eligible").should("exist")

        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "summary")
    })

    it("Test WIR Button on Survey Results", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Surveys").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        
        cy.contains("Last Week").should("not.exist")

        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/summary")

        cy.visit("/lastreview")
        cy.url().should("contain", "/surveys")
        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/summary")
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
        cy.get(".top-corner").should("have.length", 1).click()
        cy.contains("Week In Review").should("exist")
        cy.get(".prompt-prompt").happoScreenshot()
    })

    it("Test Skip WIR", () => {
        cy.contains("Skip").should("not.exist")
        cy.contains("Later").click()
        cy.contains("Week In Review").should("not.exist")

        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.contains("Skip").should("exist")
        cy.get(".settings-box-grid").eq(3).happoScreenshot()
        cy.get("ion-toggle").eq(3).should("not.have.class", "toggle-checked")
        cy.get("ion-toggle").eq(3).click()
        cy.get("ion-toggle").eq(3).should("have.class", "toggle-checked")
        cy.get(".settings-box-grid").eq(3).happoScreenshot()

        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/summary")
        cy.contains("Week In Review").should("exist")
        cy.contains("Skip").should("exist")
    })

    it("Complete Week In Review", () => {
        cy.contains("Start").click()

        cy.contains("Let's get started").should("exist")
        cy.get("body").happoScreenshot()
        cy.contains("Start Surveys").click()
        cy.contains("Question 1/21").should("exist")
        for (let i = 0; i < 21; ++i) {
            cy.contains("Never").click()
        }

        cy.get(".loader").should("exist")
        cy.get(".loader").should("not.exist", { timeout: 10000 })
        cy.contains("Question 1/").should("exist").then(el => {
            let questions = Number(el.text().split("/")[1]);
            if (questions === 5) --questions; // Removes skipped question in asQ
            if (questions === 9) questions = 1; // Relationship screener only has one question
            for (let i = 0; i < questions; ++i) {
                cy.get(".finish-button").first().click()
            }
        })

        cy.get(".loader").should("exist")
        cy.get(".loader").should("not.exist", { timeout: 10000 })
        cy.contains("Hi there").should("exist")
        cy.get("ion-icon").eq(1).click()
        cy.contains("Results").should("exist")
        cy.contains("d=0, a=0, s=0").should("exist")
        cy.get("ion-icon").eq(1).click()
        cy.get("ion-icon").eq(1).click()
        cy.contains("Finish").should("exist").click()
        cy.url().should("include", "summary")
    })

    it("Attempts Gap Fund Request", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Gap Fund").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.url().should("include", "gap")
        cy.contains("Make sure you get this right").should("exist")

        cy.contains("Submit").click()
        cy.contains("complete all fields").should("exist")

        cy.get("#email").should("be.enabled").type("hello@email.com",  { force: true })
        cy.contains("Submit").click()
        cy.get(".toastify").should("have.length", 2)

        cy.get("#need").should("be.enabled").type("need",  { force: true })
        cy.contains("Submit").click()
        cy.get(".toastify").should("have.length", 3)

        cy.get("#amount").should("be.enabled").type("amount",  { force: true })
        cy.contains("Submit").click()
        cy.get(".toastify").should("have.length", 4)

        cy.get("#method").should("be.enabled").type("  ",  { force: true })
        cy.contains("Submit").click()
        cy.get(".toastify").should("have.length", 5)

        cy.get("#method").should("be.enabled").clear({ force: true }).type("method",  { force: true })
        cy.contains("Submit").click()
        cy.contains("match").should("exist")

        cy.get("#confirmEmail").should("be.enabled").type("hello@email.com",  { force: true })
        cy.contains("Submit").click()
        cy.contains("went wrong").should("exist")
    })
})

describe("Test Settings", () => {
    beforeEach(() => {
        cy.viewport("iphone-x")
    })

    it("Test Reduce Motion", () => {
        cy.visit("/summary")
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.contains("Reduce Motion").should("exist")
        cy.get(".settings-box-grid").eq(1).happoScreenshot()
        cy.get("ion-toggle").eq(1).should("not.have.class", "toggle-checked")
        cy.get("ion-toggle").eq(1).click()
        cy.get("ion-toggle").eq(1).should("have.class", "toggle-checked")
        cy.get(".settings-box-grid").eq(1).happoScreenshot()

        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/summary")
        cy.contains("week").should("exist")

        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.contains("Reduce Motion").should("exist")
        cy.get("ion-toggle").should("have.class", "toggle-checked")
    })

    it("Set a Passphrase", () => {
        cy.get("input[type=password]").should("not.exist")
        cy.contains("Set a passphrase").click()
        cy.get("input[type=password]").should("exist")
        cy.get(".passphrase-box").happoScreenshot()
        cy.get(".finish-button").click()
        cy.contains("long").should("exist")

        cy.get("input[type=password]").eq(0).should("be.enabled").type("password", { force: true })
        cy.get("input[type=password]").eq(1).should("be.enabled").type("password1",  { force: true })
        cy.get(".finish-button").click()
        cy.contains("match").should("exist")

        cy.get("input[type=password]").eq(1).should("be.enabled").clear({ force: true }).type("password",  { force: true })
        cy.get(".finish-button").click()
        cy.get(".loader").should("exist")
        cy.get(".passphrase-box").should("not.exist")
        cy.contains("enabled").should("exist")
        cy.get("input[type=password]").should("not.exist")
        cy.get("ion-spinner").should("not.exist")

        cy.get("ion-radio").eq(0).should("have.class", "radio-checked")
        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/summary")
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.get("ion-radio").eq(0).should("have.class", "radio-checked")
        cy.get("ion-radio").eq(1).should("not.have.class", "radio-checked")
    })

    it("Test Unlock", () => {
        cy.reload()
        cy.url().should("include", "/unlock")
        cy.contains("Unlock").should("exist")
        cy.get("input[type=password]").should("be.enabled").type("p")
        cy.get(".finish-button").click()
        cy.contains("incorrect").should("exist")

        cy.get("input[type=password]").should("be.enabled").clear().type("password")
        cy.get(".finish-button").click()
        cy.url().should("include", "/summary")
        cy.contains("Test 0")
    })

    it("Test Change Passphrase", () => {
        cy.url().should("include", "/summary")
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.contains("Change").click()
        cy.get(".finish-button").click()
        cy.contains("long").should("exist")

        cy.get("input[type=password]").eq(0).should("be.enabled").type("password1",  { force: true })
        cy.get(".finish-button").click()
        cy.get(".toastify").should("have.length", 2)

        cy.get("input[type=password]").eq(1).should("be.enabled").type("password1",  { force: true })
        cy.get(".finish-button").click()
        cy.get(".toastify").should("have.length", 3)

        cy.get("input[type=password]").eq(2).should("be.enabled").type("password1",  { force: true })
        cy.get(".finish-button").click()
        cy.get(".toastify").should("have.length", 4)
        cy.contains("incorrect")

        cy.get("input[type=password]").eq(0).should("be.enabled").clear({ force: true }).type("password",  { force: true })
        cy.get(".finish-button").click()
        cy.get(".passphrase-box").should("not.exist")
        cy.contains("Change Passphrase").should("exist")
        cy.contains("enabled").should("exist")
        cy.get("ion-spinner").should("not.exist")

        cy.reload()
        cy.url().should("include", "/unlock")
        cy.contains("Unlock").should("exist")

        cy.get("input[type=password]").type("password1")
        cy.get(".finish-button").click()
        cy.url().should("include", "/summary")
        cy.contains("Test 0")
    })

    it("Test Discreet Mode", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.get("ion-radio").eq(1).click().should("have.class", "radio-checked")
        cy.get("ion-radio").eq(0).should("not.have.class", "radio-checked")
        cy.get("ion-spinner").should("not.exist")


        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/summary")
        cy.contains("Test 0")

        cy.reload()
        cy.url().should("include", "/summary")
        cy.contains("first mood log").should("exist")
        cy.get(".mood-card").should("not.exist")

        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.get("ion-menu").should("not.exist")

        cy.url().should("include", "/unlock")
        cy.get("input[type=password]").type("password1",  { force: true })
        cy.get(".finish-button").click()
        
        cy.url().should("include", "/summary")
        cy.contains("Test 0")
    })

    it("Test Remove Passphrase", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.get("ion-menu").should("not.exist")

        cy.contains("Remove").click()
        cy.get(".finish-button").click()
        cy.contains("long").should("exist")
        cy.get("input[type=password]").should("be.enabled").type("password",  { force: true })
        cy.get(".finish-button").click()

        cy.contains("incorrect").should("exist")
        cy.get("input[type=password]").should("be.enabled").clear({ force: true }).type("password1",  { force: true })
        cy.get(".finish-button").click()

        cy.get(".passphrase-box").should("not.exist")
        cy.contains("Set a passphrase").should("exist")
        cy.get("ion-spinner").should("not.exist")

        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/summary")
        cy.contains("Test 0")
    })

    it("Test Survey Results", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Surveys").should("exist").click()
        cy.get("ion-menu").should("not.exist")

        cy.contains("have enough data").should("exist")
        cy.get(".recharts-responsive-container").should("have.length", 2)

        cy.contains("Last Week").should("exist").click()
        cy.url().should("include", "/lastreview")
        cy.contains("Hi there").should("exist")
        cy.get("ion-icon").eq(1).click()
        cy.contains("Results").should("exist")
        cy.contains("d=0, a=0, s=0").should("exist")
        cy.get("ion-icon").eq(1).click()
        cy.get("ion-icon").eq(1).click()
        cy.contains("Finish").should("exist").click()
        cy.url().should("include", "/surveys")

        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/summary")
    })

    it("Start Deletion", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.contains("click here").click()
        cy.get("ion-alert").should("be.visible")
        cy.get("button").eq(0).click()
        cy.get("ion-alert").should("not.exist")

        cy.contains("click here").click()
        cy.get("ion-alert").should("be.visible")
        cy.get("button").eq(1).click()
        cy.get("ion-alert").should("not.exist")
        
        cy.contains("Google").should("exist")
        cy.contains("delete").should("exist")
        cy.get(".toastify").should("exist")
    })
})