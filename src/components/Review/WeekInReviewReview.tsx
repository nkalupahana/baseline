import { IonIcon, IonSpinner } from "@ionic/react";
import { get, limitToLast, orderByKey, query, ref, serverTimestamp, set } from "firebase/database";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { AnyMap, checkKeys, decrypt, getDateFromLog, toast } from "../../helpers";
import history from "../../history";
import Screener, { GraphConfig, Priority } from "../../screeners/screener";
import SwiperType, { Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css";
import "swiper/css/pagination";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { useAuthState } from "react-firebase-hooks/auth";
import SurveyGraph from "./SurveyGraph";
import ldb from "../../db";
import { DateTime } from "luxon";
import EndSpacer from "../EndSpacer";

interface Props {
    primary: Screener,
    secondary: Screener
}

enum BaselineStates {
    NOT_STARTED,
    NOT_ENOUGH_DATA
}

const WeekInReviewReview = ({ primary, secondary }: Props) => {
    const [loading, setLoading] = useState(false);
    const [swiper, setSwiper] = useState<SwiperType | undefined>(undefined);
    const [user] = useAuthState(auth);
    const [surveyHistory, setSurveyHistory] = useState<AnyMap | undefined>(undefined);
    const [baselineGraph, setBaselineGraph] = useState<AnyMap[] | BaselineStates>(BaselineStates.NOT_STARTED);
    const baselineGraphConfig: GraphConfig = {
        yAxisLabel: "baseline (-5 to 5 scale)",
        lines: [{
            key: "Mood",
            color: "#955196"
        }]
    };
    const BASELINE_DAYS = 14;

    const finish = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await set(ref(db, `/${auth?.currentUser?.uid}/lastWeekInReview`), serverTimestamp());
            history.push("/summary");
        } catch (e: any) {
            toast(`Something went wrong, please try again. ${e.message}`);
            setLoading(false);
        }
    };

    const screeners = [primary, secondary]
        .filter(screener => screener.getPriority() !== Priority.DO_NOT_SHOW)
        .sort((a, b) => {
            return b.getPriority() - a.getPriority();
        });

    useEffect(() => {
        if (!user) return;
        const keys = checkKeys();
        get(query(ref(db, `${user.uid}/surveys`), orderByKey(), limitToLast(100))).then(snap => {
            let val = snap.val();
            for (let key in val) {  
                if (typeof val[key]["results"] === "string") {
                    val[key]["results"] = JSON.parse(decrypt(val[key]["results"], `${keys.visibleKey}${keys.encryptedKeyVisible}`));
                }
            }

            setSurveyHistory(val);
        });
    }, [user]);

    useEffect(() => {
        (async () => {
            const logs = await ldb.logs.where("timestamp").above(DateTime.now().minus({ years: 1 }).toMillis()).toArray();
            let currentDate = getDateFromLog(logs[0]);
            let ptr = 0;
            let perDayDates = [];
            let perDayAverages = [];
            const now = DateTime.local();
            while (currentDate < now) {
                let todaySum = 0;
                let ctr = 0;
                while (ptr < logs.length && logs[ptr].day === currentDate.day && logs[ptr].month === currentDate.month && logs[ptr].year === currentDate.year) {
                    if (logs[ptr].average === "average") {
                        todaySum += logs[ptr].mood;
                        ++ctr;
                    }
                    ++ptr;
                }
                perDayAverages.push(ctr === 0 ? 0 : todaySum / ctr);
                perDayDates.push(currentDate.toFormat("LLL d"))
                currentDate = currentDate.plus({"days": 1});
            }

            if (perDayAverages.length <= BASELINE_DAYS) {
                setBaselineGraph(BaselineStates.NOT_ENOUGH_DATA);
                return;
            }

            let sum = 0;
            let i = 0;
            for (i = 0; i < BASELINE_DAYS; ++i) {
                sum += perDayAverages[i];
            }

            let baseline = [];
            baseline.push({
                date: perDayDates[i - 1],
                Mood: sum / BASELINE_DAYS
            });

            while (i < perDayAverages.length) {
                console.log(i);
                sum -= perDayAverages[i - BASELINE_DAYS];
                sum += perDayAverages[i];
                baseline.push({
                    date: perDayDates[i],
                    Mood: sum / BASELINE_DAYS
                });
                ++i;
            }

            console.log(baseline);
            setBaselineGraph(baseline);
        })();
    }, []);
    
    return <div className="center-summary container">
            <br />
            <Swiper 
                modules={[Pagination]}
                navigation={true}
                pagination={true}
                style={{"width": "95%", "maxWidth": "600px", "height": "calc(100vh - 110px)"}}
                onSwiper={swiper => setSwiper(swiper)}
            >
                <SwiperSlide style={{"display": "flex", "alignItems": "center", "justifyContent": "center"}}>
                    <div>
                        <div className="title">Hi there.</div>
                        <p className="text-center">Let's go over your results.</p>
                    </div>
                </SwiperSlide>
                { screeners.map(screener => {
                    return <SwiperSlide key={screener._key}>
                        <div className="title">Results</div>
                        <div className="text-center screener-slide">
                            { screener.graphConfig && 
                                screener.processDataForGraph && 
                                <SurveyGraph data={screener.processDataForGraph(surveyHistory)} graphConfig={screener.graphConfig} /> }
                            { screener.getRecommendation() }
                            <p style={{"fontSize": "9px"}}>
                                If you want to discuss these results with a 
                                professional, show them this: { screener.getClinicalInformation() }
                            </p>
                            <EndSpacer />
                        </div>
                    </SwiperSlide>
                }) }
                <SwiperSlide>
                    <div className="title">Your baseline</div>
                    <div className="text-center screener-slide">
                        { typeof baselineGraph === "object" && <>
                            <SurveyGraph data={baselineGraph} graphConfig={baselineGraphConfig} />
                            <p>
                                Remember how every time you mood log, we ask you whether you're feeling below, at, 
                                or above average? Well, here's what that's used for &mdash; your baseline. Your baseline 
                                tracks what you consider to be your "average" mood to be over time, so you can see how 
                                your standards for your own average change over time. Notice your baseline falling? You 
                                might want to make a conscious effort to bring more things into your life that typically are 
                                associated with higher mood scores. If your baseline has fallen significantly, or isn't rebounding, 
                                you might want to take some time to reflect on what's changed in your life.
                            </p>
                            <p>
                                Mood logging is a great start to that process &mdash; we recommend that you review your mood logs 
                                to look for any changes. And of course, professional help is the best way to really figure out 
                                what's going on. Check out our help resources in the main menu for more information.
                            </p>
                        </> }
                        { typeof baselineGraph === "number" && <p>
                            Unfortunately, you haven't used baseline for at least two weeks yet &mdash; and that's how
                            much data we need to calculated your baseline! We'll try again next week.
                        </p> }
                        <div className="finish-button" onClick={finish}>
                            { !loading && <>Finish</> }
                            { loading && <IonSpinner className="loader" name="crescent" /> }
                        </div>
                        <EndSpacer />
                    </div>
                </SwiperSlide>
            </Swiper>
            <div className="swiper-pagniation-controls">
                <IonIcon onClick={() => swiper?.slidePrev()} icon={chevronBackOutline} />
                <IonIcon onClick={() => swiper?.slideNext()} icon={chevronForwardOutline} />
            </div>
        </div>;
}

export default WeekInReviewReview;