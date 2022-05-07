import history from "../../history";

const Negative5 = () => {
    return (<>
        <div className="title">
            Hi there.
        </div>
        <p className="text-center">We know things probably seem pretty bad right now. We wanted to take a minute to offer you some hope and support. If you can, 
            take a minute to breathe, and read through this. We're here for you.</p>
        <p className="text-center">When you're going through hard times, it's important to talk to someone about how you feel. Mood logging is already a great start. If you have 
            someone in your life that you trust and can talk with about what's happening, reach out to them. We know it's hard, but it's almost always worth it.
            If what you're going through involves those people, you can also talk with someone on a site like <a target="_blank" rel="noreferrer" href="https://7cups.com">7 Cups</a>, 
            a free and confidential emotional support community with trained listeners.</p>
        <p className="text-center">If you're currently in crisis, you should seek support as soon as you can. Here are some resources:</p>
        <p className="text-center">National Suicide Prevention Lifeline: <br /><a href="tel:988" target="_blank" rel="noreferrer">Call</a> or <a href="sms:988" target="_blank" rel="noreferrer">Text</a> 988, or <a target="_blank" rel="noreferrer" href="https://suicidepreventionlifeline.org/chat/">Online Chat</a></p>
        <p className="text-center">Trevor Line for LGBTQ+ Youth: <br /><a href="tel:1-866-488-7386" target="_blank" rel="noreferrer">Call</a> or <a href="sms:678678" target="_blank" rel="noreferrer">Text</a>, or <a href="https://trevorproject.secure.force.com/apex/TrevorChatPreChatForm" target="_blank" rel="noreferrer">Online Chat</a></p>
        <p className="text-center"><a href="https://www.apa.org/topics/crisis-hotlines" target="_blank" rel="noreferrer">Other Specialized Hotlines (drugs/assault/abuse/etc.)</a></p>
        <p className="text-center">We also can't recommend therapy enough as a way to process your feelings and find solutions to problems in your life. If you have health insurance, you can likely get therapy cheaply. 
            Check with your insurance provider, and <a href="https://www.apa.org/topics/crisis-hotlines" target="_blank" rel="noreferrer">search for specialists here!</a> If you don't have insurance or aren't sure how to find a covered therapist (or if you need help finding any other resources!), 
            email us at <a href="mailto:findhelp@domain" target="_blank" rel="noreferrer">findhelp@domain</a> &mdash; we're happy to help.
        </p>
        <p className="text-center">If you're struggling with money and it's hurting your mental health, you can apply for financial assistance from the baseline Gap Fund.
            The gap fund exists to help you "fill in the gaps" in your financial situation, and can be used for pretty much anything, including therapy, medication, transportation, basic necessities like food and shelter, and more.&nbsp;
            <span className="fake-link" onClick={() => {history.push("/gap")}}>You can apply now by clicking here, or later from the menu on the summary page.</span>
        </p>
    </>)
};

export default Negative5;