import { FIND_HELP, GAP_FUND, TALK_TO_SOMEONE, HOTLINES } from "../data";

const Help = () => {
    return (<>
        <p className="text-center margin-bottom-0">When you're going through hard times, it's important to talk to someone about how you feel. { TALK_TO_SOMEONE }</p>
        <p className="text-center margin-bottom-0">If you're currently in crisis, you should seek support as soon as you can. Here are some resources:</p>
        { HOTLINES }
        <p className="text-center margin-bottom-0">We also can't recommend therapy enough as a way to process your feelings and find solutions to problems in your life. 
            <a href="https://findtreatment.samhsa.gov/" target="_blank" rel="noreferrer">Search for treatment providers here!</a> { FIND_HELP }
        </p>
        <p className="text-center margin-bottom-0">
            If you're struggling with money and it's hurting your mental health, you can apply for financial assistance from the baseline Gap Fund. { GAP_FUND }
        </p>
    </>);
};

export default Help;