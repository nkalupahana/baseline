import Negative5 from "../../src/components/Journal/Negative5"
import DASS from "../../src/screeners/dass"
import CAGE_AID from "../../src/screeners/cage_aid"
import HARM from "../../src/screeners/harm"
import EDE_QS from "../../src/screeners/ede_qs"
import SPF from "../../src/screeners/spf"

describe("Display health-related components", () => {
    beforeEach(() => {
        cy.viewport("macbook-13")
    })

    it("Negative 5", () => {
        cy.mount(<Negative5 />)
        cy.get("body").happoScreenshot()
    })

    it("DASS", () => {
        let dass = DASS();
        dass._results = {
            d: 15,
            a: 0,
            s: 0
        };
        cy.mount(<>
            { dass.getRecommendation() }
            { dass.getClinicalInformation() }
            <p>Priority: { dass.getPriority() }</p>
        </>)
        cy.get("body").happoScreenshot()
    })

    it("CAGE-AID None", () => {
        let cage = CAGE_AID();
        cy.mount(<>
            { cage.getRecommendation() }
            { cage.getClinicalInformation() }
            <p>Priority: { cage.getPriority() }</p>
        </>)
        cy.get("body").happoScreenshot()
    })

    it("CAGE-AID Issue", () => {
        let cage = CAGE_AID();
        cage._results = 2;
        cy.mount(<>
            { cage.getRecommendation() }
            { cage.getClinicalInformation() }
            <p>Priority: { cage.getPriority() }</p>
        </>)
        cy.get("body").happoScreenshot()
    })

    it("HARM None", () => {
        let harm = HARM();
        cy.mount(<>
            { harm.getRecommendation() }
            { harm.getClinicalInformation() }
            <p>Priority: { harm.getPriority() }</p>
        </>)
        cy.get("body").happoScreenshot()
    })

    it("HARM Self-Harm", () => {
        let harm = HARM();
        harm._results = [1, 0, 0];
        cy.mount(<>
            { harm.getRecommendation() }
            { harm.getClinicalInformation() }
            <p>Priority: { harm.getPriority() }</p>
        </>)
        cy.get("body").happoScreenshot()
    })

    it("HARM Non-Acute", () => {
        let harm = HARM();
        harm._results = [1, 1, 0];
        cy.mount(<>
            { harm.getRecommendation() }
            { harm.getClinicalInformation() }
            <p>Priority: { harm.getPriority() }</p>
        </>)
        cy.get("body").happoScreenshot()
    })

    it("HARM Acute", () => {
        let harm = HARM();
        harm._results = [1, 1, 1];
        cy.mount(<>
            { harm.getRecommendation() }
            { harm.getClinicalInformation() }
            <p>Priority: { harm.getPriority() }</p>
        </>)
        cy.get("body").happoScreenshot()
    })

    it("EDE_QS None", () => {
        let ede = EDE_QS();
        cy.mount(<>
            { ede.getRecommendation() }
            { ede.getClinicalInformation() }
            <p>Priority: { ede.getPriority() }</p>
        </>)
        cy.get("body").happoScreenshot()
    })

    it("EDE_QS Issue", () => {
        let ede = EDE_QS();
        ede._results = 15;
        cy.mount(<>
            { ede.getRecommendation() }
            { ede.getClinicalInformation() }
            <p>Priority: { ede.getPriority() }</p>
        </>)
        cy.get("body").happoScreenshot()
    })

    it("SPF High", () => {
        let spf = SPF();
        cy.mount(<>
            { spf.getRecommendation() }
            { spf.getClinicalInformation() }
            <p>Priority: { spf.getPriority() }</p>
        </>)
        cy.get("body").happoScreenshot()
    })

    it("SPF Medium", () => {
        let spf = SPF();
        spf._results = {
            "Social-Interpersonal": 20,
            "Cognitive-Individual": 20
        };
        cy.mount(<>
            { spf.getRecommendation() }
            { spf.getClinicalInformation() }
            <p>Priority: { spf.getPriority() }</p>
        </>)
        cy.get("body").happoScreenshot()
    })
})