import { getDownloadURL, ref } from "@firebase/storage";
import { storage, auth } from "../../firebase";
import { useEffect, useState } from "react";
import Flickity from "react-flickity-component";
import "flickity/dist/flickity.min.css";
import "flickity-fullscreen/fullscreen.css";
import "flickity-fullscreen/fullscreen";
import useCallbackRef from "../../useCallbackRef";
import { useAuthState } from "react-firebase-hooks/auth";

const ImageCarousel = ({ files, setInFullscreen }) => {
    const [accessURLs, setAccessURLs] = useState([]);
    const [, loading] = useAuthState(auth);

    useEffect(() => {
        if (loading) return;
        (async () => {
            let promises = [];
            for (let file of files) {
                promises.push(getDownloadURL(ref(storage, `user/${auth.currentUser.uid}/${file}`)));
            }

            await Promise.all(promises).then(setAccessURLs);
        })();
    }, [files, loading]);
    
    const flkty = useCallbackRef(useCallbackRef(node => {
        if (!node) return;
        const listener = isFullscreen => {
            setInFullscreen(isFullscreen);
        }

        node.on("fullscreenChange", listener);

        return () => {
            node.off("fullscreenChange", listener);
        }
    }));

    return (
        <>
            { accessURLs && <Flickity flickityRef={flkty} className="carousel-mods" reloadOnUpdate={false} options={{"wrapAround": true, "adaptiveHeight": true, "fullscreen": true}}>
                { accessURLs.map(url => <div key={url} style={{"display": "flex", "alignItems": "center", "justifyContent": "center"}}><img alt="User-attached for mood log" src={url} /></div>)}
            </Flickity> }
        </>
    )
};

export default ImageCarousel;