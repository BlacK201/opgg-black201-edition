import React, {ChangeEvent, useEffect, useRef, useState} from 'react';
import {useTranslation} from "react-i18next";
import {useDispatch} from "react-redux";
import {tipChampionDataType} from "../../redux/slices/common.d";
import _ from "lodash";
import Tippy from '@tippyjs/react';
import tippy from 'tippy.js';
import {useTypedSelector} from "../../redux/store";
import i18next from "i18next";
import {useLocation, useHistory, NavLink} from "react-router-dom";
import {
    setChampionOverview,
    setCombos,
    setCurrentChampion
} from "../../redux/slices/common";
import Error from "../components/common/Error";
import sendGA4Event from "../../utils/ga4";
import Dropdown from "../components/common/Dropdown";

const runesMetaData = require("../../../assets/data/meta/runes.json");
const championsMetaData = require("../../../assets/data/meta/champions.json");
const itemsMetaData = require("../../../assets/data/meta/items.json");
const {isNMP} = require("../../utils/nmp");
import customToastr from "../../lib/toastr";
import axios from "axios";

const tabContent = [
    {
        title: "TOP",
        icon: "TOP.svg",
        link: "top"
    },
    {
        title: "JUNGLE",
        icon: "JUNGLE.png",
        link: "jungle"
    },
    {
        title: "MID",
        icon: "MID.png",
        link: "mid"
    },
    {
        title: "ADC",
        icon: "ADC.png",
        link: "bottom"
    },
    {
        title: "SUPPORT",
        icon: "SUPPORT.png",
        link: "support"
    }
];

interface DropdownOptionType {
    value: string | number;
    label?: string;
    icon?: string;
    display?: string;
}

const dropboxRegionContent = [
    {
        value: "global",
        label: "GLOBAL",
        icon: "../../assets/images/01-icon-icon-global.svg"
    },
    {
        value: "kr",
        label: "KR",
        icon: "../../assets/images/01-icon-icon-kr.svg"
    },
    {
        value: "na",
        label: "NA",
        icon: "../../assets/images/01-icon-icon-na.svg"
    },
    {
        value: "eune",
        label: "EUNE",
        icon: "../../assets/images/01-icon-icon-eun.svg"
    },
    {
        value: "euw",
        label: "EUW",
        icon: "../../assets/images/01-icon-icon-euw.svg"
    },
    {
        value: "br",
        label: "BR",
        icon: "../../assets/images/01-icon-icon-br.svg"
    },
    {
        value: "jp",
        label: "JP",
        icon: "../../assets/images/01-icon-icon-jp.svg"
    },
    {
        value: "lan",
        label: "LAN",
        icon: "../../assets/images/01-icon-icon-lan.svg"
    },
    {
        value: "las",
        label: "LAS",
        icon: "../../assets/images/01-icon-icon-las.svg"
    },
    {
        value: "oce",
        label: "OCE",
        icon: "../../assets/images/01-icon-icon-oce.svg"
    },
    {
        value: "ru",
        label: "RU",
        icon: "../../assets/images/01-icon-icon-ru.svg"
    },
    {
        value: "tr",
        label: "TR",
        icon: "../../assets/images/01-icon-icon-tr.svg"
    },
];

const dropboxTierFilterContent = [
    {
        value: "ibsg",
        label: "Gold -",
    },
    {
        value: "gold_plus",
        label: "Gold +",
    },
    {
        value: "platinum_plus",
        label: "Platinum +",
    },
    {
        value: "diamond_plus",
        label: "Diamond +",
    },
    {
        value: "master_plus",
        label: "Master +",
    }
];

const riftQueueIds = [400, 420, 430, 440, 700];
const rankedQueueIds = [420, 440];

const Champions = ({champion}: any) => {
    const {t} = useTranslation();
    const _location = useLocation();
    const dispatch = useDispatch();
    const history = useHistory();
    const {championOverview, combos, isAutoRune} = useTypedSelector(state => state.common);
    const [videoTooltipHoverId, setIsVideoTooltipHover] = useState<string>();
    const [tabIndex, setTabIndex] = useState<number>(0);
    const [laneTipOpened, setLaneTipOpened] = useState<boolean>(false);
    const [perkCategory, setPerkCategory] = useState<number>(0);
    const [perkPage, setPerkPage] = useState<number>(0);
    const [newData, setNewData] = useState<any>();
    const [data, setData] = useState<any>();
    const [lane, setLane] = useState<any>();
    const [tips, setTips] = useState<any>();
    const [tip, setTip] = useState<any>("");
    const [queueId, setQueueId] = useState<any>();
    const [counters, setCounters] = useState<any>();
    const [isFromStatistics, setIsFromStatistics] = useState<boolean>(false);
    const [showError, setShowError] = useState<boolean>(false);
    const [currentPerkPage, setCurrentPerkPage] = useState<number>(-1);
    const [region, setRegion] = useState<string>(localStorage.getItem("selected-region")?.toUpperCase() ?? localStorage.getItem("region")?.toUpperCase() ?? "KR");
    const [versionFilter, setVersionFilter] = useState<string>(localStorage.getItem("version-filter") ?? "");
    const [selectedRegion, setSelectedRegion] = useState<DropdownOptionType>(_.filter(dropboxRegionContent, {value: localStorage.getItem("region")?.toUpperCase() ?? "KR"})[0] ?? {
        value: region.toLowerCase(),
        label: region,
        icon: `../../assets/images/01-icon-icon-${region.toLowerCase()}.svg`
    });
    const [tierFilter, setTierFilter] = useState<string>(localStorage.getItem("tier-filter") ?? "platinum_plus");
    const [selectedTierFilter, setSelectedTierFilter] = useState<DropdownOptionType>(_.filter(dropboxTierFilterContent, {value: localStorage.getItem("tier-filter") ?? "platinum_plus"})[0] ?? {
        value: "platinum_plus",
        label: "Platinum+",
    });
    const [versionDropboxContent, setVersionDropboxContent] = useState([{
        value: "",
        label: "Latest"
    }]);
    const [selectedVersionFilter, setSelectedVersionFilter] = useState<DropdownOptionType>(versionDropboxContent[0]);
    const [buildIndex, setBuildIndex] = useState<any>(0);
    const [newFeatureTip, setNewFeatureTip] = useState<boolean>(false);
    const [newFeatureTip2, setNewFeatureTip2] = useState<boolean>(false);
    const [highlightFilters, setHighlightFilters] = useState<boolean>(false);

    let isOverlay;
    if (process.env.NODE_ENV === "development") {
        isOverlay = navigator.userAgent.includes("overlay");
    } else {
        isOverlay = location.href.includes("overlay");
    }

    useEffect(() => {
        let isMounted = true;

        if (isMounted) {
            axios.get(`https://lol-api-champion.op.gg/api/${region}/champions/ranked/versions`).then((res) => {
                if (res && isMounted) {
                    setVersionDropboxContent([]);
                    res.data.data.map((v: any, i: number) => {
                        if (!versionFilter) {
                            if (i === 0) {
                                setSelectedVersionFilter({
                                    value: v,
                                    label: v
                                });
                            }
                        }
                        if (i < 13) {
                            setVersionDropboxContent(versionDropboxContent => [...versionDropboxContent, {
                                value: v,
                                label: v
                            }]);
                        }
                    });
                    if (versionFilter) {
                        setSelectedVersionFilter({
                            value: versionFilter,
                            label: versionFilter
                        })
                    }
                }
            });

            if (!combos) {
                window.api.invoke("get-combos").then((tmp: any) => {
                    dispatch(setCombos(tmp));
                });
            }
        }

        if (_location.state) {
            window.api.invoke("get-champion-data", [_location.state.lane, _location.state.id, 430, false, region, tierFilter, -1, versionFilter]).then((tmp) => {
                if (tmp && isMounted) {
                    dispatch(setChampionOverview(tmp));
                    setIsFromStatistics(true);
                    setData(tmp.data);
                    setLane(tmp.lane);
                    setTips(tmp.tips);
                    setQueueId(tmp.queueId);
                    setCounters(tmp.counters);
                    setTabIndex(["top", "jungle", "mid", "adc", "support"].indexOf(tmp.lane));

                    try {
                        sendGA4Event("view_champion_page", {
                            "menu_name": "full",
                            "champion_name": tmp.data.summary.id,
                            "lane": tmp.lane
                        });
                    } catch(e) {

                    }
                }
            }).catch((e) => {
                console.log(e);
            });
        } else if (champion) {
            setPerkPage(0);
            setPerkCategory(0);
            if (isAutoRune) {
                setCurrentPerkPage(0);
            } else {
                setCurrentPerkPage(-1);
            }
            setIsFromStatistics(false);
            setData(champion.data);
            setLane(champion.lane);
            setTips(champion.tips);
            setQueueId(champion.queueId);
            setCounters(champion.counters);
            setTabIndex(["top", "jungle", "mid", "adc", "support"].indexOf(champion.lane));

            try {
                sendGA4Event("view_champion_page", {
                    "menu_name": "full",
                    "champion_name": champion.data.summary.id,
                    "lane": champion.lane
                });
            } catch (e) {}
        } else if (championOverview) {
            setIsFromStatistics(true);
            setData(championOverview.data);
            setLane(championOverview.lane);
            setTips(championOverview.tips);
            setQueueId(championOverview.queueId);
            setCounters(championOverview.counters);
            setTabIndex(["top", "jungle", "mid", "adc", "support"].indexOf(championOverview.lane));

            try {
                sendGA4Event("view_champion_page", {
                    "menu_name": "full",
                    "champion_name": championOverview.data.summary.id,
                    "lane": championOverview.lane
                });
            } catch (e) {

            }
        }

        let tmpTimeout = setTimeout(() => {
            setShowError(true);
        }, 9000);

        return () => {
            isMounted = false;
            clearTimeout(tmpTimeout);
        }
    }, []);

    useEffect(() => {
        if (champion) {
            setPerkPage(0);
            setPerkCategory(0);
            if (isAutoRune) {
                setCurrentPerkPage(0);
            }  else {
                setCurrentPerkPage(-1);
            }
            setIsFromStatistics(false);
            setData(champion.data);
            setLane(champion.lane);
            setTips(champion.tips);
            setQueueId(champion.queueId);
            setCounters(champion.counters);
            setTabIndex(["top", "jungle", "mid", "adc", "support"].indexOf(champion.lane));
        }
    }, [champion]);

    useEffect(() => {
        if (newData) {
            if (isFromStatistics !== false) {
                setIsFromStatistics(true);
            }
            setData(newData.data);
            setLane(newData.lane);
            setTips(newData.tips);
            setQueueId(newData.queueId);
            setCounters(newData.counters);
            setTabIndex(["top", "jungle", "mid", "adc", "support"].indexOf(newData.lane));
        }
    }, [newData]);

    useEffect(() => {
        setTabIndex(["top", "jungle", "mid", "adc", "support"].indexOf(lane));
    }, [lane]);

    useEffect(() => {
        // setLaneTipOpened(false);
        if (data?.summoner_spells?.length === 0 ||
            data?.skill_masteries?.length === 0 ||
            data?.starter_items?.length === 0 ||
            data?.core_items?.length === 0 ||
            data?.rune_pages?.length === 0) {

            setHighlightFilters(true);
            customToastr.warning(t("change-filter"));
        } else {
            setHighlightFilters(false);
        }
    }, [data]);

    let spellIdtoKey: any = {
        1: "SummonerBoost",
        21: "SummonerBarrier",
        14: "SummonerDot",
        3: "SummonerExhaust",
        4: "SummonerFlash",
        6: "SummonerHaste",
        7: "SummonerHeal",
        13: "SummonerMana",
        30: "SummonerPoroRecall",
        31: "SummonerPoroThrow",
        11: "SummonerSmite",
        39: "SummonerSnowURFSnowball_Mark",
        32: "SummonerSnowball",
        12: "SummonerTeleport"
    }

    const onClickChampionName = (championName = "", lane="") => () => {
        window.api.send("openChampionPage", {
            key: championName,
            lane: lane
        });
    }

    const onClickPerkCategory = (categoryId: number) => () => {
        setPerkCategory(categoryId);
        setPerkPage(categoryId * 2);
        if (isAutoRune) {
            setCurrentPerkPage(categoryId * 2);
            window.api.send("update-perk-page", {
                lane: lane,
                page: categoryId * 2,
                clicked: true
            });
        }
    }

    const onClickPerkPage = (pageId: number) => () => {
        setPerkPage(pageId);
        if (isAutoRune) {
            setCurrentPerkPage(pageId);
            window.api.send("update-perk-page", {
                lane: lane,
                page: pageId,
                clicked: true
            });
        }
    }

    useEffect(() => {
        // setRuneAutoSave(isAutoRune);
        if (!isAutoRune) {
            setCurrentPerkPage(-1);
        } else {
            setCurrentPerkPage(perkPage);
            window.api.send("update-perk-page", {
                lane: lane,
                page: perkPage,
                clicked: true
            });
        }
    }, [isAutoRune]);

    // const onChangeRuneAutoSave = (categoryId: number) => (e: ChangeEvent<HTMLInputElement>) => {
    //     const {checked} = e.target;
    //     setRuneAutoSave(checked);
    //     localStorage.setItem("autorune", String(checked));
    //     ipcRenderer.send("autorune", checked);
    //     dispatch(setIsAutoRune(checked));
    //     if (!isFromStatistics && !runeAutoSave) {
    //         ipcRenderer.send("update-perk-page", {
    //             lane: lane,
    //             page: categoryId * 2,
    //             clicked: true
    //         });
    //     }
    // };

    const onClickRuneExport = (pageId: number) => () => {
        if (!isFromStatistics) {
            setCurrentPerkPage(pageId);
            window.api.send("update-perk-page", {
                lane: lane,
                page: pageId,
                clicked: true
            });
        }
    }

    const onGeneralBuildClick = () => {
        if (data) {
            if (buildIndex !== 0) {
                setBuildIndex(0);
                if (isFromStatistics) {
                    window.api.invoke("get-champion-data", [tabContent[tabIndex].title, data?.summary.id, queueId, false, region, tierFilter, -1]).then((tmp) => {
                        if (tmp) {
                            dispatch(setChampionOverview(tmp));
                            setNewData(tmp);
                        }
                    });
                } else {
                    window.api.send("update-champion-lane", [tabContent[tabIndex].title, data?.summary.id, queueId, !isFromStatistics, region, tierFilter]);
                }
            }
        }
    }

    const onVSBuildClick = (forceClick=false) => {
        if (data) {
            setNewFeatureTip2(false);
            if (tip) {
                if (buildIndex !== 1 || forceClick) {
                    setBuildIndex(1);
                    sendGA4Event("click_opponent_build", {});
                    window.api.invoke("get-champion-data", [tabContent[tabIndex].title, data?.summary.id, queueId, true, region, tierFilter, _.find(championsMetaData.data, {key: tip.name})?.id]).then((tmp) => {
                        if (tmp) {
                            dispatch(setChampionOverview(tmp));
                            setNewData(tmp);
                        }
                    });
                }
            } else {
                customToastr.error(t("choose-vs-first"));
                setNewFeatureTip(true);
            }
        }
    }

    const refresh = () => {
        customToastr.success(t("champion-refresh"));
        if (isFromStatistics) {
            window.api.invoke("get-champion-data", [tabContent[tabIndex].title, data?.summary.id, queueId, false, region, tierFilter, -1, versionFilter]).then((tmp) => {
                if (tmp) {
                    dispatch(setChampionOverview(tmp));
                    setNewData(tmp);
                }
            });
        } else {
            window.api.send("update-champion-lane", [lane, data?.summary.id, queueId, !isFromStatistics, region, tierFilter, versionFilter]);
        }
    }


    useEffect(() => {
        let tipVSButton = document.getElementsByClassName("btn-tip-vs")[0];
        if (tipVSButton) {
            tipVSButton.removeEventListener("click", onVSBuildClick);
            tipVSButton.addEventListener("click", onVSBuildClick);
        }

        if (buildIndex === 1) {
            onVSBuildClick(true);
        }
        if (newFeatureTip) {
            setNewFeatureTip2(true);
        }
        setNewFeatureTip(false);
    }, [tip]);

    if (data && data?.is_rip) {
        dispatch(setCurrentChampion(data.id));
        // dispatch(setIsErrorOpen(true));
        return (
            <Error error={404} msgType={"isRip"} isMini={false} champion={data.id} />
        )
    }

    if (data && (tabIndex != -1 || lane === "aram" || lane === "urf")) {
        let tmp: number[] = [];
        let cnt = 0;
        let formatter = new Intl.NumberFormat();

        let positionData = null;
        if (data?.summary.positions) {
            positionData = _.filter(data?.summary.positions, {name: tabContent[tabIndex].title})[0];
        } else {
            positionData = lane;
        }

        let metaData = _.find(championsMetaData.data, {id: data?.summary.id});
        let combo = _.find(combos, {
            championName: metaData?.key
        })

        const handleSelectedPosition = (value: any) => {
            localStorage.setItem("selected-region", value.value);
            setRegion(value.label);
            setSelectedRegion(value);

            setBuildIndex(0);
            setLaneTipOpened(false);
            setTabIndex(tabIndex);
            setPerkCategory(0);
            setPerkPage(0);
            if (isFromStatistics) {
                window.api.invoke("get-champion-data", [tabContent[tabIndex].title, data?.summary.id, queueId, false, value.value, tierFilter, -1]).then((tmp) => {
                    if (tmp) {
                        dispatch(setChampionOverview(tmp));
                        setNewData(tmp);
                    }
                });
            } else {
                window.api.send("update-champion-lane", [tabContent[tabIndex].title, data?.summary.id, queueId, !isFromStatistics, value.value, tierFilter]);
            }
        };

        const handleSelectedTierFilter = (value: any) => {
            localStorage.setItem("tier-filter", value.value);
            setTierFilter(value.value);
            setSelectedTierFilter(value);

            setBuildIndex(0);
            setLaneTipOpened(false);
            setTabIndex(tabIndex);
            setPerkCategory(0);
            setPerkPage(0);
            if (isFromStatistics) {
                window.api.invoke("get-champion-data", [tabContent[tabIndex].title, data?.summary.id, queueId, false, region, value.value, -1]).then((tmp) => {
                    if (tmp) {
                        dispatch(setChampionOverview(tmp));
                        setNewData(tmp);
                    }
                });
            } else {
                window.api.send("update-champion-lane", [tabContent[tabIndex].title, data?.summary.id, queueId, !isFromStatistics, region, value.value]);
            }
        }

        const handleSelectedVersionFilter = (value: any) => {
            localStorage.setItem("version-filter", value.value);
            setSelectedVersionFilter(value);
            setVersionFilter(value.value);

            setBuildIndex(0);
            setLaneTipOpened(false);
            setTabIndex(tabIndex);
            setPerkCategory(0);
            setPerkPage(0);

            let lane = "none";
            if (tabContent[tabIndex]) {
                lane = tabContent[tabIndex].title;
            }
            if (isFromStatistics) {
                window.api.invoke("get-champion-data", [tabContent[tabIndex].title, data?.summary.id, queueId, false, region, tierFilter, -1, value.value]).then((tmp) => {
                    if (tmp) {
                        dispatch(setChampionOverview(tmp));
                        setNewData(tmp);
                    }
                });
            } else {
                window.api.send("update-champion-lane", [lane, data?.summary.id, queueId, !isFromStatistics, region, tierFilter, value.value]);
            }
        }

        return (
            <div className="main-container contents-container">
                <div className="champion-filters">
                    {isFromStatistics &&
                    <div className="champion-go-back" onClick={() => history.goBack()}>
                        <div className={"champion-go-back-button"}>
                            <img src={"../../assets/images/icon-arrow-prev.svg"}/>
                        </div>
                        <div style={{marginLeft: "12px"}}>{t("sidebar.tier")}</div>
                    </div>
                    }
                    <Tabs
                        index={tabIndex}
                        setIndex={setTabIndex}
                        setCategory={setPerkCategory}
                        setLaneTipOpened={setLaneTipOpened}
                        setPage={setPerkPage}
                        content={tabContent}
                        championId={data.summary.id}
                        queueId={queueId}
                        lane={lane}
                        data={data}
                        isFromStatistics={isFromStatistics}
                        setNewData={setNewData}
                        setBuildIndex={setBuildIndex} />
                    {(riftQueueIds.includes(queueId) || isFromStatistics) &&
                    <>
                        <Dropdown
                            options={dropboxRegionContent}
                            value={selectedRegion}
                            onChange={handleSelectedPosition}
                            highlight={highlightFilters} />
                        <Dropdown
                            options={dropboxTierFilterContent}
                            value={selectedTierFilter}
                            onChange={handleSelectedTierFilter}
                            highlight={highlightFilters} />
                    </>
                    }
                    <Dropdown
                        options={versionDropboxContent}
                        value={selectedVersionFilter}
                        onChange={handleSelectedVersionFilter}
                        highlight={highlightFilters} />
                    {combo && !isOverlay &&
                    <NavLink
                        to={{
                            pathname: `/champions/${data.summary.id}/combos`,
                            state: {
                                metaData: metaData
                            }
                        }}
                        draggable={false}
                    >
                        <div className="champion-button-combo-video"><img src={"../../assets/images/img-sidebar-combo.svg"}
                                                                          style={{
                                                                              width: "16px",
                                                                              marginRight: "4px"
                                                                          }}/> {t("live.feature.champion.combo-video")}
                        </div>
                    </NavLink>
                    }
                </div>
                {tips && <LaneTip queueId={queueId} laneTipOpened={laneTipOpened} setLaneTipOpened={setLaneTipOpened}
                                  tips={tips[lane]} championId={data.summary.id} tip={tip} setTip={setTip} newFeatureTip={newFeatureTip}/>}
                <div className="champion-contents" style={{marginTop: `${tips ? "" : "52px"}`}}>
                    <div className="champion-main-image">
                        {/*피들스틱 분기처리 Fiddlesticks_0.jpg FiddleSticks_0.jpg*/}
                        {data?.summary.id === 9 ?
                            <img
                                src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/FiddleSticks_0.jpg`}/>
                            :
                            <img
                                src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${_.find(championsMetaData.data, {id: data?.summary.id})?.key}_0.jpg`}/>
                        }
                    </div>
                    {positionData && positionData !== "aram" && positionData !== "urf" &&
                    <div className="champion-tier">
                        <img
                            src={`../../assets/images/optier-${positionData.stats.tier_data.tier}.svg`}/>
                    </div>
                    }
                    <div className="champion-refresh" onClick={refresh}>
                        <img
                          src={`../../assets/images/icon-refresh.svg`}/>
                    </div>

                    <div className="champion-contents-left">
                        <div className="champion-contents-left-top">
                            <div className="champion-title">
                                <div className="champion-title-name" onClick={onClickChampionName(metaData?.key, lane)}>{t(`champions.${data?.summary.id}`)}</div>
                                <div className="champion-title-build" onClick={onClickChampionName(metaData?.key, lane)}>Build for {lane} <img
                                    src={"../../assets/images/icon-link.svg"} style={{marginTop: "4px", marginLeft: "8px"}}/>
                                </div>
                            </div>

                            <div className="champion-contents-row">
                                <div className="champion-contents-wrapper">
                                    <div className="champion-contents-title" style={{width: "94px"}}>
                                        {t("live.feature.champion.summoner-spells")}
                                    </div>
                                    <div className="champion-contents-container">
                                        {data.summoner_spells?.length === 0 &&
                                        <div>No data</div>
                                        }
                                        {data.summoner_spells?.length >= 1 &&
                                        <>
                                            <img
                                                src={`https://opgg-static.akamaized.net/images/lol/spell/${spellIdtoKey[data?.summoner_spells[0].ids[0]]}.png?image=c_scale,q_auto,w_28&v=1626880099`}/>
                                            <img
                                                src={`https://opgg-static.akamaized.net/images/lol/spell/${spellIdtoKey[data?.summoner_spells[0].ids[1]]}.png?image=c_scale,q_auto,w_28&v=1626880099`}/>
                                        </>
                                        }
                                    </div>
                                </div>

                                <div className="champion-contents-wrapper">
                                    <div
                                        className="champion-contents-title">{t("live.feature.champion.skill-builds")}</div>
                                    <div className="champion-contents-container flex-direction-column"
                                         style={{height: "68px"}}>
                                        {data?.skill_masteries?.length >= 1 &&
                                        <>
                                            <div className="champion-contents-container-row">
                                                <Tippy placement="bottom" content={<VideoTooltip isHover={videoTooltipHoverId === "P"}
                                                                              championId={data.summary.id}
                                                                              skillId={"P"}/>}>
                                                    <div className="skills skills__P"
                                                         onMouseEnter={() => setIsVideoTooltipHover("P")}
                                                         onMouseLeave={() => setIsVideoTooltipHover("")}>
                                                        <img
                                                            src={`${t(`skills.${data?.summary.id}.P.image_url`)}?image=c_scale,q_auto,w_28`}/>
                                                    </div>
                                                </Tippy>
                                                <Tippy placement="bottom" content={<VideoTooltip isHover={videoTooltipHoverId === "R"}
                                                                              championId={data.summary.id}
                                                                              skillId={"R"}/>}>
                                                    <div className="skills skills__R"
                                                         onMouseEnter={() => setIsVideoTooltipHover("R")}
                                                         onMouseLeave={() => setIsVideoTooltipHover("")}>
                                                        <img
                                                            src={`${t(`skills.${data?.summary.id}.R.image_url`)}?image=c_scale,q_auto,w_28`}/>
                                                        <div></div>
                                                    </div>
                                                </Tippy>
                                                {data?.skill_masteries[0].ids.map((skill, index) => {
                                                    return (
                                                        <>
                                                            <Tippy placement="bottom" content={<VideoTooltip
                                                                isHover={videoTooltipHoverId === skill}
                                                                championId={data.summary.id} skillId={skill}/>}>
                                                                <div
                                                                    className={`skills skills-bordered skills__${skill}`}
                                                                    onMouseEnter={() => setIsVideoTooltipHover(skill)}
                                                                    onMouseLeave={() => setIsVideoTooltipHover("")}>
                                                                    <img
                                                                        src={`${t(`skills.${data?.summary.id}.${skill}.image_url`)}?image=c_scale,q_auto,w_28`}/>
                                                                    <div></div>
                                                                </div>
                                                            </Tippy>
                                                            {index < 2 && <img className="arr-right"
                                                                               src="../../assets/images/icon-arrow-right.svg"/>}
                                                        </>
                                                    )
                                                })}
                                            </div>
                                            <div className="champion-contents-container-row">
                                                {data?.skills[0].order.map((skill) => (
                                                    <div
                                                        className={`champion-contents-container-row-skill-wrapper champion-contents-container-row-skill-wrapper__${skill}`}></div>
                                                ))}
                                            </div>
                                        </>
                                        }
                                        {data?.skill_masteries?.length === 0 &&
                                        <div style={{fontSize: "12px", color: "#7b7a8e"}}>No data</div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="champion-contents-left-bottom">
                            <div className="champion-contents-row">
                                <div className="champion-items-wrapper">
                                    <div
                                        className="champion-contents-title">{t("live.feature.champion.starter-item")}</div>
                                    <div className="champion-items-row">
                                        {data?.starter_items?.map((starter, index) => {
                                            return (
                                                <>
                                                    {index === 0 && starter.ids.map((id) => {
                                                        return (
                                                            <Tippy content={<div
                                                                dangerouslySetInnerHTML={{__html: t(`items.${id}.tooltip`)}}/>}>
                                                                <img className="img-margin-8"
                                                                     src={`https://opgg-static.akamaized.net/images/lol/item/${id}.png?image=q_auto:best,w_28`}/>
                                                            </Tippy>
                                                        )
                                                    })}
                                                </>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="champion-items-wrapper champion-items-wrapper__2">
                                    <div
                                        className="champion-contents-title">{t("live.feature.champion.recommend-build")}</div>
                                    <div className="champion-items-row">
                                        {data?.core_items?.map((items, index) => {
                                            return (
                                                <>
                                                    {index === 0 && items.ids.map((id, i) => {
                                                        return (
                                                            <>
                                                                {i < 3 &&
                                                                <Tippy content={<div
                                                                    dangerouslySetInnerHTML={{__html: t(`items.${id}.tooltip`)}}/>}>
                                                                    {_.find(itemsMetaData.data, {id: id}) && _.find(itemsMetaData.data, {id: id})?.is_mythic
                                                                        ? <img style={{borderRadius: "14px", border: "1px solid #ff4141"}}
                                                                            src={`https://opgg-static.akamaized.net/images/lol/item/${id}.png?image=q_auto:best,w_28`}/>
                                                                        : <img
                                                                            src={`https://opgg-static.akamaized.net/images/lol/item/${id}.png?image=q_auto:best,w_28`}/>
                                                                    }
                                                                </Tippy>}
                                                                {i < 2 && <img className="arr-right"
                                                                               src="../../assets/images/icon-arrow-right.svg"/>}
                                                            </>
                                                        )
                                                    })}
                                                </>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="champion-items-wrapper champion-items-wrapper__3">
                                    <div className="champion-contents-title">
                                        {t("live.feature.champion.core-items")}
                                    </div>
                                    <div className="champion-items-row">
                                        {data?.core_items?.map((items) => {
                                            return (
                                                <>
                                                    {items.ids.map((id) => {
                                                        if (tmp.indexOf(id) === -1) {
                                                            tmp.push(id);
                                                            cnt += 1;
                                                            if (cnt < 10) {
                                                                return (
                                                                    <>
                                                                        <Tippy content={<div
                                                                            dangerouslySetInnerHTML={{__html: t(`items.${id}.tooltip`)}}/>}>
                                                                            {_.find(itemsMetaData.data, {id: id}) && _.find(itemsMetaData.data, {id: id})?.is_mythic
                                                                                ? <img style={{borderRadius: "14px", border: "1px solid #ff4141"}}
                                                                                       className="img-margin-8"
                                                                                       src={`https://opgg-static.akamaized.net/images/lol/item/${id}.png?image=q_auto:best,w_28`}/>
                                                                                : <img
                                                                                    className="img-margin-8"
                                                                                    src={`https://opgg-static.akamaized.net/images/lol/item/${id}.png?image=q_auto:best,w_28`}/>
                                                                            }
                                                                        </Tippy>
                                                                    </>
                                                                )
                                                            }
                                                        }
                                                    })}
                                                </>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="champion-contents-row">
                                <div className="champion-recommend-build">
                                    <div className="champion-contents-title champion-contents-title-w-line">
                                        {t("live.feature.champion.recommend-item-builds")}
                                    </div>
                                    {data?.core_items?.map((items, index) => {
                                        if (index < 3) {
                                            return (
                                                <>
                                                    <div className="champion-items-row padding-left">
                                                        {items.ids.map((id, i) => {
                                                            return (
                                                                <>
                                                                    {i < 3 &&
                                                                    <Tippy content={<div
                                                                        dangerouslySetInnerHTML={{__html: t(`items.${id}.tooltip`)}}/>}>
                                                                        {_.find(itemsMetaData.data, {id: id}) && _.find(itemsMetaData.data, {id: id})?.is_mythic
                                                                            ? <img style={{borderRadius: "14px", border: "1px solid #ff4141"}}
                                                                                   src={`https://opgg-static.akamaized.net/images/lol/item/${id}.png?image=q_auto:best,w_28`}/>
                                                                            : <img
                                                                                src={`https://opgg-static.akamaized.net/images/lol/item/${id}.png?image=q_auto:best,w_28`}/>
                                                                        }
                                                                    </Tippy>}
                                                                    {i < 2 &&
                                                                    <img className="arr-right arr-right-margin"
                                                                         src="../../assets/images/icon-arrow-right.svg"/>}
                                                                </>
                                                            )
                                                        })}
                                                        <div style={{display: "flex", flexDirection: "row"}}>
                                                            <div>{t("live.feature.champion.win-rate")}
                                                                <span style={{width: "40px", display: "inline-block", textAlign: "right"}}>{(items.win / items.play * 100).toFixed(2)}%</span> {t("live.feature.champion.pick-rate")}
                                                                <span style={{width: "40px", display: "inline-block", textAlign: "right"}}>{(items.pick_rate * 100).toFixed(2)}%</span></div>
                                                            <div><span style={{width: "40px", display: "inline-block", textAlign: "right", color: "#7b7a8e", fontWeight: "normal", marginLeft: 0}}>{formatter.format(items.play)}</span> Matches</div>
                                                        </div>
                                                    </div>
                                                </>
                                            )
                                        }
                                    })}
                                </div>
                                <div className="champion-boots">
                                    <div
                                        className="champion-contents-title champion-contents-title-w-line">{t("live.feature.champion.boots")}</div>
                                    {data?.boots?.map((items, index) => {
                                        if (index < 3) {
                                            return (
                                                <>
                                                    <div className="champion-boots-row">
                                                        {items.ids.map((id) => {
                                                            return (
                                                                <>
                                                                    <Tippy content={<div
                                                                        dangerouslySetInnerHTML={{__html: t(`items.${id}.tooltip`)}}/>}>
                                                                        <img
                                                                            src={`https://opgg-static.akamaized.net/images/lol/item/${id}.png?image=q_auto:best,w_28&v=1626880099`}/>
                                                                    </Tippy>
                                                                </>
                                                            )
                                                        })}
                                                        <div>
                                                            <div>{t("win-ratio-short")} <span>{(items.win / items.play * 100).toFixed(2)}%</span>
                                                            </div>
                                                            <div>{formatter.format(items.play)} Matches</div>
                                                        </div>
                                                    </div>
                                                </>
                                            )
                                        }
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="champion-contents-right">
                        {rankedQueueIds.includes(queueId) &&
                        <div className={"rune-buttons-container"}>
                            <div className={`btn-general-rune ${buildIndex === 0 ? "btn-enabled" : ""}`}
                                 onClick={onGeneralBuildClick}>{t("general-build")}
                            </div>
                            <div className={`btn-vs-rune ${buildIndex === 1 ? "btn-enabled" : ""}`}
                                 style={{
                                     border: `${newFeatureTip2 ? "2px solid #fff" : ""}`
                                 }}
                                 onClick={onVSBuildClick}>{t("vs-build2")} {tip ? t(`champions.${_.find(championsMetaData.data, {key: tip.name})?.id}`) : t("champion")} {t("vs-build")}
                            </div>
                        </div>
                        }
                        {data?.rune_pages?.map((rune_page, index) => {
                            if (index < 2) {
                                return (
                                    <>
                                        <div className="champion-perk-container">
                                            <div
                                                className={`champion-perk ${perkCategory === index ? "champion-perk-active champion-perk-opened" : "champion-perk-closed"}`}
                                                onClick={onClickPerkCategory(index)}>
                                                <Tippy content={<div
                                                    dangerouslySetInnerHTML={{__html: t(`perkStyles.${rune_page.primary_page_id}.tooltip`)}}/>}>
                                                    <div className={"perk-image-wrapper"} style={{marginRight: "4px"}}>
                                                        <img
                                                            src={`https://opgg-static.akamaized.net/images/lol/perkStyle/${rune_page.primary_page_id}.png?image=c_scale,q_auto,w_20`}/>
                                                    </div>
                                                </Tippy>
                                                <Tippy content={<div
                                                    dangerouslySetInnerHTML={{__html: t(`perkStyles.${rune_page.secondary_page_id}.tooltip`)}}/>}>
                                                    <img
                                                        src={`https://opgg-static.akamaized.net/images/lol/perkStyle/${rune_page.secondary_page_id}.png?image=c_scale,q_auto,w_20`}/>
                                                </Tippy>
                                                <div className={"champion-perk-stats"}>
                                                    <div>{t(`perkStyles.${rune_page.primary_page_id}.name`)} + {t(`perkStyles.${rune_page.secondary_page_id}.name`)}</div>
                                                    {rune_page.play &&
                                                    <div>
                                                        <span>{t("live.feature.champion.win-rate")}</span>{(rune_page.win / rune_page.play * 100).toFixed(2)}%
                                                        ({formatter.format(rune_page.play)} Matches)
                                                    </div>
                                                    }
                                                </div>
                                            </div>
                                            {rune_page.builds.map((build, i) => {
                                                if (i < 2) {
                                                    return (
                                                        <>
                                                            {perkCategory === index &&
                                                            <>
                                                                <div
                                                                    className={`champion-perk-page-summary ${perkPage === index * 2 + i ? "champion-perk-page-summary-active" : ""}`}
                                                                    onClick={onClickPerkPage(index * 2 + i)}>
                                                                    {build.play
                                                                        ? <>
                                                                        {t("live.feature.champion.win-rate")}
                                                                        <span>{(build.win / build.play * 100).toFixed(2)}%</span> ({formatter.format(build.play)} Matches)
                                                                        </>
                                                                        : <>
                                                                            {t("vs2")} {t(`champions.${_.find(championsMetaData.data, {key: tip.name})?.id}`)} {t("vs")} {t("live.feature.champion.rune-builds")}
                                                                        </>
                                                                    }
                                                                    <div className="champion-perk-radio-button">
                                                                        <img src="../../assets/images/icon-perk-radio-on.svg"
                                                                             style={perkPage === index * 2 + i ? {display: "block"} : {display: "none"}}
                                                                             alt=""/>
                                                                    </div>
                                                                </div>
                                                            </>
                                                            }
                                                        </>
                                                    )
                                                }
                                            })}
                                            {rune_page.builds.map((build, i) => {
                                                if (i < 2) {
                                                    return (
                                                        <>
                                                            {perkCategory === index && perkPage === index * 2 + i &&
                                                            <>
                                                                <div className={"champion-perk-page"}>
                                                                    <div className={"champion-perk-page-left"}>
                                                                        <div className={"champion-perk-page-left-top"}>
                                                                            {
                                                                                _.sortBy(_.filter(runesMetaData.data, {
                                                                                    page_id: build.primary_page_id,
                                                                                    slot_sequence: 0
                                                                                }), [(o) => {
                                                                                    return o.rune_sequence;
                                                                                }])?.map((rune) => {
                                                                                    return (
                                                                                        <Tippy content={<div
                                                                                            dangerouslySetInnerHTML={{__html: t(`perks.${rune.id}.tooltip`)}}/>}>
                                                                                            <div
                                                                                                className={`perk-image-wrapper ${build.primary_rune_ids[0] === rune.id ? "" : "img-gray"}`}>
                                                                                                <img
                                                                                                    src={`${rune.image_url}?image=c_scale,q_auto,w_20`}/>
                                                                                            </div>
                                                                                        </Tippy>
                                                                                    )
                                                                                })
                                                                            }
                                                                        </div>
                                                                        <div
                                                                            className={"champion-perk-page-left-bottom"}>
                                                                            {[1, 2, 3].map((i) => {
                                                                                return (
                                                                                    <>
                                                                                        <div
                                                                                            className={"champion-perk-page-row"}>
                                                                                            {
                                                                                                _.sortBy(_.filter(runesMetaData.data, {
                                                                                                    page_id: build.primary_page_id,
                                                                                                    slot_sequence: i
                                                                                                }), [(o) => {
                                                                                                    return o.rune_sequence;
                                                                                                }])?.map((rune) => {
                                                                                                    return (
                                                                                                        <Tippy content={
                                                                                                            <div
                                                                                                                dangerouslySetInnerHTML={{__html: t(`perks.${rune.id}.tooltip`)}}/>}>
                                                                                                            <img
                                                                                                                className={`${build.primary_rune_ids.includes(rune.id) ? "" : "img-gray"}`}
                                                                                                                src={`${rune.image_url}?image=c_scale,q_auto,w_24`}/>
                                                                                                        </Tippy>
                                                                                                    )
                                                                                                })
                                                                                            }
                                                                                        </div>
                                                                                    </>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                    <div className={"champion-perk-page-right"}>
                                                                        {[1, 2, 3].map((i, index) => {
                                                                            return (
                                                                                <>
                                                                                    <div
                                                                                        className={"champion-perk-page-row"}>
                                                                                        {
                                                                                            _.sortBy(_.filter(runesMetaData.data, {
                                                                                                page_id: build.secondary_page_id,
                                                                                                slot_sequence: i
                                                                                            }), [(o) => {
                                                                                                return o.rune_sequence;
                                                                                            }])?.map((rune) => {
                                                                                                return (
                                                                                                    <Tippy content={<div
                                                                                                        dangerouslySetInnerHTML={{__html: t(`perks.${rune.id}.tooltip`)}}/>}>
                                                                                                        <img
                                                                                                            className={`${build.secondary_rune_ids.includes(rune.id) ? "" : "img-gray"}`}
                                                                                                            src={`${rune.image_url}?image=c_scale,q_auto,w_20`}/>
                                                                                                    </Tippy>
                                                                                                )
                                                                                            })
                                                                                        }
                                                                                    </div>
                                                                                </>
                                                                            )
                                                                        })}
                                                                        {
                                                                            [[5008, 5005, 5007], [5008, 5002, 5003], [5001, 5002, 5003]].map((shards, index) => {
                                                                                return (
                                                                                    <>
                                                                                        <div
                                                                                            className={"champion-perk-page-row champion-perk-page-row-shard"}>
                                                                                            {shards.map((shard) => {
                                                                                                return (
                                                                                                    <Tippy content={<div
                                                                                                        dangerouslySetInnerHTML={{__html: t(`perks.${shard}.tooltip`)}}/>}>
                                                                                                        <img
                                                                                                            className={`${build.stat_mod_ids[index] === shard ? "" : "img-gray"}`}
                                                                                                            src={`https://opgg-static.akamaized.net/images/lol/perkShard/${shard}.png?image=c_scale,q_auto,w_16`}/>
                                                                                                    </Tippy>
                                                                                                )
                                                                                            })}
                                                                                        </div>
                                                                                    </>
                                                                                )
                                                                            })
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        position: `${rankedQueueIds.includes(queueId) ? "absolute" : ""}`,
                                                                        bottom: `${rankedQueueIds.includes(queueId) ? "0" : ""}`,
                                                                        opacity: `${rankedQueueIds.includes(queueId) ? "0.7" : ""}`
                                                                    }}
                                                                    onClick={onClickRuneExport(index * 2 + i)}
                                                                    className={`champion-perk-auto-save ${(currentPerkPage === index * 2 + i) ? "champion-perk-auto-save-disabled" : ""}`}>
                                                                    {t("live.feature.champion.export-rune")}
                                                                    <img src={`../../assets/images/icon-check${currentPerkPage === index * 2 + i ? "-disabled" : ""}.svg`} style={{marginLeft: "8px"}} />
                                                                </div>
                                                            </>
                                                            }

                                                        </>
                                                    )
                                                }
                                            })}
                                        </div>
                                    </>
                                )
                            }
                        })}
                    </div>
                </div>
                {queueId !== 450 && queueId !== 900 && counters && counters.length !== 0 &&
                <div className="champion-counters">
                    <div className="champion-counters-title">{t("live.feature.champion.counter-champion")}</div>
                    <div className="champion-counters-row">
                        {/*{data.counters && data.counters.map((counter, index) => {*/}
                        {/*    if (index < 5) {*/}
                        {/*        return (*/}
                        {/*            <div className={"champion-counters-item"}>*/}
                        {/*                <div className={"img-wrapper"}>*/}
                        {/*                    <img*/}
                        {/*                        src={`${_.find(championsMetaData.data, {id: counter.champion_id}).image_url}?image=c_scale,q_auto,w_38`}/>*/}
                        {/*                </div>*/}
                        {/*                <div className={"champion-counters-stats"}>*/}
                        {/*                    <div>W/Ratio <span>{(counter.win / counter.play * 100).toFixed(2)}%</span>*/}
                        {/*                    </div>*/}
                        {/*                    <div>{formatter.format(counter.play)} Matches</div>*/}
                        {/*                </div>*/}
                        {/*                <div className={"champion-counters-seperator"}></div>*/}
                        {/*            </div>*/}
                        {/*        )*/}
                        {/*    }*/}
                        {/*})}*/}
                        {counters && [...counters].reverse().map((counter, index) => {
                            if (index < 5) {
                                return (
                                    <div className={"champion-counters-item"}>
                                        <div className={"img-wrapper"}>
                                            <img
                                                src={`${_.find(championsMetaData.data, {id: counter.counterChampionId})?.image_url}?image=c_scale,q_auto,w_38`}/>
                                        </div>
                                        <div className={"champion-counters-stats"}>
                                            <div>W/Ratio <span>{((counter.WR) * 100).toFixed(2)}%</span>
                                            </div>
                                            <div>{formatter.format(counter.totalPlayed)} Matches</div>
                                        </div>
                                        <div className={"champion-counters-seperator"}></div>
                                    </div>
                                )
                            }
                        })}
                        {/*{((data.counters && data.counters.length === 0) || !data.counters) &&*/}
                        {/*<div>No Data</div>*/}
                        {/*}*/}
                        {((counters && counters.length === 0) || !counters) &&
                        <div>No data</div>
                        }
                    </div>
                </div>
                }
            </div>
        )
    } else {
        return (
            <>
                {showError
                    ? <Error error={503} msgType={"503"} isMini={false} />
                    : <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%"
                    }}><img src={"../../assets/images/contents_loading.gif"}/></div>
                }
            </>
        )
    }
}

interface TabProps {
    index: number
    setIndex: React.Dispatch<React.SetStateAction<number>>
    setCategory: React.Dispatch<React.SetStateAction<number>>
    setPage: React.Dispatch<React.SetStateAction<number>>
    content: {
        title: string;
        icon: string;
        link: any;
    }[],
    championId: number
    queueId: number
    setLaneTipOpened: React.Dispatch<React.SetStateAction<boolean>>
    lane: string
    data: any
    isFromStatistics: boolean
    setNewData: React.Dispatch<React.SetStateAction<any>>
}

const Tabs = ({
                  index,
                  setIndex,
                  setLaneTipOpened,
                  setCategory,
                  setPage,
                  content,
                  championId,
                  queueId,
                  lane,
                  data,
                  isFromStatistics,
                  setNewData,
                  setBuildIndex
              }: TabProps) => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const [region, setRegion] = useState<string>(localStorage.getItem("region")?.toUpperCase() ?? "KR");
    const {countryHasAds} = require("../../utils/ads");

    const onTabClicked = (index: number) => () => {
        setBuildIndex(0);
        try {
            if (data?.summary.positions) {
                sendGA4Event("click_champion_page_lane", {
                    "menu_name": "full",
                    "lane": tabContent[index].title,
                    "champion_id": championId,
                    "disabled": _.isEmpty(_.find(data?.summary.positions, {name: content[index].title})),
                    "ads": false
                });
            } else if (countryHasAds.includes(region)) {
                sendGA4Event("click_champion_page_lane", {
                    "menu_name": "full",
                    "lane": tabContent[index].title,
                    "champion_id": championId,
                    "disabled": _.isEmpty(_.find(data?.summary.positions, {name: content[index].title})),
                    "ads": true
                });
            }
        } catch (e) {}

        const getChampionDataByPosition = () => {
            setLaneTipOpened(false);
            setIndex(index);
            setCategory(0);
            setPage(0);
            let tmpRegion = localStorage.getItem("selected-region") ?? "kr";
            let tmpTierFilter = localStorage.getItem("tier-filter") ?? "platinum_plus";
            let tmpVersionFilter = localStorage.getItem("version-filter") ?? "";

            let lane = "none";
            if (tabContent[index]) {
                lane = tabContent[index].title;
            }
            if (isFromStatistics) {
                window.api.invoke("get-champion-data", [tabContent[index].title, championId, queueId, false, tmpRegion, tmpTierFilter, -1, tmpVersionFilter]).then((tmp) => {
                    if (tmp) {
                        dispatch(setChampionOverview(tmp));
                        setNewData(tmp);
                    }
                });
            } else {
                window.api.send("update-champion-lane", [lane, championId, queueId, !isFromStatistics, tmpRegion, tmpTierFilter, tmpVersionFilter]);
            }
        }

        // if (data?.summary.positions && _.find(data?.summary.positions, {name: content[index].title})) {
        //     getChampionDataByPosition();
        // } else if (countryHasAds.includes(region)) {
        //     getChampionDataByPosition();
        // } else if (isNMP) {
        //     getChampionDataByPosition();
        // }
        getChampionDataByPosition();
    }

    if (lane === "urf" || lane === "aram") {
        return (
            <div className="lane-tabs">
                <div className={`recommendation-tab lane-tab recommendation-tab-active`}>
                    <img width="24" height="24" className="lane-img"
                         src={`../../assets/images/icon-position-${lane.toUpperCase()}.png`}/>
                    <span
                        className={`recommendation-tab-title recommendation-tab-title-active`}>{lane.toUpperCase()}</span>
                </div>
            </div>
        );
    }
    return (
        <div className="lane-tabs">
            {content.map((tab, i) => {
                let positionData = null;
                if (data?.summary.positions) {
                    positionData = _.find(data?.summary.positions, {name: tab.title});
                }

                return (
                    <div
                        className={`recommendation-tab lane-tab ${index === i ? "recommendation-tab-active" : ""} ${data?.summary.positions && _.find(data?.summary.positions, {name: tab.title}) ? "" : `${countryHasAds.includes(region) ? "recommendation-tab-ads" : `${isNMP ? "" : ""}`}`}`}
                        onClick={onTabClicked(i)} key={i}>
                        <img className="lane-img"
                             src={`${index === i ? `../../assets/images/icon-position-${tab.title}-wh.svg` : `../../assets/images/icon-position-${tab.title}.png`}`}
                             alt={tab.title}/>
                        {positionData &&
                        <div style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            position: "absolute",
                            width: "36px",
                            height: "22px",
                            borderRadius: "4px",
                            top: "30px",
                            backdropFilter: "blur(8px)",
                            backgroundImage: "radial-gradient(circle at 50% 0, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1) 62%)",
                            background: `linear-gradient(to right, #5f32e6 ${Math.round(positionData.stats.role_rate*100)}%, #353538 0%)`,
                            fontSize: "11px",
                            border: `${index === i ? "1px solid #322f3d" : ""}`
                        }}>{Math.round(positionData.stats.role_rate*100)}%</div>
                        }
                    </div>
                )
            })}
        </div>
    );
};

interface LaneTipProps {
    queueId: number
    laneTipOpened: boolean
    setLaneTipOpened: React.Dispatch<React.SetStateAction<boolean>>
    tips: any
    championId: number
    tip: any
    setTip: React.Dispatch<React.SetStateAction<boolean>>
    newFeatureTip: boolean
}

const LaneTip = ({queueId, laneTipOpened, setLaneTipOpened, tips, championId, tip, setTip, newFeatureTip}: LaneTipProps) => {
    const {t} = useTranslation();

    const {tipChampions} = useTypedSelector(state => state.common);
    const [tipClickedIndex, setTipClickedIndex] = useState<number>(-1);
    const [lineTipChampSearch, setLineTipChampSearch] = useState("");
    const [normalLaneTipOpened, setNormalLaneTipOpened] = useState(false);

    useEffect(() => {

    }, [tipChampions]);

    useEffect(() => {
        if (!laneTipOpened) {
            // setTipClickedIndex(-1);
        }
    }, [laneTipOpened]);

    useEffect(() => {
        tippy('[data-tippy-content]', {
            allowHTML: true,
            onShow(instance) {
                setTimeout(() => {
                    if (document.getElementsByTagName('video')[0]) {
                        document.getElementsByTagName('video')[0].play();
                    }
                }, 500);
            }
        });
    }, [tip]);

    const onLaneTipToggleClicked = () => () => {
        if (laneTipOpened) {
            setLaneTipOpened(!laneTipOpened);
        } else {
            if (queueId !== 420 && queueId !== 440) {
                setNormalLaneTipOpened(!normalLaneTipOpened);
            }
        }
    }

    const onLaneTipClicked = (champion: tipChampionDataType | null, index: number) => () => {
        if (champion) {
            let tip = _.find(tips, {name: champion.key});
            if (tip) {
                setTip(tip);
                setTipClickedIndex(index);
                setLaneTipOpened(true);
            } else {
                setTip({
                    name: champion.key,
                    tip: "-"
                });
                setLaneTipOpened(false);
                setTimeout(() => {
                    setTipClickedIndex(index);
                }, 100);
            }
        }
    }

    const onNormalLaneTipClicked = (championKey) => () => {
        setNormalLaneTipOpened(false);
        if (championKey) {
            let tip = _.find(tips, {name: championKey.name});
            if (tip) {
                setTip(tip);
                setLaneTipOpened(true);
            }
        }
    }

    const onChangeLineTipChampionsInput = (e: ChangeEvent<HTMLInputElement>) => {
        const {value} = e.target;
        setLineTipChampSearch(value);
    }

    let notAvailableQueueIds = [900, 450, 1400];
    if (!notAvailableQueueIds.includes(queueId)) {
        return (
            <div className="champion-lane-tips">
                {(queueId === 420 || queueId === 440)
                    ? <>
                        {tipChampions.map((champion, index) => (
                            <div
                                style={{
                                    borderColor: `${newFeatureTip ? "#fff": ""}`
                                }}
                                className={`champion-lane-tips-image ${tipClickedIndex === index ? "champion-lane-tips-image-on" : ""}`}
                                onClick={onLaneTipClicked(champion, index)}>
                                {champion &&
                                <img className={`${_.find(tips, {name: champion.key}) ? "" : "img-gray"}`}
                                     src={`${_.find(championsMetaData.data, {id: champion.id})?.image_url}?image=c_scale,q_auto,w_32`}/>
                                }
                            </div>
                        ))}
                    </>
                    : <>
                        <div
                            className={`champion-lane-tips-image`}
                            onClick={() => {
                                setNormalLaneTipOpened(true)
                            }}>
                            {tip &&
                            <img className={""}
                                 src={`${_.find(championsMetaData.data, (d) => {
                                     return d.key.toLowerCase() === tip.name.trim().toLowerCase();
                                 })?.image_url}?image=c_scale,q_auto,w_32`}/>
                            }
                        </div>
                    </>
                }
                <div className={`champion-lane-tips-toggle ${laneTipOpened ? "champion-lane-tips-toggle-opened" : ""}`}
                     onClick={onLaneTipToggleClicked()}>{t("live.feature.champion.line-tip")}
                </div>
                {tip &&
                <div
                    className={`champion-lane-tips-tooltip ${laneTipOpened ? "champion-lane-tips-tooltip-opened" : ""}`}
                    dangerouslySetInnerHTML={{__html:
                            tipFormat(tip.tip, championId,
                                _.find(championsMetaData.data, (d) => {
                                    return d.key.toLowerCase() === tip.name.trim().toLowerCase();
                                })?.id,
                                t("vs-build2"),
                                t(`champions.${_.find(championsMetaData.data, (d) => {
                                    return d.key.toLowerCase() === tip.name.trim().toLowerCase();
                                })?.id}`),
                                t("vs-build"),
                                (queueId === 420 || queueId === 440),
                              tip
                            )
                    }}
                    style={{marginLeft: `${queueId !== 420 && queueId !== 440 ? "48px" : ""}`}}
                ></div>
                }
                <div className="popup-tip-select" style={{
                    display: `${normalLaneTipOpened ? "flex" : "none"}`, marginTop: "40px",
                    marginLeft: "0",
                    zIndex: 100
                }}>
                    <img className="close-popup-tip"
                         onClick={() => {
                             setNormalLaneTipOpened(false)
                         }}
                         src="../../assets/images/icon-close.svg"/>
                    <div className="popup-tip-search">
                        <input placeholder={t("live.feature.champion.search-champion")}
                               className="popup-tip-search-input"
                               onChange={onChangeLineTipChampionsInput}
                               type="text"/>
                        <img src="../../assets/images/icon-search.svg"/>
                    </div>
                    {_.isEmpty(tips) ? (
                        <div className={`tip-no-data`}>
                            {t("live.feature.champion.tip-no-data")}
                        </div>
                    ) : (
                        <div className="popup-tip-champions">
                            {_.map(lineTipChampSearch !== "" ? _.filter(tips, (value, key) => {
                                return value.name.toLowerCase().indexOf(lineTipChampSearch) >= 0
                                    || t(`champions.${key}`).toLowerCase().indexOf(lineTipChampSearch) >= 0;
                            }) : tips, (value, i) => {
                                let key = _.find(championsMetaData.data, (d) => {
                                    return d.key.toLowerCase() === value.name.trim().toLowerCase();
                                })?.id;
                                return (
                                    <div key={value.name} className="champion-img-wrapper"
                                         onClick={onNormalLaneTipClicked(value)}>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center"
                                            }}>
                                            <div style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "50%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                overflow: "hidden",
                                                marginBottom: "12px"
                                            }}>
                                                <img style={{width: "54px", height: "54px"}}
                                                     src={`${_.find(championsMetaData.data, {id: key})?.image_url}?image=c_scale,q_auto,w_54`}
                                                />
                                            </div>
                                            <div className="champion-name">
                                                {t(`champions.${key}`)}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    } else {
        return (
            <div className="champion-lane-tips"></div>
        )
    }
};

function VideoTooltip({isHover, championId, skillId}: { isHover: boolean; championId: number; skillId: string }) {
    const {t} = useTranslation();
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (ref.current) ref.current[isHover ? 'play' : 'pause']();
    }, [isHover])

    return (<div>
        <div className='tooltip-title'>{t(`skills.${championId}.${skillId}.name`)} ({skillId})</div>
        <div
            dangerouslySetInnerHTML={{__html: t(`skills.${championId}.${skillId}.tooltip`)?.replace(/\\"/gi, "'")?.replace(/"/gi, "'")}}></div>
        <video ref={ref} className='champion-skill-video vjs-tech' loop preload='none' muted
               src={t(`skills.${championId}.${skillId}.video_url`)}>
            <source src={t(`skills.${championId}.${skillId}.video_url`)} type='video/mp4'/>
        </video>
    </div>);
}

function tipFormat(tipMsg: string, key1: string | number, key2: string | number, t1: string, t2: string, t3: string, isRank: boolean, tip: any) {
    if (tip.author !== "" && tip.author !== "OP.GG") {
        let platform = "twitch";
        if (tip.author_link?.includes("youtube")) {
            platform = "youtube";
        }

        tipMsg += `
            <a href="${tip.author_link}" target="_blank">
                <div class="tip-gosu">
                    <div class="tip-gosu-wrapper">
                        <img class="img-profile" src="${tip.author_profile}" />
                        <div class="tip-name">${tip.author}</div>
                    </div>
                    <div class="tip-button">
                        <img src="../../assets/images/icon-${platform}-wh.svg" />
                        <div>${tip.author}</div>
                    </div>
                </div>
            </a>
        `;
    }

    if (isRank) {
        tipMsg += `
            <div class="btn-tip-vs">${t1} ${t2} ${t3}</div>
        `;
    }

    return tipMsg?.replace(/\(([QWERqwerPp])\)/g, function (match, skill) {
        skill = skill.toUpperCase();
        let imageUrl = i18next.t(`skills.${key2}.${skill}.image_url`) + "?image=c_scale,q_auto,w_48&v=1624418935";
        let tooltipClass = `skills__${skill}`;
        if (skill === "P") {
            tooltipClass += "__tooltip";
        }
        return typeof key2 == 'undefined' ?
            match :
            `<span class="skills skills-bordered ${tooltipClass}" style="display: inline-block; box-sizing: border-box; margin: 0 4px; vertical-align: middle"><img src="${imageUrl}" style="border-radius: 4px;" data-tippy-content="
                <div class='tooltip-title'>${i18next.t(`skills.${key2}.${skill}.name`)} (${skill})</div>
                ${i18next.t(`skills.${key2}.${skill}.tooltip`)?.replace(/\\"/gi, "'")?.replace(/"/gi, "'")}
                 <video class='champion-skill-video' className='vjs-tech' autoplay loop preload='none'
                       tabIndex='-1'
                       src='${i18next.t(`skills.${key2}.${skill}.video_url`)}'>
                    <source src='${i18next.t(`skills.${key2}.${skill}.video_url`)}' type='video/mp4'>
                </video>" /><div></div></span>
            `;
    })?.replace(/\[([QWERqwerPp])]/g, function (match, skill) {
        skill = skill.toUpperCase();
        let imageUrl = i18next.t(`skills.${key1}.${skill}.image_url`) + "?image=c_scale,q_auto,w_48&v=1624418935";
        let tooltipClass = `skills__${skill}`;
        if (skill === "P") {
            tooltipClass += "__tooltip";
        }
        return typeof key1 == 'undefined' ?
            match :
            `<span class="skills skills-bordered ${tooltipClass}" style="display: inline-block; box-sizing: border-box; margin: 0 4px; vertical-align: middle"><img src="${imageUrl}" style="border-radius: 4px;" data-tippy-content="
                <div class='tooltip-title'>${i18next.t(`skills.${key1}.${skill}.name`)} (${skill})</div>
                ${i18next.t(`skills.${key1}.${skill}.tooltip`)?.replace(/\\"/gi, "'")?.replace(/"/gi, "'")}
                 <video class='champion-skill-video' className='vjs-tech' autoplay loop preload='none'
                       tabIndex='-1'
                       src='${i18next.t(`skills.${key1}.${skill}.video_url`)}'>
                    <source src='${i18next.t(`skills.${key1}.${skill}.video_url`)}' type='video/mp4'>
                </video>" /><div></div></span>
            `;
    });
};

export default Champions;