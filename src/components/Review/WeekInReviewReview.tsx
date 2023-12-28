import { IonIcon, IonSpinner } from "@ionic/react";
import { ref, serverTimestamp, set } from "firebase/database";
import { useMemo, useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { AnyMap, PullDataStates, calculateBaseline, parseSurveyHistory, toast } from "../../helpers";
import history from "../../history";
import Screener, { Priority } from "../../screeners/screener";
import SwiperType, { Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css";
import "swiper/css/pagination";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { useAuthState } from "react-firebase-hooks/auth";
import BaselineDescription from "./BaselineDescription";
import BaselineGraph from "../graphs/BaselineGraph";
import useGraphConfig from "../graphs/useGraphConfig";
import { zip } from "lodash";

interface Props {
    primary: Screener,
    secondary: Screener,
    update: boolean
}

const WeekInReviewReview = ({ primary, secondary, update }: Props) => {
    const [loading, setLoading] = useState(false);
    const [swiper, setSwiper] = useState<SwiperType | undefined>(undefined);
    const [user] = useAuthState(auth);
    const [surveyHistory, setSurveyHistory] = useState<AnyMap | PullDataStates>(PullDataStates.NOT_STARTED);
    const [baselineGraph, setBaselineGraph] = useState<AnyMap[] | PullDataStates>(PullDataStates.NOT_STARTED);
    const [swiperProgress, setSwiperProgress] = useState(0);

    const { now, xZoomDomain, setXZoomDomain, zoomTo, pageWidthRef, pageWidth, tickCount, memoTickFormatter } = useGraphConfig();

    useEffect(() => {
        if (!user) return;
        // Try to set timestamp on load, to prevent duplicate surveys
        // in case the user doesn't hit the finish button
        if (update) set(ref(db, `/${user.uid}/lastWeekInReview`), serverTimestamp());
    }, [user, update]);

    const finish = async () => {
        if (loading) return;
        setLoading(true);
        try {
            if (update) await set(ref(db, `/${user.uid}/lastWeekInReview`), serverTimestamp());
            history.push(update ? "/summary" : "/surveys");
        } catch (e: any) {
            toast(`Something went wrong, please try again. ${e.message}`);
            setLoading(false);
        }
    };

    const screenerData = useMemo(() => {
        let selected = [primary, secondary]
            .filter(screener => screener.getPriority() !== Priority.DO_NOT_SHOW)
            .sort((a, b) => {
                return b.getPriority() - a.getPriority();
            });

        let processedData = selected.map(screener => {
            if (!screener.processDataForGraph) return null;
            if (typeof surveyHistory !== "object") return null;
            return screener.processDataForGraph(surveyHistory);
        });

        let ret = [];
        for (let i = 0; i < selected.length; i++) {
            ret.push({ screener: selected[i], data: processedData[i] });
        }

        return ret;
    }, [primary, secondary, surveyHistory]);

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
                onSlideChange={s => {
                    setSwiperProgress(s.progress);
                }}
            >
                <SwiperSlide style={{"display": "flex", "alignItems": "center", "justifyContent": "center"}}>
                    <div>
                        <div className="title">Hi there.</div>
                        <p className="text-center">Let's go over your results.</p>
                    </div>
                </SwiperSlide>
                { screenerData.map(({ screener, data }) => {
                    return <SwiperSlide key={screener._key}>
                        <div className="title">Results</div>
                        <div className="text-center screener-slide">
                            { data && screener.graph && 
                                <div className="swiper-no-swiping">
                                    <screener.graph 
                                        data={data}
                                        xZoomDomain={xZoomDomain}
                                        setXZoomDomain={setXZoomDomain}
                                        now={now}
                                        pageWidth={pageWidth}
                                        tickCount={tickCount}
                                        tickFormatter={memoTickFormatter}
                                        zoomTo={zoomTo}
                                    />
                                </div> }
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
                    <div className="text-center screener-slide" ref={pageWidthRef}>
                        { typeof baselineGraph === "object" && <>
                            <div className="swiper-no-swiping">
                                <BaselineGraph
                                    xZoomDomain={xZoomDomain}
                                    setXZoomDomain={setXZoomDomain}
                                    data={baselineGraph}
                                    now={now}
                                    pageWidth={pageWidth}
                                    tickCount={tickCount}
                                    tickFormatter={memoTickFormatter}
                                    zoomTo={zoomTo}
                                />
                            </div>
                            <BaselineDescription />
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
                <IonIcon onClick={() => swiper?.slidePrev()} icon={chevronBackOutline} style={swiperProgress === 0 ? {color: "grey"} : {}} />
                <IonIcon onClick={() => swiper?.slideNext()} icon={chevronForwardOutline} style={swiperProgress === 1 ? {color: "grey"} : {}}/>
            </div>
        </div>;
}

export default WeekInReviewReview;