const InfoBadge: React.FC = ({ children }) => {
    return (
        <div style={{ borderRadius: "6px", backgroundColor: "var(--ion-color-light)", padding: "8px", margin: "12px 0" }}>
            { children }
        </div>
    );
}

export default InfoBadge;

export const getInfoBadge = (editTimestamp: number | null, addFlag: string | null) => {
    if (editTimestamp !== null) {
        return <InfoBadge>Editing saved journal</InfoBadge>
    } else if (addFlag?.startsWith("summary")) {
        return <InfoBadge>Summary journal for yesterday</InfoBadge>
    }
    return null;
}