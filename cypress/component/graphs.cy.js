import DASSGraph from "../../src/components/graphs/DASSGraph";
import useGraphConfig from "../../src/components/graphs/useGraphConfig";
import "../../src/theme/variables.css";
import "../../src/components/Journal/JournalComponents.css";
import { DateTime } from "luxon";

const DASSGraphContainer = ({ data }) => {
    const { now, xZoomDomain, setXZoomDomain, zoomTo, pageWidthRef, pageWidth, tickCount, memoTickFormatter } = useGraphConfig();

    return (
        <div ref={pageWidthRef} style={{ backgroundColor: "var(--ion-background-color)" }}>
            <DASSGraph
                xZoomDomain={xZoomDomain}
                setXZoomDomain={setXZoomDomain}
                data={data}
                now={now}
                pageWidth={pageWidth}
                tickCount={tickCount}
                tickFormatter={memoTickFormatter}
                zoomTo={zoomTo}
            />
        </div>
    );
};

function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const now = DateTime.now().toMillis();
const week = now - DateTime.now().minus({ days: 7 }).toMillis();
const NUM_POINTS = 29;
let dassData = [];
describe("DASS", () => {
    before(() => {
        const rand = mulberry32(293432490);
        dassData = [{ timestamp: now, d: 1, a: 0.5, s: 0.5 }];
        for (let j = 0; j < NUM_POINTS; j++) {
            dassData.unshift({ timestamp: now - ((j + 1) * week), d: rand() * 4, a: rand() * 4, s: rand() * 4 });
        }
    });

    beforeEach(() => {
        cy.viewport("macbook-13");
    });

    it("One to 30 Points", () => {
        for (let i = NUM_POINTS; i >= 0; i--) {
            const dataSlice = dassData.slice(i);
            cy.mount(<DASSGraphContainer data={dataSlice} />);
        }
    });
});
