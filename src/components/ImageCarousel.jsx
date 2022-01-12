import { getDownloadURL, ref } from "@firebase/storage";
import { storage, auth } from "../firebase";
import { useEffect, useState } from "react";
import Flickity from 'react-flickity-component';
import "flickity/dist/flickity.min.css";
import "flickity-fullscreen/fullscreen.css";
import "flickity-fullscreen/fullscreen";
import useCallbackRef from "../useCallbackRef";

// TODO: event that determines whether the menu gesture is on
// with flickity

const ImageCarousel = ({ files, setMenuDisabled }) => {
    const [accessURLs, setAccessURLs] = useState([]);

    useEffect(() => {
        (async () => {
            let promises = [];
            for (let file of files) {
                promises.push(getDownloadURL(ref(storage, `user/${auth.currentUser.uid}/${file}`)));
            }

            await Promise.all(promises).then(setAccessURLs);
        })();
    }, [files]);
    
    const flkty = useCallbackRef(useCallbackRef(node => {
        if (!node) return;
        const listener = isFullscreen => {
            setMenuDisabled(isFullscreen);
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