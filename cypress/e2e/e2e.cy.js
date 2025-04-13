import Dexie from "dexie"
import { DateTime } from "luxon"
import { parse } from "csv-parse/sync"
import { dataOptionsObjArr } from "../../src/components/MyData/constants"

/* global cy */

// This is a temporary solution -- some elements
// and views are inconsistent, so this just ensures
// everything is okay before continuing
const WAIT_FOR_CONSISTENCY = 4000;

const NUM_TOGGLES = 3;
const NUM_EXPORT_FIELDS = dataOptionsObjArr.length;
const NUM_EXPORTED_JOURNALS = 47;

// Toggle indices
const REDUCE_MOTION = 0;
const COLORBLIND_COLORS = 1;
const SKIP_WIR = 2;

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
        cy.contains("Welcome to baseline")
        cy.get("body").happoScreenshot()
        cy.get(".finish-button").should("exist").click()

        cy.contains("journaling is a skill").should("exist")
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
        cy.get(".react-joyride__tooltip").should("exist").should("contain.text", "rate")
        cy.get("body").happoScreenshot()
        cy.get("button[aria-label=Next]").should("exist").click()

        cy.get(".react-joyride__tooltip").should("exist").should("contain.text", "average")
        cy.get("body").happoScreenshot()
        cy.get("button[aria-label=Back]").should("exist").click()
        cy.get(".react-joyride__tooltip").should("exist").should("contain.text", "rate")
        cy.get("button[aria-label=Next]").should("exist").click()
        cy.get(".react-joyride__tooltip").should("exist").should("contain.text", "average")

        cy.contains("Above Average").should("exist").parents("ion-segment-button").click()
        cy.get(".segment-button-checked").should("exist").should("have.text", "Above Average")
        cy.get("ion-segment").happoScreenshot();
        cy.contains("Below Average").should("exist").parents("ion-segment-button").click()
        cy.get(".segment-button-checked").should("exist").should("have.text", "Below Average")
        cy.get("ion-segment").happoScreenshot()
        cy.get("button[aria-label=Next]").should("exist").click()

        cy.get(".react-joyride__tooltip").should("exist").should("contain.text", "done")
        cy.get("body").happoScreenshot()
        cy.get("button[aria-label=Close]").should("exist").click()

        cy.get("span.bold > div > div:first")
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: 200, clientY: 0, pageX: 200, pageY: 0, screenX: 200, screenY: 0 })
            .trigger('mouseup', { force: true })
    })

    it("Image Attachment", () => {
        cy.contains("3 left").should("exist")

        cy.get("input[type=file]").selectFile("cypress/fixtures/image.heic", { force: true })
        cy.contains("image.heic").should("exist")
        cy.contains("2 left").should("exist")

        cy.get("ion-icon.secondary-icon").click()
        cy.contains("3 left").should("exist")

        cy.get("input[type=file]").selectFile("cypress/fixtures/image.heic", { force: true })
        cy.contains("image.heic").should("exist")
        cy.contains("2 left").should("exist")

        cy.get("input[type=file]").selectFile("cypress/fixtures/image.png", { force: true })
        cy.contains("image.png").should("exist")
        cy.contains("1 left").should("exist")

        cy.get("input[type=file]").selectFile("cypress/fixtures/image.webp", { force: true })
        cy.contains("image.webp").should("exist")
        cy.contains("Attach A Photo").should("not.exist")
    })

    it("Submit Mood Log", () => {
        cy.contains("Done!").should("exist").click()
        cy.get(".loader").should("exist")
        cy.get("canvas").should("exist")
        cy.get("body").happoScreenshot()
        cy.url().should("include", "/summary")
        cy.get("textarea").should("not.exist")
    })

    it("Verify Mood Log on Summary", () => {
        cy.get(".dialog").should("exist")
        cy.get(".dialog").happoScreenshot()
        cy.contains("Close").click()
        cy.get(".dialog").should("not.exist")

        cy.contains("Hello world!").should("exist")
        cy.get("img").should("not.exist")
        cy.get("ion-icon.close-btn").should("have.length", 2).first().click()
        cy.get("img").should("exist")
        cy.get(".dot").should("have.length", 3)
        cy.get("ion-icon.close-btn").should("have.length", 2).first().click()
        cy.get("img").should("not.exist")
        
        cy.get(".sb-badge").contains("1").should("exist")
        
        // This is due to the segment button not resetting.
        // How does this happen? No idea.
        cy.wait(WAIT_FOR_CONSISTENCY)
    })

    it("Test Editing", () => {
        cy.wait(WAIT_FOR_CONSISTENCY)
        cy.get(".mood-edit-btn").should("exist").click()

        cy.url().should("include", "/journal")
        cy.contains("Editing saved journal").should("exist")
        cy.get("textarea").type("!!")
        cy.contains("Continue").should("exist").click()

        cy.url().should("include", "/journal/finish")
        cy.contains("Editing saved journal").should("exist")
        cy.contains("Edit!").should("exist").click()

        cy.contains("Hello world!!!").should("exist")
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

    it("Log a Few More Times and test FinishJournal Dialogs", () => {
        for (let i = 0; i < 12; ++i) {
            cy.get(".fab-button-close-active").should("exist").click()
            cy.contains("What's happening").should("exist")
            cy.get("textarea").should("exist").focus().clear().type(`Test ${i}`).should("have.value", `Test ${i}`)
            cy.contains("Continue").should("exist").click()

            if (i === 9) {
                cy.get(".dialog-background").should("exist").happoScreenshot()
                cy.contains("Before you continue")
                cy.contains("Sounds good").should("exist").click()
            }

            cy.get("span.bold > div > div:first")
                .trigger('mousedown', { which: 1 })
                .trigger('mousemove', { clientX: 200, clientY: 0, pageX: 200, pageY: 0, screenX: 200, screenY: 0 })
                .trigger('mouseup', { force: true })

            cy.contains("Done!").should("exist").click()
            cy.get("div.toastify").invoke("remove")
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

    it("Test Search and Filter", () => {
        cy.contains("Search").click()
        cy.get(".searchbar").type("Hello world")
        cy.get(".mood-card").should("have.length", 1)
        cy.get("#search-num-results").should("have.text", "1 entry")

        cy.get(".searchbar").clear().type("Nonsense")
        cy.contains("No Results").should("exist")
        cy.get("#search-num-results").should("have.text", "0 entries")
        
        cy.get(".searchbar").clear()
        cy.get("No Results").should("not.exist")
        cy.get("#search-num-results").should("have.text", "14 entries")
        cy.get(".image-btn").click()
        cy.contains("1 entry").should("exist")

        cy.get(".image-btn").click()
        cy.contains("1 entry").should("not.exist")

        cy.get(".top-corner").click()
        cy.contains("week has been looking").should("exist")
    })

    it("Add Music", () => {
        cy.get(".fab-button-close-active").should("exist").click()
        cy.contains("What's happening").should("exist")
        cy.get("textarea").should("exist").focus().type(`Add a song!`).should("have.value", `Add a song!`)
        cy.contains("Continue").should("exist").click()

        // Add song
        cy.get(".rss-content").should("not.exist")
        cy.contains("Add Music").click()
        cy.get(".rss-content").should("be.visible")
        cy.contains("Search for Music")
        cy.get(".rss-content").find("input").should("be.focused")
        cy.wait(WAIT_FOR_CONSISTENCY)
        cy.get("body").happoScreenshot()

        cy.get(".rss-content").find("input").type("False Alarms")
        cy.get(".spotify-search-loading").should("exist")

        cy.get(".spotify-track").should("exist")
        cy.get(".rss-content").find("input").clear({ force: true })
        cy.get(".spotify-track").should("not.exist")

        cy.get(".rss-content").find("input").type("False Alarms")
        cy.get(".spotify-track").should("exist")
        cy.get(".spotify-search-loading").should("not.exist")

        cy.get("body").happoScreenshot()
        cy.contains("Jon Bellion").click()
        cy.get(".rss-content").should("not.exist")

        // Edit song
        cy.contains("Add Music").should("not.exist")
        cy.contains("False Alarms").click()
        cy.get(".rss-content").should("be.visible")
        cy.get(".rss-header").find("ion-icon").click()
        cy.get(".rss-content").should("not.exist")
        cy.contains("False Alarms").should("exist")
        cy.wait(WAIT_FOR_CONSISTENCY)

        // Remove song
        cy.contains("False Alarms").find("ion-icon").click()
        cy.contains("False Alarms").should("not.exist")
        cy.contains("Add Music").click()

        // Add song again
        cy.get(".rss-content").find("input").type("False Alarms")
        cy.get(".spotify-search-loading").should("exist")
        cy.get(".spotify-search-loading").should("not.exist")

        cy.contains("Jon Bellion").click()
        cy.get(".rss-content").should("not.exist")
        cy.contains("False Alarms").should("exist")
        cy.wait(WAIT_FOR_CONSISTENCY)

        // Finish
        cy.contains("Done!").click()
        cy.url().should("include", "/summary")

        // Verify
        cy.contains("Add a song!").parent().find("iframe").should("not.exist")
        cy.contains("Add a song!").click()
        cy.contains("Add a song!").parent().find("iframe").should("exist")
    })

    it("Test Audio Journaling", () => {
        cy.get(".fab-button-close-active").should("exist").click()
        cy.contains("What's happening").should("exist")
        cy.contains("Switch to Audio Journal").click()

        cy.get(".toastify").should("not.exist")

        cy.contains("00:00").should("exist")
        cy.get(".rj-close").should("not.exist")
        cy.get("body").happoScreenshot()

        cy.contains("Record").click()
        cy.contains("Stop Recording").should("exist")
        cy.get("body").happoScreenshot()

        cy.wait(WAIT_FOR_CONSISTENCY)

        cy.contains("Stop Recording").click()
        cy.contains("Record").should("exist")
        
        cy.contains("00:00").should("not.exist")
        cy.get(".rj-close").click()
        cy.contains("00:00").should("exist")

        cy.contains("Record").click()
        cy.wait(WAIT_FOR_CONSISTENCY)
        cy.contains("Stop Recording").click()

        cy.contains("Continue").click()
        cy.contains("Done!").should("exist").click()
        cy.url().should("include", "/summary")
        cy.get(".audio-btn").should("exist")
    })

    it("Test -5 Warning Behavior", () => {
        cy.wait(WAIT_FOR_CONSISTENCY)
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

    it("Write Mood Log and test Autoscroll", () => {
        // Autoscroll
        cy.visit("/")
        cy.contains("What's happening").should("exist")
        cy.get("textarea").type("Hello desktop world!{enter}Multi-line journal{enter}Valid,ation")
        cy.get("body").happoScreenshot()
        cy.get("textarea").type("{enter}".repeat(40))
        cy.contains("Continue").should("be.visible")

        // Autofocus to end of text
        cy.visit("/")
        cy.contains("What's happening").should("exist")
        cy.contains("Continue").should("be.visible")
        cy.get("textarea").type("{backspace}".repeat(40))
        cy.contains("Continue").should("exist").click()
    })

    it("Finish Mood Log", () => {
        cy.get("svg").should("exist")
        cy.get("textarea").should("have.value", "Hello desktop world!\nMulti-line journal\nValid,ation")
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
    })

    it("Test Colorblind Mode", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.get("ion-toggle").should("have.length", NUM_TOGGLES)
        cy.contains("Skip").should("exist")
        cy.get(".settings-box-grid").eq(COLORBLIND_COLORS).happoScreenshot()
        cy.get("ion-toggle").eq(COLORBLIND_COLORS).should("not.have.class", "toggle-checked")
        cy.get("ion-toggle").eq(COLORBLIND_COLORS).click()
        cy.get("ion-toggle").eq(COLORBLIND_COLORS).should("have.class", "toggle-checked")
        cy.get(".settings-box-grid").eq(COLORBLIND_COLORS).happoScreenshot()

        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/summary")
    })

    it("Test Search and Filter", () => {
        cy.get("#search-num-results").should("have.text", "18 entries")
        cy.get(".image-btn").click()
        cy.get("#search-num-results").should("have.text", "1 entry")
        
        cy.get(".image-btn").click()
        cy.contains("1 entry").should("not.exist")
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
        cy.contains("Week In Review").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        
        cy.contains("Last Week").should("not.exist")

        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/summary")

        cy.visit("/lastreview")
        cy.url().should("contain", "/surveys")
        cy.get(".top-corner").should("have.length", 1).click()
        cy.url().should("include", "/summary")
    })

    it("Makes User Eligible (Week In Review, Gap Fund, Summary Log)", () => {
        const ldb = new Dexie('ldb')
        ldb.version(1).stores({
            logs: `&timestamp, year, month, day, time, zone, mood, journal, average`
        })
        
        let date = DateTime.now().minus({ days: 1 });
        for (let i = 0; i < 21; i++) {
            date = date.minus({ days: 1 })
            ldb.logs.add({
                timestamp: date.toMillis(),
                month: date.month,
                day: date.day,
                year: date.year,
                time: "1:00 CST",
                zone: "America/Chicago",
                average: "average",
                mood: 0,
                journal: "fake",
                files: []
            });
        }

        cy.get(".fab-button-close-active").click()
        cy.contains("What's happening").should("exist")
        cy.get(".top-corner").should("have.length", 1).click()
        cy.contains("Week In Review").should("exist")
        cy.get(".prompt-prompt").happoScreenshot()
    })

    it("Test Skip WIR", () => {
        cy.contains("Skip").should("not.exist")
        cy.contains("Later").click()
        cy.contains("Week In Review").should("not.be.visible")

        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.get("ion-toggle").should("have.length", NUM_TOGGLES)

        cy.contains("Skip").should("exist")
        cy.get(".settings-box-grid").eq(SKIP_WIR).happoScreenshot()
        cy.get("ion-toggle").eq(SKIP_WIR).should("not.have.class", "toggle-checked")
        cy.get("ion-toggle").eq(SKIP_WIR).click()
        cy.get("ion-toggle").eq(SKIP_WIR).should("have.class", "toggle-checked")
        cy.get(".settings-box-grid").eq(SKIP_WIR).happoScreenshot()

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

    it("Test WIR Results", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Week In Review").should("exist").click()
        cy.get("ion-menu").should("not.exist")

        cy.get("canvas").should("have.length.at.least", 2)
        cy.contains("baseline score").should("exist")

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

    it("Attempts Gap Fund Request", () => {
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Gap Fund").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.url().should("include", "gap")
        cy.wait(WAIT_FOR_CONSISTENCY).then(() => {
            if (Cypress.$("#gapFundClosed").length === 0) {
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
    
                cy.get("#method").should("be.enabled").type("method",  { force: true })
                cy.contains("Submit").click()
                cy.get(".toastify").should("have.length", 5)

                cy.get("#location").should("be.enabled").type("  ",  { force: true })
                cy.contains("Submit").click()
                cy.get(".toastify").should("have.length", 6)
    
                cy.get("#location").should("be.enabled").clear({ force: true }).type("location",  { force: true })
                cy.contains("Submit").click()
                cy.contains("match").should("exist")
    
                cy.get("#confirmEmail").should("be.enabled").type("hello@email.com",  { force: true })
                cy.contains("Submit").click()
                cy.contains("went wrong").should("exist")
            }
        })
    })
})

describe("Test Streaks", () => {
    it("Test Summary Logging", () => {
        cy.visit("/summary")
        cy.contains("Missed a day").click({ force: true })

        cy.url().should("include", "/journal")
        cy.contains("Summary journal for yesterday").should("exist")
        cy.get("textarea").type("Yesterday's journal")

        cy.contains("Continue").click()
        cy.contains("Done!").click()

        cy.url().should("include", "/summary")

        const moodCard = () => cy.contains("Yesterday's journal").parent(".mood-card");
        moodCard().should("exist")
        moodCard().find(".mood-edit-btn").should("exist")
        moodCard().contains("Summary").should("exist")

        cy.contains("Missed a day").should("not.exist")
    })

    it("Load Fake Data", () => {
        cy.visit("/settings")
        cy.contains("Add Local Fake Data").click({ force: true })
        cy.contains("Clear Journal Prompt").click({ force: true })
        cy.get(".toastify").should("have.length", 2)
    })

    it("Test Streak Dialog", () => {
        cy.visit("/summary")
        cy.get(".dialog").should("exist")
        cy.contains("30 days").should("exist")
        cy.get(".dialog").happoScreenshot()

        cy.contains("Close").click()
        cy.get(".dialog").should("not.exist")

        cy.get(".sb-badge").contains("30").should("exist")
    })
})


describe("Test My Data", () => {
    beforeEach(() => {
        cy.viewport("iphone-x")
    })

    it("Test Data Export", () => {
        cy.visit("/summary")
        cy.get(".fab-button-small").should("exist").click()
        cy.contains("My Data").should("exist").click()
        cy.get("ion-menu").should("not.exist")
        cy.contains("My Data").should("exist")
        cy.get("body").happoScreenshot()

        cy.get("#timestamp").should("have.class", "checkbox-checked")
        cy.contains("Export Journal Data as JSON").should("exist").click()
        cy.readFile("cypress/downloads/journal-data.json").then(json => {
            expect(json).to.have.length(NUM_EXPORTED_JOURNALS)
            for (let record of json) {
                expect(Object.keys(record)).to.have.length(NUM_EXPORT_FIELDS)
            }
        })
        cy.contains("Export Journal Data as CSV").should("exist").click()
        cy.readFile("cypress/downloads/journal-data.csv").then(csv => {
            const data = parse(csv, {columns: true});
            expect(data).to.have.length(NUM_EXPORTED_JOURNALS)
            for (let record of data) {
                expect(Object.keys(record)).to.have.length(NUM_EXPORT_FIELDS)
            }
        })

        cy.get("#timestamp").should("exist").click()
        cy.get("#timestamp").should("not.have.class", "checkbox-checked")
        cy.contains("Export Journal Data as JSON").should("exist").click()
        cy.wait(WAIT_FOR_CONSISTENCY)
        cy.readFile("cypress/downloads/journal-data.json").then(json => {
            expect(json).to.have.length(NUM_EXPORTED_JOURNALS)
            for (let record of json) {
                expect(Object.keys(record)).to.have.length(NUM_EXPORT_FIELDS - 1)
                expect(record).to.not.have.property("timestamp")
            }
        })
        cy.contains("Export Journal Data as CSV").should("exist").click()
        cy.wait(WAIT_FOR_CONSISTENCY)
        cy.readFile("cypress/downloads/journal-data.csv").then(csv => {
            const data = parse(csv, {columns: true});
            expect(data).to.have.length(NUM_EXPORTED_JOURNALS)
            for (let record of data) {
                expect(Object.keys(record)).to.have.length(NUM_EXPORT_FIELDS - 1)
                expect(record).to.not.have.property("timestamp")
            }
        })
    })

    it("Check Encryption Keys", () => {
        cy.contains("Visible Key").should("not.exist")
        cy.contains("Encrypted Key (Visible)").should("not.exist")
        cy.contains("Show Encryption Keys").should("exist").click()

        cy.contains("Visible Key").should("exist")
        cy.contains("Encrypted Key (Visible)").should("exist")
        cy.contains("Hide").should("exist").click()

        cy.contains("Visible Key").should("not.exist")
        cy.contains("Encrypted Key (Visible)").should("not.exist")
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
        cy.get("ion-toggle").should("have.length", NUM_TOGGLES)

        cy.contains("Reduce Motion").should("exist")
        cy.get(".settings-box-grid").eq(REDUCE_MOTION).happoScreenshot()
        cy.get("ion-toggle").eq(REDUCE_MOTION).should("not.have.class", "toggle-checked")
        cy.get("ion-toggle").eq(REDUCE_MOTION).click()
        cy.get("ion-toggle").eq(REDUCE_MOTION).should("have.class", "toggle-checked")
        cy.get(".settings-box-grid").eq(REDUCE_MOTION).happoScreenshot()

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
})

describe("Test Cleanup", () => {
    it("Start Deletion", () => {
        cy.visit("/summary")

        cy.get(".fab-button-small").should("exist").click()
        cy.contains("Settings").should("exist").click()
        cy.contains("Settings").should("exist")
        cy.contains("click here").click()
        cy.get("ion-alert").should("be.visible")
        cy.get("button").eq(0).click()
        cy.get("ion-alert").should("not.be.visible")
        cy.wait(WAIT_FOR_CONSISTENCY)

        cy.contains("click here").click()
        cy.get("ion-alert").should("be.visible")
        cy.get("button").eq(1).click()
        cy.get("ion-alert").should("not.exist")
        
        cy.contains("Google").should("exist")
        cy.contains("delete").should("exist")
        cy.get(".toastify").should("exist")
    })
})