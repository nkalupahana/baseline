import { IonSpinner } from "@ionic/react";
import { ref, serverTimestamp, set } from "firebase/database";
import { useState } from "react";
import { auth, db } from "../../firebase";
import { toast } from "../../helpers";
import history from "../../history";
import Screener from "../../screeners/screener";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface Props {
    primary: Screener,
    secondary: Screener
}

const WeekInReviewReview = ({ primary, secondary }: Props) => {
    const [loading, setLoading] = useState(false);
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

    return (<div className="center-summary container">
            <br />
            <Swiper 
                modules={[Navigation, Pagination]}
                navigation={true}
                pagination={true}
                style={{"width": "95%", "maxWidth": "600px", "height": "calc(100vh - 100px)"}}
            >
                <SwiperSlide style={{"display": "flex", "alignItems": "center", "justifyContent": "center"}}>
                    <div>
                        <div className="title">Hi there.</div>
                        <p className="text-center">Let's go over your results.</p>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="finish-button" onClick={finish}>
                        { !loading && <>Finish</> }
                        { loading && <IonSpinner className="loader" name="crescent" /> }
                    </div>
                </SwiperSlide>
            </Swiper>
        </div>);
}

export default WeekInReviewReview;