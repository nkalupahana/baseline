import { set, ref } from "@firebase/database";
import { IonSpinner } from "@ionic/react";
import { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { Pagination } from "swiper";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import {  db } from "../../firebase";
import history from "../../history";
import EndSpacer from "../EndSpacer";
import SettingsBox from "../Settings/SettingsBox";
import StaticMoodLogCard, { SimpleLog } from "../Summary/StaticMoodLogCard";

const good: SimpleLog[] = [
    {
        journal: "I'm doing okay. Went to the grocery store and got some stuff done around the house. Going to the store always stresses me out, and I'm not really sure why. Maybe because there’s so many choices and I feel like I just have to get out of there. At any rate, I'm sure I can keep working on it, and relaxing at home makes it feel better.",
        time: "3:22 PM",
        average: "average",
        mood: 0
    },
    {
        journal: "having a good day! things are going well at work, fixed the underreporting issue on our sales app that ive been working on for the last week. and i finally got to catch up with carrie! things are going well.",
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

const OnboardingHowToJournal = ({ user } : { user: User }) => {
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user || !submitting) return;
        (async () => {
            await set(ref(db, `${user.uid}/onboarding/onboarded`), true);
            localStorage.removeItem("onboarding");
            history.replace("/journal");
        })();
    }, [user, submitting]);

    return <div style={{"width": "100%"}}>
        <div className="title">How to Journal</div>
        <p className="margin-bottom-24">
            baseline is different from "daily" journals in that it's specifically designed to 
            capture how you're feeling <b>in the moment</b>, a few times a day. This might be
            the first time you've tried something like this, but don't worry &mdash; journaling
            is a skill, just like anything else, and there's no one right way to do it.
        </p>
        <p>
            Now, sometimes, you might just want to write a sentence 
            and be done. But most of the time, you should try to 
            describe <b>what you've been doing</b>, <b>how you've been feeling</b>,
            and <b>why you might be feeling that way.</b>
        </p>
        <p className="margin-bottom-0"><span className="line">Here are some examples of what</span> <span className="line">good entries look like:</span></p>
        <Swiper
            modules={[Pagination]}
            navigation={true}
            pagination={true}
            style={{"textAlign": "initial", "maxWidth": "450px"}}
            autoHeight={true}
            loop={true}
        >
            { good.map(log => <SwiperSlide key={log.journal}>
                <StaticMoodLogCard log={log} />
                <div style={{"height": "30px"}}></div>
            </SwiperSlide>) }
        </Swiper>
        <p>
            Every entry covers what the person's been doing, how that made them feel, 
            and some deeper reflection on it as needed.
        </p>
        <p className="margin-bottom-0">And here's what some bad entries look like:</p>
        <Swiper 
            modules={[Pagination]}
            navigation={true}
            pagination={true}
            style={{"textAlign": "initial", "maxWidth": "450px"}}
            autoHeight={true}
            loop={true}
        >
            { bad.map(log => <SwiperSlide key={log.journal}>
                <StaticMoodLogCard log={log} />
                <div style={{"height": "30px"}}></div>
            </SwiperSlide>) }
        </Swiper>
        <p>
            These entries don't capture what was going on, and have no meaningful reflection. 
            Remember, the more reflection you do in the moment, the more you'll discover, and the more 
            context you add, the more you'll be able to remember when you look back on your entries!
        </p>
        { user && <div style={{"textAlign": "initial"}}>
            <SettingsBox
                attr="introQuestions"
                title="Not comfortable writing about yourself this much yet?"
                description="Get started with some practice prompts for the first few weeks."
                syncWithFirebase={`${user.uid}/onboarding/questions`}
            ></SettingsBox>
        </div> }
        <p>You can view this guide at any time in the main menu, and adjust your options in Settings.</p>
        { user && <div style={{"maxWidth": "500px"}} className="finish-button" onClick={() => setSubmitting(true)}>
            { !submitting && <>Get Started</> }
            { submitting && <IonSpinner className="loader" name="crescent" /> }
        </div> }
        <EndSpacer />
    </div>;
}

export default OnboardingHowToJournal;