import { useEffect } from "react";
import {useDispatch} from "react-redux";
import {
    setSummonerInfo,
    setMultisearch,
    setChampion,
    setIngame,
    setCombos,
    // setPatchnotes,
    setIsAdminWarning,
    // setAPMSetting,
    setTipChampion,
    setScale,
    // setFeedbackIsOpen,
    setIsGarena,
    setOpScore,
    setOpscoreFeedbackSent,
    setCurrentLane,
    setAppMode,
    setEOG,
    setMypage,
    setClientLogin,
    setIsLoLGameLive,
    setLoLCurrentGameQueue, setRegion, setMemberPolicyModalIsOpen, setGPM
} from "../redux/slices/common";
import { useHistory } from "react-router-dom";
import {PAGE_PATH_LIVE_CHAMPION, PAGE_PATH_LIVE_INGAME, PAGE_PATH_LIVE_MULTISEARCH, PAGE_PATH_MAIN} from "../constants";
import {useTranslation} from "react-i18next";
import customToastr from "../lib/toastr";
import sendGA4Event from "../utils/ga4";
import {countryHasAds} from "../utils/ads";
import {countryHasAdsAdsense} from "../utils/adsAdsense";
import {playwireAds, nitropayAds, adsenseAds} from "../utils/adsByLocale";
import {useTypedSelector} from "../redux/store";

export const useIpcRenderer = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const { i18n, t } = useTranslation();
    const {summonerName} = useTypedSelector(state => state.common);
    let isGarena = false;

    useEffect(() => {
        window.api.on("admin", (event, data) => {
            dispatch(setIsAdminWarning(true));
        });

        window.api.on("vcredist", (event, data) => {
            localStorage.setItem("vcredist", data);
        });

        window.api.on("toastr", (event, data) => {
            customToastr.success(t(data));
        });

        window.api.on("toast-info", (event, data) => {
            customToastr.info(t(data.text), "", {
                onclick: () => {
                    history.push("/live-op-champions");
                    sendGA4Event("click_live_op_champions_toast", {});
                }
            });
        });

        //current summoner
        window.api.invoke('current-summoner').then((res) => {
            if (res) {
                dispatch(setSummonerInfo(res));
            }
        }).catch(() => {});

        window.api.on("logged-in", (event, data) => {
            if (data) {
                localStorage.setItem("logged-in", "true");
                localStorage.setItem("currentUser", data.displayName);
                dispatch(setSummonerInfo(data));
                history.push("/");
            } else {
                localStorage.setItem("logged-in", "false");
                dispatch(setSummonerInfo({
                    displayName: null,
                    profileIconId: 29
                }));
            }
        });

        // ipcRenderer.on("last-game-id", (event, data) => {
        //     localStorage.setItem("lastGameId", data);
        // });

        window.api.on("set-rso-profile", (event, data) => {
            window.api.invoke("rso-profile").then((response) => {
                if (response?.data) {
                    dispatch(setGPM(response.data));
                    if (data) {
                        window.api.invoke('is-lol-running').then((res) => {
                            if (res) {
                                if (response?.data?.is_owner) {
                                    customToastr.info(t("rso-success"));
                                } else {
                                    customToastr.warning(t("rso-fail"));
                                }
                            } else {
                                customToastr.warning(t("client-login-need"));
                            }
                        }).catch(() => {});
                    }
                } else {
                    customToastr.warning(t("client-login-need"));
                }
            });
        });

        window.api.on("is-garena", (event, data) => {
            dispatch(setIsGarena(data));
            isGarena = data;
        });

        window.api.on("set-region", (event, data) => {
            // if (playwireAds.includes(data) || adsenseAds.includes(data) || nitropayAds.includes(data)) {
            //     window.api.send("ads", "on");
            // } else {
            //     window.api.send("ads", "off");
            // }
            localStorage.setItem("region", data);
            dispatch(setRegion(data));
        });

        window.api.on("set-availability", (event, data) => {
            localStorage.setItem("availability", data);
        });

        window.api.on("change-app-mode-react", (event, data) => {
            dispatch(setAppMode(data));
        });

        window.api.on("enemyPicked", (event, data) => {
            dispatch(setTipChampion(data));
        });

        window.api.on("i18n-changed", (event, language) => {
            i18n.changeLanguage(language);
        });

        window.api.on("scale", (event, data) => {
            dispatch(setScale(data));
        });

        window.api.on("memberPolicyUpdated", (event, data) => {
            dispatch(setMemberPolicyModalIsOpen(true));
        });

        window.api.on("is-solo-rank", (event, data) => {
            if (data.is420 && (localStorage.getItem("alreadyOpggPick") ?? "false") !== "true") {
                localStorage.setItem("alreadyOpggPick", "true");
                localStorage.setItem("lobbyPosition", data.position);
                localStorage.setItem("opggpick", true);
                history.push("/live/recommendation");
            } else {
                localStorage.setItem("alreadyOpggPick", "false");
            }
        });

        // ipcRenderer.on("check-feedback", (event, data) => {
        //     let gameCount = localStorage.getItem("gameCount") || 0;
        //     let feedbackCount = localStorage.getItem("feedbackCount") || 0;
        //     let isSentFeedback = localStorage.getItem("isSentFeedback") === "true";
        //     if (typeof gameCount === "string") {
        //         gameCount = parseInt(gameCount);
        //     }
        //     if (typeof feedbackCount === "string") {
        //         feedbackCount = parseInt(feedbackCount);
        //     }
        //     gameCount += 1;
        //     localStorage.setItem("gameCount", String(gameCount));
        //
        //     if (!isSentFeedback) {
        //         if (gameCount >= 5) {
        //             if (feedbackCount <= 1) {
        //                 localStorage.setItem("feedbackCount", String(feedbackCount + 1));
        //                 dispatch(setFeedbackIsOpen(true));
        //             }
        //         }
        //     }
        // });

        //gameflow
        // const clientStatus = ipcRenderer.sendSync("gameflow");
        // if(clientStatus) {
        //     dispatch(setClientStatus(clientStatus));
        // }
        // ipcRenderer.on("gameflow-changed", (event, data) => {
        //     dispatch(setClientStatus(data));
        // });

        window.api.on("combos", (event, data) => {
            dispatch(setCombos(data));
        })

        // ipcRenderer.on("patchnotes", (event, data) => {
        //     dispatch(setPatchnotes(data));
        // })

        // renewal
        window.api.on("mainpage", (event, data) => {
            history.push(PAGE_PATH_MAIN);
        });

        // tft
        window.api.on("switch-tft", (event, data) => {
            history.push("/tft");
        });

        //multisearch
        window.api.on("multisearch", (event, data) => {
            // dispatch(setOpScore(null));
            if (!isGarena) {
                dispatch(setMultisearch(data));
                // reactGa.pageview(PAGE_PATH_LIVE_MULTISEARCH);
                history.push(PAGE_PATH_LIVE_MULTISEARCH);
                window.api.send("menu", 1);
            }
        });

        window.api.on("champions", (event, data) => {
            // dispatch(setOpScore(null));
            dispatch(setChampion(data));
            // reactGa.pageview(PAGE_PATH_LIVE_CHAMPION);
            history.push(PAGE_PATH_LIVE_CHAMPION);
            window.api.send("menu", 2);
        });

        window.api.on("ingame", (event, data) => {
            if (!isGarena) {
                dispatch(setEOG(null));
                dispatch(setOpScore(null));
                dispatch(setOpscoreFeedbackSent(false));
                dispatch(setIngame(data));
                // reactGa.pageview(PAGE_PATH_LIVE_INGAME);
                history.push(PAGE_PATH_LIVE_INGAME);
                window.api.send("menu", 3);
            }
        });

        window.api.on("opscore", (event, data) => {
            dispatch(setOpScore(data));
        });

        window.api.on("eog", (event, data) => {
            dispatch(setEOG(data));
        });

        window.api.on("mypage", (event, data) => {
            dispatch(setMypage(data));
        });

        window.api.on("current-lane", (event, data) => {
            dispatch(setCurrentLane(data));
        });

        window.api.on("client-login", (event, data) => {
            dispatch(setClientLogin(true));
        });

        // mini remote
        window.api.on("mini-menu-menu1", (event, data) => {
            history.push(PAGE_PATH_LIVE_MULTISEARCH);
        });
        window.api.on("mini-menu-menu2", (event, data) => {
            history.push(PAGE_PATH_LIVE_CHAMPION);
        });
        window.api.on("mini-menu-menu3", (event, data) => {
            history.push(PAGE_PATH_LIVE_INGAME);
        });

        window.api.on("is-lol-game-live", (event, data) => {
            dispatch(setIsLoLGameLive(data));
        });

        window.api.on("lol-current-game-queue", (event, data) => {
            dispatch(setLoLCurrentGameQueue(data));
        });

        return () => {
            window.api.eventNames().forEach((channel) => {
                window.api.removeAllListeners(channel);
            });
        }
    }, [])

};
