const WeekInReviewInitial = ({ incrementStage } : { incrementStage: () => void }) => {
    return <div className="container">
        <div className="center-summary container" style={{display: "flex", flexDirection: "column"}}>
            <div className="title">Let's get started.</div>
            <p style={{marginBottom: "8px"}} className="text-center">Week in Review is a quick weekly check-in for you and your mental health. Don't worry, it shouldn't take more than a few minutes.</p>
            <p className="text-center p-inner">This week's review has three parts:</p>
            <p className="p-inner">1. &nbsp;<b>A primary survey</b>, which will give you insight into your current levels of depression, anxiety, and stress.</p>
            <p className="p-inner">2. &nbsp;<b>A secondary survey</b>, which is different from week to week and will help you better understand any other mental health issues you might be struggling with.</p>
            <p className="p-inner">3. &nbsp;<b>A review of your mood logs</b> this week, which will help you compare your health this week with previous weeks.</p>
            <p className="text-center p-inner">The purpose of this is to give you some insight into your mental health, especially over time. It's often difficult to step back and think about these things, and we hope this review will give you a chance to do just that.</p>
            <br />
            <div className="finish-button" onClick={incrementStage}>Start Primary Survey</div>
            <br /><br /><br /><br />
        </div>
    </div>
};

export default WeekInReviewInitial;