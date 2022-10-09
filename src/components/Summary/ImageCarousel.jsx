import { auth } from "../../firebase";
import { useEffect, useState } from "react";
import Flickity from "react-flickity-component";
import "flickity/dist/flickity.min.css";
import "flickity-fullscreen/fullscreen.css";
import "flickity-fullscreen/fullscreen";
import "flickity-download/download.css";
import "flickity-download/download";
import useCallbackRef from "../../useCallbackRef";
import { useAuthState } from "react-firebase-hooks/auth";
import { BASE_URL, checkKeys } from "../../helpers";
import { getIdToken } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { Media } from "@getbaseline/capacitor-community-media";

const ImageCarousel = ({ files, setInFullscreen }) => {
    const [accessURLs, setAccessURLs] = useState([]);
    const [user] = useAuthState(auth);

    useEffect(() => {
        if (!user) return;
        (async () => {
            let promises = [];
            const idToken = await getIdToken(user);
            const keys = JSON.stringify(checkKeys());
            for (let filename of files) {
                promises.push(fetch(`${BASE_URL}/getImage`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        filename,
                        keys
                    })
                }));
            }

            await Promise.all(promises)
                .then(resps => resps.map(resp => resp.text()))
                .then(p => Promise.all(p))
                .then(setAccessURLs);
        })();
    }, [files, user]);
    
    const flkty = useCallbackRef(useCallbackRef(node => {
        if (!node) return;
        const listener = isFullscreen => {
            setInFullscreen(isFullscreen);
        }

        node.on("fullscreenChange", listener);
        node.nativeDownload = dataurl => {
            if (Capacitor.getPlatform() === "web") {
                const link = document.createElement("a");
                link.href = dataurl;
                link.download = "image.webp";
                link.click();
            } else {
                Media.savePhoto({
                    path: dataurl
                });
            }
        };

        return () => {
            node.off("fullscreenChange", listener);
        }
    }));

    return (
        <>
            { accessURLs && <Flickity flickityRef={flkty} className="carousel-mods" reloadOnUpdate={false} options={{"wrapAround": true, "adaptiveHeight": true, "fullscreen": true, "download": true}}>
                { accessURLs.map(url => <div key={url} style={{"display": "flex", "alignItems": "center", "justifyContent": "center"}}><img alt="User-attached for mood log" src={url} /></div>)}
            </Flickity> }
        </>
    )
};

export default ImageCarousel;