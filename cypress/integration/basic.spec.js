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
        cy.contains("test log").should("exist")
        cy.contains("no more logs").should("exist")
    })

    it("Log a Few More Times", () => {
        for (let i = 0; i < 5; ++i) {
            cy.get(".fab-button-close-active").should("exist").click()
            cy.wait(500)
            cy.get(".native-textarea").should("exist").type(`Test ${i}`)
            cy.contains("Continue").should("exist").click()
            cy.wait(500)
            cy.contains("Done!").should("exist").click()
            cy.wait(500)
            cy.url().should("include", "/summary")
        }
    })

    it("Tests Scroll", () => {
        cy.wait(1000);
        cy.get("#moodLogList").scrollTo(0, 500, { ensureScrollable: false, duration: 1000 })
        cy.get("#moodLogList").scrollTo(0, 0, { ensureScrollable: false, duration: 1000 })
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
        cy.contains("test desktop log").should("exist")
        cy.contains("no more logs").should("exist")
        cy.get(".calendar-card").first().within(el => {
            el.click()
            cy.get(".less-highlight-day").should("not.exist")
        })
        cy.get("#moodLogList").scrollTo(0, 500, { ensureScrollable: false, duration: 1000 })
        cy.get("#moodLogList").scrollTo(0, 0, { ensureScrollable: false, duration: 1000 })
    })
})