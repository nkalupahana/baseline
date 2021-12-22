import "./SummaryHeader.css";

const SummaryHeader = props => {
    return (
        <div className="center-summary">
            <div className="title">Here's how your week has been looking.</div>
            <br />
        </div>
    );

    /*return (
        <div className="center-summary">
            <div className="title">Here's how your week has been looking.</div>
            <br />
            <div className="cards">
                <StatCard stat="1.5" label="mood baseline" change={10}></StatCard>
                <StatCard stat="2.1" label="average mood" change={5}></StatCard>
                <StatCard stat="70%" label="at + above baseline" change={7}></StatCard>
                <StatCard stat="8%" label="far below baseline" change={-5}></StatCard>
            </div>
            <p className="helper-text">want more info? tap on a stat for more details</p>
        </div>
    );*/
};

export default SummaryHeader;