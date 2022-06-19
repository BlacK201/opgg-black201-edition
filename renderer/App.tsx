import React, {useEffect, useState} from "react";
import _ from "lodash";
import Header from "./renewal/components/layouts/Header";
import Side from "./renewal/components/layouts/Side";
import Notification from "./components/layouts/Notification";
import {Redirect, Route, useLocation} from "react-router-dom";
import Ingame from "./renewal/pages/ingame";
import MiniChampion from "./renewal/pages/mini/miniChampion";
import MiniMultisearch from "./renewal/pages/mini/miniMultisearch";
import MiniIngame from "./renewal/pages/mini/miniIngame";
import Combos from "./renewal/pages/combos";
import {useIpcRenderer} from "./hooks/useIpcRenderer";
import {
    PAGE_PATH_LIVE_CHAMPION,
    PAGE_PATH_LIVE_INGAME,
    PAGE_PATH_LIVE_MULTISEARCH,
} from "./constants";
import Settings from "./renewal/pages/settings";
import {useTypedSelector} from "./redux/store";
import MiniHeader from "./renewal/components/layouts/MiniHeader";
import Login from "./login";
import LiveOPChampions from "./renewal/pages/liveOPChampions";
import LiveChampion from "./renewal/pages/liveChampion";
import Champions from "./renewal/pages/champions";
import ChampionStatistics from "./renewal/pages/championStatistics";
import MyPage from "./renewal/pages/mypage";
import ChampionCombos from "./renewal/pages/championCombos";
import {useDispatch} from "react-redux";
import {setAppMode, setIsSettingOpen} from "./redux/slices/common";
import PlaywireADs from "./components/Modal/PlaywireADs";
import Tft from "./renewal/pages/tft";
import Ads from "./renewal/components/layouts/Ads";
import NoAds from "./renewal/components/layouts/NoAds";
import KrAds from "./renewal/components/layouts/KrAds";
import axios from "axios";
import apiMultisearch from "./renewal/pages/apiMultisearch";
import IngameLCU from "./renewal/pages/ingameLCU";
import GlobalAds from "./renewal/components/layouts/GlobalAds";
import MemberPolicyModal from "./components/Modal/MemberPolicyModal";
import NoticeModal from "./components/Modal/NoticeModal";
const {isNMP} = require("./utils/nmp");
const {countryHasAds} = require("./utils/ads");
const {countryHasAdsAdsense} = require("./utils/adsAdsense");
const {playwireAds, nitropayAds, adsenseAds} = require("./utils/adsByLocale");

const App = () => {
    const {appMode, region} = useTypedSelector((state) => state.common);
    const dispatch = useDispatch();
    const [localRegion, setRegion] = useState<string>(localStorage.getItem("region")?.toUpperCase() ?? "KR");
    const [adsense, setAdsense] = useState(true);
    const [nitropay, setNitropay] = useState(true);

    let isOverlay: any;
    if (process.env.NODE_ENV === "development") {
        isOverlay = navigator.userAgent.includes("overlay");
    } else {
        isOverlay = location.href.includes("overlay");
    }

    if (isNMP && appMode === "login") {
        dispatch(setAppMode("full"));
    }

    useEffect(() => {
        let isMounted = true;
        if (!isNMP && !playwireAds.includes(localRegion) && !adsenseAds.includes(localRegion)) {
            axios.get(`https://dtapp-player.op.gg/adsense.txt?timestamp=${new Date().getTime()}`).then((res) => {
                if (isMounted) {
                    try {
                        if (res.data === 1) {
                            setAdsense(true);
                            window.api.send("ads", "on");
                        } else {
                            setAdsense(false);
                            window.api.send("ads", "off");
                        }

                    } catch (e) {

                    }
                }
            }).catch(() => {
            });
        }

        return () => {
            isMounted = false;
        };
    }, []);

    useIpcRenderer();

    useEffect(() => {
        const html = document.getElementsByTagName("html")[0];
        html.classList["remove"]("mini", "login");
        if (!isOverlay) {
            html.classList[appMode === "mini" ? "add" : "remove"]("mini");
        }
        html.classList[appMode === "login" ? "add" : "remove"]("login");

        if (localStorage.getItem("isLaunchedBefore") !== "true" && (appMode === "full" || appMode === "login")) {
            dispatch(setIsSettingOpen(true));
        }
    }, [appMode]);

    useEffect(() => {
        setRegion(region);
    }, [region]);

    if (appMode === "full") {
        return (
            <>
                <Header/>
                <Notification/>
                <div className="main">
                    <Route path="/" exact component={MyPage}/>
                    <Route path="/live-op-champions" component={LiveOPChampions}/>
                    <Route path={PAGE_PATH_LIVE_MULTISEARCH} component={apiMultisearch}/>
                    <Route path={PAGE_PATH_LIVE_CHAMPION} component={LiveChampion}/>
                    <Route path={PAGE_PATH_LIVE_INGAME} exact component={Ingame}/>
                    <Route path="/live/ingame/lcu" exact component={IngameLCU}/>
                    <Route path="/champions/:championName" exact component={Champions}/>
                    <Route path="/combos" component={Combos}/>
                    <Route path="/champions" exact component={ChampionStatistics}/>
                    <Route path="/champions/:championName/combos" exact component={ChampionCombos}/>
                    <Route path="/tft" exact component={Tft}/>
                </div>
                <Side/>
                <Settings/>
                <MemberPolicyModal />
                <NoticeModal />
                {!isOverlay &&
                <>
                    {(!isNMP && playwireAds.includes(localRegion))
                        ? <Ads/>
                        : <>
                            {(adsenseAds.includes(localRegion))
                                ? <GlobalAds/>
                                : <>
                                  {(nitropayAds.includes(localRegion) && adsense)
                                    ? <KrAds/>
                                    : <NoAds/>
                                  }
                              </>
                            }
                        </>
                    }
                </>
                }
            </>
        );
    } else if (appMode === "mini") {
        return (
            <>
                <MiniHeader/>
                <div className="mini-main">
                    <Route path="/" exact component={MiniMultisearch}/>
                    <Route path={PAGE_PATH_LIVE_MULTISEARCH} component={MiniMultisearch}/>
                    <Route path={PAGE_PATH_LIVE_CHAMPION} component={MiniChampion}/>
                    <Route path={PAGE_PATH_LIVE_INGAME} component={MiniIngame}/>
                    <Route component={MiniNotfound}/>
                </div>
            </>
        );
    } else if (appMode === "login") {
        return (
            <>
                <Login/>
                <Settings/>
                {!isOverlay &&
                  <>
                      {(!isNMP && playwireAds.includes(localRegion))
                        ? <Ads/>
                        : <>
                            {(adsenseAds.includes(localRegion))
                              ? <GlobalAds/>
                              : <>
                                  {(nitropayAds.includes(localRegion) && adsense)
                                    ? <KrAds/>
                                    : <NoAds/>
                                  }
                              </>
                            }
                        </>
                      }
                  </>
                }
            </>
        );
    } else {
        return (
            <>
                ???
            </>
        )
    }
};

function MiniNotfound() {
    const {pathname} = useLocation();

    const isLivePage = _.includes(
        [
            PAGE_PATH_LIVE_MULTISEARCH,
            PAGE_PATH_LIVE_CHAMPION,
            PAGE_PATH_LIVE_INGAME,
        ],
        pathname
    );

    if (isLivePage) return null;

    return <Redirect to="/"/>;
}

export default App;
