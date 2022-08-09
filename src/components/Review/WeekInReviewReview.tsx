import { IonIcon, IonSpinner } from "@ionic/react";
import { ref, serverTimestamp, set } from "firebase/database";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { AnyMap, PullDataStates, BASELINE_GRAPH_CONFIG, calculateBaseline, parseSurveyHistory, toast } from "../../helpers";
import history from "../../history";
import Screener, { Priority } from "../../screeners/screener";
import SwiperType, { Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css";
import "swiper/css/pagination";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { useAuthState } from "react-firebase-hooks/auth";
import SurveyGraph from "./SurveyGraph";
import { BASELINE_EXP } from "../../data";

interface Props {
    primary: Screener,
    secondary: Screener
}

const WeekInReviewReview = ({ primary, secondary }: Props) => {
    const [loading, setLoading] = useState(false);
    const [swiper, setSwiper] = useState<SwiperType | undefined>(undefined);
    const [user] = useAuthState(auth);
    const [surveyHistory, setSurveyHistory] = useState<AnyMap | PullDataStates>(PullDataStates.NOT_STARTED);
    const [baselineGraph, setBaselineGraph] = useState<AnyMap[] | PullDataStates>(PullDataStates.NOT_STARTED);

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
        parseSurveyHistory(user, setSurveyHistory);
    }, [user]);

    useEffect(() => {
        calculateBaseline(setBaselineGraph);
    }, []);
    
    return <div className="center-summary container">
            <br />
            <Swiper 
                modules={[Pagination]}
                navigation={true}
                pagination={true}
                onSwiper={swiper => setSwiper(swiper)}
                className="swiper-container-mod"
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
                            { screener.graphConfig && typeof surveyHistory === "object" && 
                                screener.processDataForGraph && 
                                <SurveyGraph data={screener.processDataForGraph(surveyHistory)} graphConfig={screener.graphConfig} /> }
                            { screener.getRecommendation() }
                            <p style={{"fontSize": "9px"}}>
                                If you want to discuss these results with a 
                                professional, show them this: { screener.getClinicalInformation() }
                            </p>
                            <br />
                        </div>
                    </SwiperSlide>
                }) }
                <SwiperSlide>
                    <div className="title">Your baseline</div>
                    <div className="text-center screener-slide">
                        { typeof baselineGraph === "object" && <>
                            <SurveyGraph data={baselineGraph} graphConfig={BASELINE_GRAPH_CONFIG} />
                            <p>
                                Remember how every time you mood log, we ask you whether you're feeling below, at, 
                                or above average? Well, here's what that's used for &mdash; your baseline. { BASELINE_EXP } (And 
                                if you're just starting out and don't have enough data 
                                to see a trend, don't worry about your baseline just yet.)
                            </p>
                            <p>
                                Notice your baseline falling? You might want to make a conscious effort to bring more things 
                                into your life that you typically associate with higher mood scores. If your baseline has 
                                fallen significantly, or isn't rebounding, you should to take some time to reflect on what 
                                might've changed in your life that led to that.
                            </p>
                            <p>
                                Mood logging is a great start to that process &mdash; we recommend that you review your mood logs 
                                to look for any changes. And of course, professional help is the best way to really figure out 
                                what's going on. Check out our help resources in the main menu for more information.
                            </p>
                        </> }
                        { typeof baselineGraph === "number" && <p>
                            Unfortunately, you haven't used baseline for at least three weeks yet &mdash; and that's how
                            much data we need to calculate your baseline! We'll try again next week.
                        </p> }
                        <div className="finish-button" onClick={finish}>
                            { !loading && <>Finish</> }
                            { loading && <IonSpinner className="loader" name="crescent" /> }
                        </div>
                        <br />
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