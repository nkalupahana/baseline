const Textarea = ({ getter, setter }: { getter: string, setter: (_: string) => void}) => {
    return (
    <label data-value={getter} className="input-sizer stacked">
        <textarea className="tx" value={getter} onChange={e => setter(e.target.value)} rows={2}></textarea>
    </label>);
}

export default Textarea;