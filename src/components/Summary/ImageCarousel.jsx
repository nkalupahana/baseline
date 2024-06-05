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
import { BASE_URL, checkKeys, toast } from "../../helpers";
import { getIdToken } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { Media } from "@capacitor-community/media";

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
                        "Authorization": `Bearer ${idToken}`,
                        "Content-Type": "application/json"
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
        node.nativeDownload = async dataurl => {
            if (Capacitor.getPlatform() === "web") {
                const link = document.createElement("a");
                link.href = dataurl;
                link.download = "image.webp";
                link.click();
            } else {
                let opts = { path: dataurl };
                if (Capacitor.getPlatform() === "android") {
                    let albums = await Media.getAlbums();
                    let album = albums.albums.find(x => x.name === "baseline");
                    if (!album) {
                        await Media.createAlbum({ name: "baseline" });
                        albums = await Media.getAlbums();
                        album = albums.albums.find(x => x.name === "baseline");
                    }
                    opts["albumIdentifier"] = album.identifier
                }
                try {
                    await Media.savePhoto(opts);
                    toast("Image saved!");
                } catch (e) {
                    toast(e);
                }
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