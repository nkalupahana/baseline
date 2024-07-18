import { DateTime } from "luxon";
import history from "./history"

export const TALK_TO_SOMEONE = <>
    Mood logging is already a great start. If you have 
    someone in your life that you trust and can talk with about what's happening, reach out to them. 
    We know it's hard, but it's almost always worth it. If what you're going through involves those people, 
    you can also talk with someone on a site like <a target="_blank" rel="noreferrer" href="https://7cups.com">7 Cups</a>, 
    a free and confidential emotional support community with trained listeners.
</>;

export const GAP_FUND_LINK = <span className="fake-link" onClick={() => {history.push("/gap")}}>You can apply now by clicking here, or later from the menu on the summary page.</span>;
export const GAP_FUND_REFER = <>You can apply at any time from the main menu.</>

export const GAP_FUND = <>
    The gap fund exists to help you "fill in the gaps" in your financial situation, and can be used for pretty much anything, 
    including therapy, medication, transportation, basic necessities like food and shelter, and 
    more.
</>;

export const FIND_HELP = <>
    You can also check with your insurance provider to see what professionals you're covered for. 
    If you need help finding someone you're covered for, or if you don't have insurance, we're happy to help &mdash; just
    email us at <a href="mailto:findhelp@getbaseline.app" target="_blank" rel="noreferrer">findhelp@getbaseline.app</a>.
</>;

export const HOTLINES = <>
    <p className="text-center margin-bottom-0">Crisis Text Line<br /><a href="sms:741741?&body=HOME">Text HOME to 741741</a></p>
    <p className="text-center margin-bottom-0">National Suicide Prevention Lifeline<br /><a href="tel:988">Call</a> or <a href="sms:988">Text</a> 988, or <a target="_blank" rel="noreferrer" href="https://988lifeline.org/chat/">Online Chat</a></p>
    <p className="text-center margin-bottom-0">Trevor Line for LGBTQ+ Youth<br /><a href="tel:1-866-488-7386">Call</a> or <a href="sms:678678">Text</a>, or <a href="https://trevorproject.secure.force.com/apex/TrevorChatPreChatForm" target="_blank" rel="noreferrer">Online Chat</a></p>
    <p className="text-center margin-bottom-0"><a href="https://www.apa.org/topics/crisis-hotlines" target="_blank" rel="noreferrer">Other Specialized Hotlines (drugs/assault/abuse/etc.)</a></p>
</>;

export const RESILIENCE_EXP = <>
    Resilience is a measure of how well you can cope mentally and emotionally 
    with a crisis, and how quickly you can move on from it without suffering 
    longer-term consequences. It's an important metric to keep track of &mdash; if 
    you're low on it, stress could have a much bigger impact on you than it would normally.
</>;

export const YESTERDAY_BACKLOG = () => {
    return <div className="text-center" key="yesterday1">
        <p className="fake-link" style={{textDecoration: "underline"}} onClick={() => {
            localStorage.setItem("addFlag", "summary:" + DateTime.now().minus({ days: 1 }).toISODate());
            history.push("/journal");
        }}>Missed a day? Keep your journaling streak going! Click here to add a 
            journal entry summarizing what happened to you yesterday.
        </p>
    </div>
};