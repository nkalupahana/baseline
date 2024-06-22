import KeyboardSpacer from "../KeyboardSpacer";

interface Props {
    textarea: React.RefObject<HTMLTextAreaElement>;
    text: string;
    setText: (text: string) => void;
    next: () => void;
}

const WriteJournal = ({ textarea, text, setText, next } : Props) => {
    return <>
        <label data-value={text} className="input-sizer stacked">
        <textarea ref={textarea} className="tx" value={text} onInput={e => setText((e.target as HTMLTextAreaElement).value)} rows={1} placeholder="Start typing here!"></textarea>
        </label>
        { text.trim() && <div onClick={next} className="fake-button">Continue</div> }
        <KeyboardSpacer />
        <div className="br"></div>
    </>
};

export default WriteJournal;