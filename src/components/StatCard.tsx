import "./StatCard.css";

interface Stat {
    stat: number;
    label: string;
    change: number;
}

const StatCard = (props: Stat) => {
    return (
        <div className="card">
            <span className="stat">{ props.stat }</span> 
            <span className="label">{ props.label }</span>
            <span className="change">{ props.change >= 0 ? "▲" : "▼" } {Math.abs(props.change)}%</span>
        </div>
    );
};

export default StatCard;