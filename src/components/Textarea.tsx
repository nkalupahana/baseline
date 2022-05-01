const Textarea = ({ getter, setter, placeholder="" }: { getter: string, setter: (_: string) => void, placeholder?: string}) => {
    return (
    <label data-value={getter} className="input-sizer stacked">
        <textarea className="tx" value={getter} onChange={e => setter(e.target.value)} rows={2} placeholder={placeholder}></textarea>
    </label>);
}

export default Textarea;