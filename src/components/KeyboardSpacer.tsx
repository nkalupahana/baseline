import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardInfo } from "@capacitor/keyboard";
import { useEffect, useState } from "react";

const KeyboardSpacer = () => {
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        if (Capacitor.getPlatform() === "web") return;
        const show = (info: KeyboardInfo) => {
            setKeyboardHeight(info.keyboardHeight + 10);
        };
        
        const hide = () => {
            setKeyboardHeight(0);
        };

        Keyboard.addListener("keyboardDidShow", show);
        Keyboard.addListener("keyboardDidHide", hide);

        return () => {
            Keyboard.removeAllListeners();
        };
    }, []);

    return <div style={{"transition": "height 0.5s cubic-bezier(0.64, 0, 0.46, 1) 0s", "height": `${keyboardHeight}px`, width: "100%"}}></div>
}

export default KeyboardSpacer;