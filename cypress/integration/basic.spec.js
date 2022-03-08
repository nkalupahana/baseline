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

        cy.get('body').happoScreenshot()

        cy.contains("Anonymous").should("exist")
        cy.contains("Google").should("exist")
    })

    it("Login as Anonymous", () => {
        cy.contains("Anonymous").click()
        cy.contains("What's happening").should("exist")
        cy.get('body').happoScreenshot()
    })

    it("Check Mobile Summary Page", () => {
        cy.get(".top-corner").click()
        cy.contains("week").should("exist")
        cy.contains("first mood log").should("exist")
        cy.get(".mood-card").should("not.exist")
        cy.get('body').happoScreenshot()
    })

    it("Write Mood Log", () => {
        cy.get(".fab-button-close-active").click()
        cy.contains("What's happening").should("exist")
        cy.get(".native-textarea").type("Hello world!")
        cy.get('body').happoScreenshot()
        cy.contains("Continue").should("exist").click()
    })

    it("Finish Mood Log", () => {
        cy.get("svg").should("exist")
        cy.get(".native-textarea").should("have.value", "Hello world!")
        cy.get(".segment-button-checked").should("exist").should("have.text", "Average")
        cy.get('body').happoScreenshot()

        cy.contains("Above Average").should("exist").parents("ion-segment-button").click()
        cy.get(".segment-button-checked").should("exist").should("have.text", "Above Average")
        cy.get('ion-segment').happoScreenshot();
        cy.contains("Below Average").should("exist").parents("ion-segment-button").click()
        cy.get(".segment-button-checked").should("exist").should("have.text", "Below Average")
        cy.get('ion-segment').happoScreenshot()

        cy.contains("Done!").should("exist").click()
        cy.get(".loader").should("exist")
        cy.url().should("include", "/summary")
    })

    it("Verify Mood Log on Summary", () => {
        cy.contains("Hello world!").should("exist")
        cy.contains("no more logs").should("exist")
    })
})