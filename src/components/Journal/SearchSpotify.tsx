import { IonIcon, IonSearchbar } from "@ionic/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet, Header, Content, Footer, detents, Portal } from "react-sheet-slide";
import "react-sheet-slide/style.css";
import "./SearchSpotify.css";
import logo from "./spotify.png";
import icon from "./spotify-icon.png";
import { SearchbarInputEventDetail } from "@ionic/core";
import { throttle } from "lodash";
import { BASE_URL, toast } from "../../helpers";
import { User, getIdToken } from "firebase/auth";
import { closeCircle, closeCircleOutline, musicalNotes, searchOutline, syncCircleOutline } from "ionicons/icons";
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

type SearchbarEvent = CustomEvent<SearchbarInputEventDetail>;

const SearchSpotify = ({ user, song, setSong } : Props) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [results, setResults] = useState<SpotifyTrack[]>([]);
    const [loading, setLoading] = useState<number | null>(null);
    const _search = useCallback(async (e: SearchbarEvent) => {
        if (!e.detail.value || e.detail.value?.trim() === "") {
            setResults([]);
            setSearchValue("");
            setLoading(null);
            return;
        }

        const throttleStart = performance.now();
        const val = e.detail.value.trim();

        const response = await fetch(`${BASE_URL}/spotify/search`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${await getIdToken(user)}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query: val })
        }).catch(() => {
            toast("Failed to connect to music search. Are you connected to the Internet?");
        });

        if (response?.ok) {
            const data = await response.json();
            setResults(data.tracks.items);
            setSearchValue(val);
            setLoading(prevLoading => {
                if (prevLoading && throttleStart > prevLoading) return null;
                return prevLoading;
            });
        } else if (response) {
            const error = await response.text();
            toast(`Failed to search for music: ${error}`);
        }
    }, [user]);
    const _throttledSearch = useMemo(() => throttle(_search, 1000), [_search]);
    const loggedThrottledSearch = useCallback((e: SearchbarEvent) => {
        setLoading(performance.now());
        _throttledSearch(e);
    }, [_throttledSearch]);

    const keyboardCloser = useCallback((e) => {
        if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
        }
    }, []);

    useEffect(() => {
        setResults([]);
        setSearchValue("");
        setLoading(null);

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

    const truncate = useCallback((str: string) => {
        if (str.length <= 30) return str;
        return str.substring(0, 30) + "...";
    }, []);
    
    return (
        <>
            <span className="spotify-start-btn" onClick={() => {
                setOpen(true);
            }}>
                <IonIcon icon={musicalNotes} className="journal-additions-icon"></IonIcon>
                { song === undefined && <span> Add Music</span> }
                { song !== undefined && <span> { truncate(song.name) } <IonIcon className="secondary-icon" icon={closeCircleOutline} onClick={(e) => {
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
                            className={"spotify-search" + (loading ? " spotify-search-loading" : "")}
                            onIonInput={loggedThrottledSearch}
                            inputMode="search"
                            onKeyUp={keyboardCloser}
                            id="spotify-search-bar"
                            ref={onSearchbarMount}
                            mode="ios"
                            searchIcon={loading ? syncCircleOutline : searchOutline}
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
                        { results.length === 0 && <div style={{"textAlign": "center"}}>
                            <p style={{"marginBottom": "8px"}}>Provided by</p>
                            <img style={{height: "40px"}} src={logo} alt="Spotify Logo" />
                        </div> }
                        { results.length > 0 && 
                            <div 
                                className="fake-button spotify-link" 
                                onClick={() => window.open(`https://open.spotify.com/search/${encodeURIComponent(searchValue)}/tracks`, "_blank")}>
                                <img src={icon} alt="Spotify icon" />
                                <span><b>OPEN SPOTIFY</b></span>
                            </div>
                        }
                    </Content>
                    <Footer className="rss-footer">
                    </Footer>
                </Sheet>
            </Portal>
        </>
    );
};

export default SearchSpotify;
