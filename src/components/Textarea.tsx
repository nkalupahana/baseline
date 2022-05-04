const Textarea = ({ getter, setter, id, placeholder="" }: { getter: string, setter: (_: string) => void, id: string, placeholder?: string}) => {
    return (
    <label data-value={getter} className="input-sizer stacked">
        <textarea className="tx" id={id} value={getter} onChange={e => setter(e.target.value)} rows={2} placeholder={placeholder}></textarea>
    </label>);
}

export default Textarea;