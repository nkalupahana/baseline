import { GAP_FUND_REFER } from "../data";
import Screener, { Answer, Priority } from "./screener";

interface WASTScreener extends Screener {
    _answers?: Answer[][];
}

export default function WAST(): WASTScreener {
    return {
        _key: "wastv1",
        _currentQuestion: 0,
        _clinicalName: "Women Abuse Screening Tool",
        _questions: [
            "Are you in or currently entering a romantic relationship?",
            "In general, how would you describe your relationship?",
            "Do you and your partner work out arguments with:",
            "Do arguments ever result in you feeling down or bad about yourself?",
            "Do you ever feel frightened by what your partner says or does?",
            "Do arguments ever result in hitting, kicking, or pushing?",
            "Has your partner ever abused you physically?",
            "Has your partner ever abused you emotionally?",
            "Has your partner ever abused you sexually?"
        ],
        _results: 0,
        _answers: [
            [
                {
                    answer: "No",
                    value: 0
                },
                {
                    answer: "Yes",
                    value: 1
                },
            ],
            [
                {
                    answer: "No tension",
                    value: 1
                },
                {
                    answer: "Some tension",
                    value: 2
                },
                {
                    answer: "A lot of tension",
                    value: 3
                }
            ],
            [
                {
                    answer: "No difficulty",
                    value: 1
                },
                {
                    answer: "Some difficulty",
                    value: 2
                },
                {
                    answer: "Great difficulty",
                    value: 3
                }
            ],
            [
                {
                    answer: "Never",
                    value: 1
                },
                {
                    answer: "Sometimes",
                    value: 2
                },
                {
                    answer: "Often",
                    value: 3
                }
            ]
        ],
        nextQuestion: function(answer) {
            let previousState = undefined;
            if (answer !== undefined) {
                previousState = JSON.parse(JSON.stringify(this));
                if (this._currentQuestion === 0) {
                    if (answer === 0) {
                        return { _results: this._results, done: true };
                    }
                } else {
                    this._results += answer;
                }
                ++this._currentQuestion;
            }

            if (this._currentQuestion >= this._questions.length) return { _results: this._results, done: true };

            return {
                previousState,
                _currentQuestion: this._currentQuestion,
                _results: this._results,
                progress: `Question ${this._currentQuestion + 1}/${this._questions.length}`,
                question: this._questions[this._currentQuestion],
                answers: this._answers![this._currentQuestion >= 3 ? 3 : this._currentQuestion]
            };
        },
        getRecommendation: function() {
            if (this._results >= 12) {
                return <>
                    <p>
                        About your last survey: it sounds like you're in an abusive relationship.
                    </p>
                    <p>
                        First, we want you to remember that you have the right to be safe, and the right
                        to be treated with respect. You are not to blame for this, and you deserve a safe 
                        and happy life.
                    </p>
                    <p>
                        Abusive relationships aren't salvageable, and by staying in them or trying to "fix"
                        the abuser, the abuser's behavior is further reinforced. You deserve better. 
                        We urge you to try to get out of this relationship. 
                    </p>
                    <p>
                        That being said, we understand that it's always harder than "just leaving". 
                        As a first step, we recommend confiding in someone you trust about what's going on.
                        Talking to others is a good way to sort out your feelings and get immediate help.
                        If you need additional help, advice, or a second opinion for getting out of your 
                        relationship, you should also reach out to one of these hotlines:
                    </p>
                    <p className="text-center margin-bottom-0">National Domestic Violence Hotline<br /><a href="tel:18007997233">Call</a>, <a href="sms:88788?&body=START">Text START to 88788</a>, or <a target="_blank" rel="noreferrer" href="https://www.thehotline.org/">Online Chat</a></p>
                    <p className="text-center margin-bottom-0">love is respect (for teens & young adults)<br /><a href="tel:18663319474">Call</a>, <a href="sms:22522?&body=LOVEIS">Text LOVEIS to 22522</a>, or <a target="_blank" rel="noreferrer" href="https://www.loveisrespect.org/">Online Chat</a></p>
                    <p>
                        If you need any financial assistance at all to get help or get out, the baseline Gap Fund can help. { GAP_FUND_REFER }
                    </p>
                    <p>
                        Finally, please know that you are not alone. We know how hard this can be. 
                        You deserve to be treated with love and respect.
                    </p>
                </>;
            }

            return <p>This should never appear.</p>
        },
        getClinicalInformation: function() {
            return `WAST raw score: ${this._results}. Raw scores from 1 - 3. Validated for both men and women (doi:10.1177/1077801217731542). Cutoff = 12 (validated, between referenced paper and WAST author cutoff).`;
        },
        getPriority: function() {
            if (this._results >= 12) {
                return Priority.CRITICAL;
            }

            return Priority.DO_NOT_SHOW;
        }
    }
}
