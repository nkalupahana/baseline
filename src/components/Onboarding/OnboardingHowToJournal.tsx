import { Capacitor } from "@capacitor/core";
import { set, ref } from "firebase/database";
import { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { Pagination } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { db } from "../../firebase";
import history from "../../history";
import StaticMoodLogCard, { SimpleLog } from "../Summary/StaticMoodLogCard";
import { FirebaseAnalytics } from "@capacitor-firebase/analytics";

const good: SimpleLog[] = [
    {
        journal: "I'm doing okay. Went to the grocery store and got some stuff done around the house. Going to the store always stresses me out, and I'm not really sure why. Maybe because there’s so many choices and I feel like I just have to get out of there. At any rate, I'm sure I can keep working on it, and relaxing at home makes it feel better.",
        time: "3:22 PM",
        average: "average",
        mood: 0
    },
    {
        journal: "having a good day! things are going well at work, fixed the underreporting issue on our sales app that ive been working on for the last week. and i finally got to catch up with lucia! things are going well.",
        time: "12:01 PM",
        average: "average",
        mood: 2
    },
    {
        journal: "I'm really worried about my friend. She's in a really bad place right now, and she keeps making really questionable decisions. I wish she would see what she's doing, but it's just not happening, and I can feel it bringing me down with her. I would disengage, but I want her to do better, and I really care about her. Maybe I could go somewhere with her and talk to her? Or maybe she just needs an intervention.\n\nYou know what, I'll talk to Mike about what I should do tonight. He always has good advice.",
        time: "9:41 PM",
        average: "below",
        mood: -1
    }
]

const bad: SimpleLog[] = [
    {
        journal: "Doing good! Planning on going out tonight.",
        time: "8:11 PM",
        average: "above",
        mood: 2
    },
    {
        journal: "i can't believe it. this is awful spiraling so much right now i can't think about anything else at all",
        time: "11:11 PM",
        average: "below",
        mood: -3
    },
    {
        journal: "What is going on?? I hate dealing with this guy.",
        time: "11:33 AM",
        average: "below",
        mood: -2
    }
];

const generateNumber = (num: number) => {
    return <><svg width="40" height="40" style={{"verticalAlign": "middle"}}>
        <circle cx="20" cy="20" r="18" stroke="var(--background-color-inverted)" strokeWidth="2" fill="var(--background-color-inverted)" />
        <text fill="var(--ion-background-color)" x="50%" y="66%" textAnchor="middle" fontSize="20">{ num }</text>
    </svg>&nbsp;</>
}

enum Screens {
    INTRO,
    STEPS,
    GOOD,
    BAD,
    OUTRO
}

const OnboardingHowToJournal = ({ user } : { user: User }) => {
    const [submitting, setSubmitting] = useState(false);
    const [screen, setScreen] = useState(Screens.INTRO);
    const onboarding = localStorage.getItem("onboarding");

    useEffect(() => {
        if (!user || !submitting) return;
        (async () => {
            await set(ref(db, `${user.uid}/onboarding/onboarded`), true);
            if (Capacitor.getPlatform() !== "web") await FirebaseAnalytics.logEvent({ name: "onboard_complete" });
            localStorage.removeItem("onboarding");
            history.replace("/journal");
        })();
    }, [user, submitting]);

    return <>
            { (![Screens.GOOD, Screens.BAD].includes(screen)) && <div style={{"height": "5vh"}}></div> }
            { screen === Screens.INTRO && <>
                { Capacitor.getPlatform() === "web" && <p className="onboard-text margin-bottom-0">First, let's talk about what good journaling looks like.</p> }
                { Capacitor.getPlatform() !== "web" && <p className="onboard-text margin-bottom-0">Last thing! Let's talk about what good journaling looks like.</p> }
                <p className="onboard-text margin-bottom-0">
                    baseline is a bit different from "daily" journals. It's specifically designed to 
                    capture how you're feeling <b>in the moment, a few times a day.</b>
                </p>
                <p className="onboard-text margin-bottom-24">
                    This might be the first time you've tried something like this, 
                    but don't worry &mdash; journaling is a skill, just like anything else, 
                    and there's no one right way to do it.
                </p>
                <div className="finish-button onboarding-button" onClick={() => setScreen(Screens.STEPS)}>Okay!</div>
                { onboarding ? <p>step 3 of 5</p> : <div className="br"></div> }
            </> }
            { screen === Screens.STEPS && <>
                <p className="onboard-text margin-bottom-0" style={{"textAlign": "left"}}>Every journal entry you write should aim to capture three things:</p>
                <div className="align-box">
                    <p className="onboard-text margin-bottom-0 indent-number">{ generateNumber(1) } What have you been doing?</p>
                    <p className="onboard-text margin-bottom-0 indent-number">{ generateNumber(2) } How have you been feeling?</p>
                    <p className="onboard-text indent-number">{ generateNumber(3) } Why might you be feeling that way?</p>
                </div>
                <p className="onboard-text">
                    It might be tempting to just write a sentence and be done. But trust us,
                    writing with these questions in mind isn't much harder, and it's so much more rewarding.
                </p>
                <div className="finish-button onboarding-button" onClick={() => setScreen(Screens.GOOD)}>Makes sense.</div>
                { onboarding ? <p>step 3 of 5</p> : <div className="br"></div> }
            </> }
            { screen === Screens.GOOD && <>
                <p className="onboard-text">Here are some examples of good entries:</p>
                <Swiper
                    modules={[Pagination]}
                    className="onboarding-swiper"
                    navigation={true}
                    pagination={true}
                    autoHeight={true}
                    loop={true}
                >
                    { good.map(log => <SwiperSlide key={log.journal}>
                        <StaticMoodLogCard log={log} />
                        <div style={{"height": "30px"}}></div>
                    </SwiperSlide>) }
                </Swiper>
                <p className="onboard-text">
                    Every entry covers what the person's been doing, how that made them feel, 
                    and some deeper reflection as needed.
                </p>
                <div className="finish-button onboarding-button" onClick={() => setScreen(Screens.BAD)}>Got it!</div>
                { onboarding ? <p>step 4 of 5</p> : <div className="br"></div> }
            </> }
            { screen === Screens.BAD && <>
                <p className="onboard-text">And here are some entries that could use a little more work:</p>
                <Swiper
                    modules={[Pagination]}
                    className="onboarding-swiper"
                    navigation={true}
                    pagination={true}
                    autoHeight={true}
                    loop={true}
                >
                    { bad.map(log => <SwiperSlide key={log.journal}>
                        <StaticMoodLogCard log={log} />
                        <div style={{"height": "30px"}}></div>
                    </SwiperSlide>) }
                </Swiper>
                <p className="onboard-text margin-bottom-0">
                    These entries don't answer the three questions. Some don't say what was 
                    going on, and none of them have any sort of reflection.
                </p>
                <p className="onboard-text">
                    Remember, the more reflection you do in the moment, the more you'll discover about yourself. And the more 
                    context you add, the more you'll be able to remember when you look back on your entries!
                </p>
                <div className="finish-button onboarding-button" onClick={() => setScreen(Screens.OUTRO)}>Alright, I think I'm ready.</div>
                { onboarding ? <p>step 5 of 5</p> : <div className="br"></div> }
            </> }
            { screen === Screens.OUTRO && <>
                <div className="align-box">
                    <p className="onboard-text margin-bottom-0">Don't forget!</p>
                    <p className="onboard-text margin-bottom-0 indent-number">{ generateNumber(1) } What have you been doing?</p>
                    <p className="onboard-text margin-bottom-0 indent-number">{ generateNumber(2) } How have you been feeling?</p>
                    <p className="onboard-text indent-number">{ generateNumber(3) } Why might you be feeling that way?</p>
                    <p className="onboard-text">Good luck! You're going to do great.</p>
                </div>
                
                <div className="finish-button onboarding-button" onClick={() => setSubmitting(true)}>Start journaling!</div>
                <div className="br"></div>
            </> }
        </>;
}

export default OnboardingHowToJournal;
