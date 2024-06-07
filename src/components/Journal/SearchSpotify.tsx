import { IonIcon, IonSearchbar } from "@ionic/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet, Header, Content, Footer, detents, Portal } from "react-sheet-slide";
import "react-sheet-slide/style.css";
import "./SearchSpotify.css";
import logo from "./spotify.png";
import { IonSearchbarCustomEvent, SearchbarInputEventDetail } from "@ionic/core";
import { throttle } from "lodash";
import { BASE_URL } from "../../helpers";
import { User, getIdToken } from "firebase/auth";
import { closeCircle, closeCircleOutline, musicalNotes } from "ionicons/icons";
import { SpotifySelection } from "../../pages/Journal";
import { Keyboard } from "@capacitor/keyboard";
import { Capacitor } from "@capacitor/core";

interface Props {
    user: User;
    song: SpotifySelection;
    setSong: (song: SpotifySelection | undefined) => void;
}

interface SpotifyTrack {
    uri: string;
    name: string;
    artists: SpotifyArtist[];
    album: SpotifyAlbum;
    explicit: boolean;
}

interface SpotifyArtist {
    name: string;
}

interface SpotifyAlbum {
    images: SpotifyImage[];
}

interface SpotifyImage {
    height: number;
    width: number;
    url: string;
}

const SearchSpotify = ({ user, song, setSong } : Props) => {
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<SpotifyTrack[]>([]);
    const search = useCallback(async (e: IonSearchbarCustomEvent<SearchbarInputEventDetail>) => {
        if (e.detail.value?.trim() === "") {
            setResults([]);
            return;
        }

        const response = await fetch(`${BASE_URL}/spotify/search`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${await getIdToken(user)}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query: e.detail.value })
        });
        const data = await response.json();
        setResults(data.tracks.items);
    }, [user]);
    const throttledSearch = useMemo(() => throttle(search, 1000), [search]);

    const keyboardCloser = useCallback((e) => {
        if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
        }
    }, []);

    useEffect(() => {
        setResults([]);

        if (!open && Capacitor.getPlatform() !== "web") {
            Keyboard.hide();
        }
    }, [open]);

    const onSearchbarMount = useCallback(async (el) => {
        if (el) {
            const input = await el.getInputElement();
            if (input && input.value === "") input.focus();
        }
    }, []);
    
    return (
        <>
            <span className="spotify-start-btn" onClick={() => {
                setOpen(true);
            }}>
                <IonIcon icon={musicalNotes} className="journal-additions-icon"></IonIcon>
                { song === undefined && <span> Add Music</span> }
                { song !== undefined && <span> { song.name } <IonIcon className="secondary-icon" icon={closeCircleOutline} onClick={(e) => {
                        e.stopPropagation(); 
                        setSong(undefined);
                    }}></IonIcon>
                </span> }
            </span>
            <Portal>
                <Sheet
                    open={open}
                    onDismiss={() => setOpen(false)}
                    selectedDetent={detents.large}
                    detents={(props) => [detents.large(props)]}
                >
                    <Header className="rss-header" scrolledClassName="rss-header-scrolled">
                        <h1>
                            Search for Music
                            <IonIcon className="spotify-modal-close" icon={closeCircle} onClick={() => setOpen(false)} />
                        </h1>
                    </Header>
                    <Content className="rss-content">
                        <IonSearchbar 
                            className="spotify-search" 
                            onIonInput={throttledSearch} 
                            inputMode="search" 
                            onKeyUp={keyboardCloser}
                            id="spotify-search-bar"
                            ref={onSearchbarMount}
                        />
                        {results.map((track: SpotifyTrack) => {
                            return (
                                <div key={track.uri} className="spotify-track" onClick={() => {
                                    setSong({
                                        uri: track.uri,
                                        name: track.name
                                    });
                                    setOpen(false);
                                }}>
                                    <img className="spotify-album" src={track.album.images[2].url} alt={track.name} />
                                    <span className="spotify-title">{track.name}</span>
                                    <span className="spotify-artists">
                                        { track.explicit && <span className="spotify-explicit">E</span> }
                                        { track.artists.map(artist => artist.name).join(", ") }</span>
                                </div>
                            );
                        })}
                        <div style={{"textAlign": "center"}}>
                            <p style={{"marginBottom": "8px"}}>Provided by</p>
                            <img style={{height: "40px"}} src={logo} alt="Spotify Logo" />
                        </div>
                    </Content>
                    <Footer className="rss-footer">
                    </Footer>
                </Sheet>
            </Portal>
        </>
    );
};

export default SearchSpotify;
