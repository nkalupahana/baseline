import { IonIcon, IonSpinner } from "@ionic/react";
import { get, limitToLast, orderByKey, query, ref, serverTimestamp, set } from "firebase/database";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { AnyMap, checkKeys, decrypt, toast } from "../../helpers";
import history from "../../history";
import Screener, { Priority } from "../../screeners/screener";
import SwiperType, { Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css";
import "swiper/css/pagination";
import { chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { useAuthState } from "react-firebase-hooks/auth";
import SurveyGraph from "./SurveyGraph";

interface Props {
    primary: Screener,
    secondary: Screener
}

const WeekInReviewReview = ({ primary, secondary }: Props) => {
    const [loading, setLoading] = useState(false);
    const [swiper, setSwiper] = useState<SwiperType | undefined>(undefined);
    const [user] = useAuthState(auth);
    const [surveyHistory, setSurveyHistory] = useState<AnyMap | undefined>(undefined);
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
        const keys = checkKeys();
        get(query(ref(db, `${user.uid}/surveys`), orderByKey(), limitToLast(100))).then(snap => {
            let val = snap.val();
            for (let key in val) {  
                if (typeof val[key]["results"] === "string") {
                    val[key]["results"] = JSON.parse(decrypt(val[key]["results"], `${keys.visibleKey}${keys.encryptedKeyVisible}`));
                }
            }

            console.log(val);
            console.log(primary.processDataForGraph!(val));

            setSurveyHistory(val);
        });
    }, [user]);
    
    return (<div className="center-summary container">
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
                        </div>
                    </SwiperSlide>
                }) }
                <SwiperSlide>
                    <div className="finish-button" onClick={finish}>
                        { !loading && <>Finish</> }
                        { loading && <IonSpinner className="loader" name="crescent" /> }
                    </div>
                </SwiperSlide>
            </Swiper>
            <div className="swiper-pagniation-controls">
                <IonIcon onClick={() => swiper?.slidePrev()} icon={chevronBackOutline} />
                <IonIcon onClick={() => swiper?.slideNext()} icon={chevronForwardOutline} />
            </div>
        </div>);
}

export default WeekInReviewReview;