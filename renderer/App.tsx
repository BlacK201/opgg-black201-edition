import React, {useEffect, useState} from "react";
import _ from "lodash";
import Header from "./renewal/components/layouts/Header";
import Side from "./renewal/components/layouts/Side";
import Notification from "./components/layouts/Notification";
import {Redirect, Route, useLocation} from "react-router-dom";
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
import {setAppMode, setIsSettingOpen, setOnlineStatus} from "./redux/slices/common";
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
import OWConsentModal from "./components/Modal/OWConsentModal";
import NMPAds from "./renewal/components/layouts/NMPAds";
import OWAds from "./renewal/components/layouts/OwAds";
import IngameNew from "./renewal/pages/ingameNew";
import ChampionRecommendation from "./renewal/pages/championRecommendation";
import RuneImportModal from "./components/Modal/RuneImportModal";
const {isNMP} = require("./utils/nmp");
const {isOW} = require("./utils/ow");
const {playwireAds, nitropayAds, adsenseAds} = require("./utils/adsByLocale");

const App = () => {
    const {appMode, region} = useTypedSelector((state) => state.common);
    const dispatch = useDispatch();
    const [localRegion, setRegion] = useState<string>(localStorage.getItem("region")?.toUpperCase() ?? "KR");
    const [adsense, setAdsense] = useState(true);
    const [countryCode, setCountryCode] = useState(null);
    const [percentage, setPercentage] = useState(false);
    const [owConsentRequired, setowConsentRequired] = useState(false);
    const eu = ["AD", "AL", "AT", "AX", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FO", "FR", "GB", "GG", "GI", "GR", "HR", "HU", "IE", "IM", "IS", "IT", "JE", "LI", "LT", "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "RU", "SE", "SI", "SJ", "SK", "SM", "UA", "VA", "XK"];
    const na = ["US", "CA"];
    let checkOWConsentInterval = null;
    let countryCodeInterval = null;

    let isOverlay: any;
    if (process.env.NODE_ENV === "development") {
        isOverlay = navigator.userAgent.includes("overlay");
    } else {
        isOverlay = location.href.includes("overlay");
    }

    if (isNMP && appMode === "login") {
        dispatch(setAppMode("full"));
    }

    const updateOnlineStatus = () => {
        dispatch(setOnlineStatus(navigator.onLine));
        window.api.send("online-status", navigator.onLine);
    }

    const help = (e) => {
        if(e.key  === "F1") {
            e.preventDefault();

            if (localStorage.getItem("i18n") === "kr") {
                window.api.openExternal("https://discord.com/channels/765059633873551360/1015113003131228231");
            } else {
                window.api.openExternal("https://discord.com/channels/765059633873551360/1015172032608092181");
            }
        }
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

        if (isOW) {
            const checkOWConsent = () => {
                window.api.invoke("ow-consent-required").then((result) => {
                    setowConsentRequired(result);
                    clearInterval(checkOWConsentInterval);
                });
            }
            checkOWConsent();
            checkOWConsentInterval = setInterval(checkOWConsent, 1000);
        }

        const checkCountryCode = () => {
            window.api.invoke("geo-info").then((result) => {
                if (result) {
                    setCountryCode(result);
                    clearInterval(countryCodeInterval);
                }
            });
        }
        checkCountryCode();
        countryCodeInterval = setInterval(checkCountryCode, 1000);

        window.addEventListener("online", updateOnlineStatus);
        window.addEventListener("offline", updateOnlineStatus);
        window.addEventListener('keydown', help)

        let tmpPercentage = (Math.floor(Math.random() * 100) + 1) <= 10;
        setPercentage(tmpPercentage);
        window.api.send("set-percentage", tmpPercentage);

        return () => {
            window.removeEventListener("online", updateOnlineStatus);
            window.removeEventListener("offline", updateOnlineStatus);
            window.removeEventListener("keydown", help);
            if (checkOWConsentInterval) {
                clearInterval(checkOWConsentInterval);
            }
            if (countryCodeInterval) {
                clearInterval(countryCodeInterval);
            }
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
            dispatch(setIsSettingOpen({
                result: true,
                index: 0
            }));
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
                    <Route path="/live-op-champions" exact component={LiveOPChampions}/>
                    <Route path={PAGE_PATH_LIVE_MULTISEARCH} exact component={apiMultisearch}/>
                    <Route path={PAGE_PATH_LIVE_CHAMPION} exact component={LiveChampion}/>
                    <Route path={PAGE_PATH_LIVE_INGAME} exact component={IngameNew}/>
                    <Route path="/live/ingame/lcu" exact component={IngameLCU}/>
                    <Route path="/champions/:championName" exact component={Champions}/>
                    <Route path="/combos" exact component={Combos}/>
                    <Route path="/champions" exact component={ChampionStatistics}/>
                    <Route path="/champions/:championName/combos" exact component={ChampionCombos}/>
                    <Route path="/live/recommendation" exact component={ChampionRecommendation}/>
                    <Route path="/tft" exact component={Tft}/>
                </div>
                <Side/>
                <Settings/>
                <MemberPolicyModal />
                <RuneImportModal />
                {!isNMP &&
                    <NoticeModal/>
                }
                {(isOW && owConsentRequired) &&
                    <OWConsentModal/>
                }
                {!isOverlay &&
                    <>
                        {(eu.includes(countryCode) && isOW)
                            ? <NoAds/>
                            : <>
                                {(na.includes(countryCode) && isOW && percentage)
                                    ? <NoAds/>
                                    : <>
                                        {(!isNMP && playwireAds.includes(localRegion))
                                            ? <NoAds/>
                                            : <>
                                                {(adsenseAds.includes(localRegion))
                                                    ? <NoAds/>
                                                    : <>
                                                        {(nitropayAds.includes(localRegion) && adsense)
                                                            ? <NoAds/>
                                                            : <NoAds/>
                                                        }
                                                    </>
                                                }
                                            </>
                                        }
                                        {isNMP &&
                                            <NoAds/>
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
                <RuneImportModal />
                {/*{!isOverlay &&*/}
                {/*  <>*/}
                {/*      {(!isNMP && playwireAds.includes(localRegion))*/}
                {/*        ? <Ads/>*/}
                {/*        : <>*/}
                {/*            {(adsenseAds.includes(localRegion))*/}
                {/*              ? <GlobalAds/>*/}
                {/*              : <>*/}
                {/*                  {(nitropayAds.includes(localRegion) && adsense)*/}
                {/*                    ? <KrAds/>*/}
                {/*                    : <NoAds/>*/}
                {/*                  }*/}
                {/*              </>*/}
                {/*            }*/}
                {/*        </>*/}
                {/*      }*/}
                {/*  </>*/}
                {/*}*/}
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
