import DASSGraph from "../components/graphs/DASSGraph";
import { generateScreenerRanges, normalizeRange } from "./helpers";
import Screener, { Priority } from "./screener"

export default function DASS(): Screener {
    
    let labels = ["normal", "mild", "moderate", "severe", "extremely severe"];
    const ranges = {
        d: [5, 2, 4, 3, 8],
        a: [4, 2, 2, 2, 12],
        s: [8, 2, 3, 4, 5]
    };

    const dRange = generateScreenerRanges(ranges["d"], labels);
    const aRange = generateScreenerRanges(ranges["a"], labels);
    const sRange = generateScreenerRanges(ranges["s"], labels);

    const getProblemFlag = function(results: any) {
        let d = dRange[results.d];
        let a = aRange[results.a];
        let s = sRange[results.s];
        const bad = ["severe", "extremely severe"];
        return (bad.includes(d) || bad.includes(a) || bad.includes(s));
    };

    return {
        _key: "dassv1",
        _currentQuestion: 0,
        _clinicalName: "DASS-21",
        _questions: [
            {
                question: "Over the past week, I found it hard to wind down",
                affects: "s"
            },
            {
                question: "Over the past week, I was aware of dryness of my mouth",
                affects: "a"
            },
            {
                question: "Over the past week, I couldn't seem to experience any positive feeling at all",
                affects: "d"
            },
            {
                question: "Over the past week, I experienced breathing difficulty (e.g., excessively rapid breathing, breathlessness in the absence of physical exertion)",
                affects: "a"
            },
            {
                question: "Over the past week, I found it difficult to work up the initiative to do things",
                affects: "d"
            },
            {
                question: "Over the past week, I tended to over-react to situations",
                affects: "s"
            },
            {
                question: "Over the past week, I experienced trembling (e.g., in the hands)",
                affects: "a"
            },
            {
                question: "Over the past week, I felt that I was using a lot of nervous energy",
                affects: "s"
            },
            {
                question: "Over the past week, I was worried about situations in which I might panic and make a fool of myself",
                affects: "a"
            },
            {
                question: "Over the past week, I felt that I had nothing to look forward to",
                affects: "d"
            },
            {
                question: "Over the past week, I found myself getting agitated",
                affects: "s"
            },
            {
                question: "Over the past week, I found it difficult to relax",
                affects: "s"
            },
            {
                question: "Over the past week, I felt down-hearted and blue",
                affects: "d"
            },
            {
                question: "Over the past week, I was intolerant of anything that kept me from getting on with what I was doing",
                affects: "s"
            },
            {
                question: "Over the past week, I felt I was close to panic",
                affects: "a"
            },
            {
                question: "Over the past week, I was unable to become enthusiastic about anything",
                affects: "d"
            },
            {
                question: "Over the past week, I felt I wasn't worth much as a person",
                affects: "d"
            },
            {
                question: "Over the past week, I felt that I was rather touchy",
                affects: "s"
            },
            {
                question: "Over the past week, I was aware of the action of my heart in the absence of physical exertion (e.g., sense of heart rate increase, heart missing a beat)",
                affects: "a"
            },
            {
                question: "Over the past week, I felt scared without any good reason",
                affects: "a"
            },
            {
                question: "Over the past week, I felt that life was meaningless",
                affects: "d"
            }
        ],
        _results: {
            d: 0,
            a: 0,
            s: 0
        },
        nextQuestion: function(answer) {
            let previousState = undefined;
            if (answer !== undefined) {
                previousState = JSON.parse(JSON.stringify(this));
                this._results[this._questions[this._currentQuestion].affects] += answer;
                this._currentQuestion += 1;
            }

            if (this._currentQuestion >= this._questions.length) return { _results: this._results, done: true };

            return {
                previousState,
                _currentQuestion: this._currentQuestion,
                _results: this._results,
                progress: `Question ${this._currentQuestion + 1}/${this._questions.length}`,
                question: this._questions[this._currentQuestion].question,
                answers: [{
                    answer: "Never",
                    value: 0
                }, {
                    answer: "Sometimes",
                    value: 1
                }, {
                    answer: "Often",
                    value: 2
                }, {
                    answer: "Almost Always",
                    value: 3
                }]
            };
        },
        getRecommendation: function() {
            let d = dRange[this._results.d];
            let a = aRange[this._results.a];
            let s = sRange[this._results.s];
            const problemFlag = getProblemFlag(this._results);
            
            return <>
                <p>Compared to the average person, you are experiencing <b>{ d }</b> levels of 
                    depression, <b>{ a }</b> levels of anxiety, and <b>{ s }</b> levels of stress.
                </p>
                <p>Take a moment to reflect on your results, especially if they've changed from before. (All three metrics 
                    on the graph are on separate scales, so we don't recommend comparing them to each other.) If your results 
                    have gotten worse, has anything happened in the past few weeks that might've led to that? For example, have 
                    any of your routines changed, or has some major event taken place in your life? And if so, is there anything 
                    you can do to help yourself mitigate the impacts of those changes?
                </p>
                <p>At the same time, if your results have gotten better, what might've changed in your life to make that happen &mdash; and 
                    are there any steps you can take to sustain those changes and keep moving in that direction?
                </p>
                { problemFlag && <p>We understand your results today might be distressing or scary. If you can, take a minute to consider 
                    why your results are the way they are. Is there anything you can do to help move them in a better direction? 
                    And if your results have been consistently severe over time, we recommend reaching out to others for 
                    support and seeking professional help. We know this might seem like a big step, but we promise it's worth it. 
                    Take a minute to read the help resources in the main menu for more detailed guidance.
                </p> }
            </>;
        },
        getClinicalInformation: function() {
            return `DASS-21 (doi: 10.1348/014466505X29657) raw scores: d=${this._results.d}, a=${this._results.a}, s=${this._results.s}. Raw scores for each question are not scaled (0 - 3). Standard DASS cutoffs used.`;
        },
        getPriority: function() {
            return getProblemFlag(this._results) ? Priority.HIGH : Priority.LOW;
        },
        processDataForGraph: function(data) {
            let ret = [];
            for (let key in data) {
                if (data[key]["key"] !== this._key) continue;
                let d = normalizeRange(data[key]["results"]["d"], ranges["d"]);
                let a = normalizeRange(data[key]["results"]["a"], ranges["a"]);
                let s = normalizeRange(data[key]["results"]["s"], ranges["s"]);

                if (d === a || d === s) {
                    d += 0.03;
                }

                if (s === a || s === d) {
                    s -= 0.03;
                }

                ret.push({
                    timestamp: Number(key),
                    d,
                    a,
                    s
                });
            }

            return ret;
        },
        graph: DASSGraph
    }
}