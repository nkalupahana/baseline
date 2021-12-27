describe("Mobile Flow", () => {
    beforeEach(() => {
        cy.viewport("iphone-x")
    })

    it("Load Main Page", () => {
        cy.visit("/")
        if (cy.contains("What's happening")) {
            cy.contains("What's happening").click()
        }

        cy.contains("Anonymous").should("exist")
        cy.contains("Google").should("exist")
    })

    it("Login as Anonymous", () => {
        cy.contains("Anonymous").click()
        expect(cy.contains("What's happening")).to.exist
    })

    it("Check Mobile Datapage", () => {
        cy.get(".top-corner").click()
        cy.contains("week").should("exist")
        cy.contains("no more logs").should("exist")
        cy.get(".mood-card").should("not.exist")
    })

    it("Write Mood Log", () => {
        cy.get(".fab-button-close-active").click()
        cy.contains("What's happening").should("exist")
        cy.get(".native-textarea").type("Hello world!")
        cy.contains("Continue").should("exist").click()
    })

    it("Finish Mood Log", () => {
        cy.get("svg").should("exist")
        cy.get(".native-textarea").should("have.value", "Hello world!")
        cy.get(".segment-button-checked").should("exist").should("have.text", "Average")

        cy.contains("Above Average").should("exist").parents("ion-segment-button").click()
        cy.get(".segment-button-checked").should("exist").should("have.text", "Above Average")
        cy.contains("Below Average").should("exist").parents("ion-segment-button").click()
        cy.get(".segment-button-checked").should("exist").should("have.text", "Below Average")

        cy.contains("Done!").should("exist").click()
        cy.get(".loader").should("exist")
        cy.url().should("include", "/summary")
    })

    it("Verify Mood Log on Summary", () => {
        cy.contains("Hello world!").should("exist")
    })
})