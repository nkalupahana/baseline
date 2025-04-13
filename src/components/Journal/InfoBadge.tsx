

const InfoBadge: React.FC = ({ children }) => {
    return (
        <div style={{ borderRadius: "6px", backgroundColor: "var(--ion-color-light)", padding: "8px", margin: "12px 0" }}>
            { children }
        </div>
    );
}

export default InfoBadge;