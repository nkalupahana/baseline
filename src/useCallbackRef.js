// useCallback is required when listening to changes in refs,
// because the ref sometimes doesn't update correctly (you can't set ref.current
// as a dependency on useEffect). However, in order to put event listeners on refs,
// you have to clean them up when the ref changes, and while useEffect has cleanup functions,
// useCallback does not. You can wrap useCallback calls with useCallbackRef 
// in order to get around this.
// https://github.com/facebook/react/issues/15176#issuecomment-512740882

import { useRef, useCallback } from "react";

export default function useCallbackRef(rawCallback) {
    const cleanupRef = useRef(null);
    const callback = useCallback(
        node => {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }

            if (node) {
                cleanupRef.current = rawCallback(node);
            }
        },
        [rawCallback]
    );

    return callback;
}
