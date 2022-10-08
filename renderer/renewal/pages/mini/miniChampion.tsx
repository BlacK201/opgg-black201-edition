import React, {ChangeEvent, useEffect, useRef, useState} from "react";
import Tippy from '@tippyjs/react';
import {useTypedSelector} from "../../../redux/store";
import {useTranslation} from "react-i18next";
import _ from "lodash";
import {useHistory} from "react-router-dom";
import {useDispatch} from "react-redux";
import i18next from "i18next";
import tippy from "tippy.js";
import sendGA4Event from "../../../utils/ga4";
// import mixpanel from "../../../utils/mixpanel";

// const {ipcRenderer} = globalThis.require('electron');
const itemsMetaData = require("../../../../assets/data/meta/items.json");
const runesMetaData = require("../../../../assets/data/meta/runes.json");
const championsMetaData = require("../../../../assets/data/meta/champions.json");

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

const MiniChampion = () => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const history = useHistory();
    let formatter = new Intl.NumberFormat();

    const {tipChampions, champion, isAutoRune} = useTypedSelector(state => state.common);
    const [tabIndex, setTabIndex] = useState<number>(0);
    const [videoTooltipHoverId, setIsVideoTooltipHover] = useState<string>();
    const [perkCategory, setPerkCategory] = useState<number>(0);
    const [perkPage, setPerkPage] = useState<number>(0);
    // const [runeAutoSave, setRuneAutoSave] = useState<boolean>((localStorage.getItem("autorune") ?? "true") === "true");
    const [tipClickedIndex, setTipClickedIndex] = useState<number>(-1);
    const [tip, setTip] = useState<any>("");
    const [data, setData] = useState<any>();
    const [lane, setLane] = useState<any>();
    const [tips, setTips] = useState<any>();
    const [queueId, setQueueId] = useState<any>();
    const [laneTipOpened, setLaneTipOpened] = useState<boolean>(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [currentPerkPage, setCurrentPerkPage] = useState<number>(-1);

    let cnt = 0;
    let tmp: any = [];

    // let cdata = require("../../../data/livechampion.json");
    // let data = cdata.data;
    // let lane = cdata.lane;
    // let tips = cdata.tips;
    // let queueId = cdata.queueId;
    useEffect(() => {
        sendGA4Event("view_champion_page", {
            "menu_name": "mini"
        });
    }, []);

    useEffect(() => {
        if (champion) {
            setData(champion.data);
            setLane(champion.lane);
            setTips(champion.tips);
            if (isAutoRune) {
                setCurrentPerkPage(0);
            }  else {
                setCurrentPerkPage(-1);
            }
            setPerkCategory(0);
            setPerkPage(0);
            setQueueId(champion.queueId);
            setTabIndex(["top", "jungle", "mid", "adc", "support"].indexOf(champion.lane));
            try {
                // mixpanel.track("view_champion_page", {
                //     "menu_name": "mini",
                //     "champion_name": champion.data.summary.id,
                //     "lane": champion.lane
                // });
            } catch (e) {}
        }
    }, [champion]);

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


    if (data && (tabIndex != -1 || lane === "aram" || lane === "urf")) {
        let metaData = _.find(championsMetaData.data, {id: data?.summary.id});

        let positionData = null;
        if (data?.summary.positions) {
            positionData = _.filter(data?.summary.positions, {name: tabContent[tabIndex].title})[0];
        } else {
            positionData = lane;
        }

        const Tabs = () => {
            const onTabClicked = (index: number) => () => {
                try {
                    if (data?.summary.positions) {
                        // mixpanel.track("click_champion_page_lane", {
                        //     "menu_name": "mini",
                        //     "lane": tabContent[index].title,
                        //     "champion_id": data.summary.id,
                        //     "disabled": _.isEmpty(_.find(data?.summary.positions, {name: tabContent[index].title}))
                        // });
                    }
                } catch (e) {}
                if (data?.summary.positions && _.find(data?.summary.positions, {name: tabContent[index].title})) {
                    setLaneTipOpened(false);
                    setTabIndex(index);
                    setPerkCategory(0);
                    setPerkPage(0);
                    window.api.send("update-champion-lane", [tabContent[index].title, data.summary.id, queueId, false]);
                }
            };

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
                <div className={`mini-champion-line-tabs`}>
                    {tabContent.map((tab, i) => (
                        <div
                            className={`mini-champion-line-tab ${tabIndex === i ? "mini-champion-line-tab-active" : ""} ${data?.summary.positions && _.find(data?.summary.positions, {name: tab.title}) ? "" : "mini-champion-line-tab-disabled"}`}
                            onClick={onTabClicked(i)} key={i}>
                            <img
                                src={`${tabIndex === i ? `../../assets/images/icon-position-${tab.title}-wh.svg` : `../../assets/images/icon-position-${tab.title}.png`}`}
                                alt={tab.title}/>
                        </div>
                    ))}
                </div>
            );
        };

        const LaneTip = () => {
            useEffect(() => {

            }, [tipChampions]);

            useEffect(() => {
                if (!laneTipOpened) {
                    setTipClickedIndex(-1);
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
                }
            }

            const onLaneTipClicked = (championTip: any | null, index: number) => () => {
                if (championTip) {
                    let tip = _.find(tips, {name: championTip.key});
                    if (tip) {
                        setTip(tip);
                        setTipClickedIndex(index);
                        setLaneTipOpened(true);
                    }
                }
            }

            return (
                <div className="champion-lane-tips" style={{margin: "0 auto"}}>
                    {(queueId === 420 || queueId === 440) &&
                    <>
                        {tipChampions.map((championTip, index) => (
                            <div
                                className={`champion-lane-tips-image ${tipClickedIndex === index ? "champion-lane-tips-image-on" : ""}`}
                                onClick={onLaneTipClicked(championTip, index)}>
                                {championTip &&
                                <img className={`${_.find(tips, {name: championTip.key}) ? "" : "img-gray"}`}
                                     src={`${_.find(championsMetaData.data, {id: championTip.id}).image_url}?image=c_scale,q_auto,w_32`}/>
                                }
                            </div>
                        ))}
                        <div
                            className={`champion-lane-tips-toggle ${laneTipOpened ? "champion-lane-tips-toggle-opened" : ""}`}
                            onClick={onLaneTipToggleClicked()}>{t("live.feature.champion.line-tip")}
                        </div>
                    </>
                    }
                    {tip &&
                    <div
                        className={`champion-lane-tips-tooltip ${laneTipOpened ? "champion-lane-tips-tooltip-opened" : ""}`}
                        dangerouslySetInnerHTML={{__html: tipFormat(tip.tip, data.summary.id, _.find(championsMetaData.data, {key: tip.name}).id)}}
                        style={{width: "444px", marginLeft: "-70px", backgroundColor: "#323236"}}
                    ></div>
                    }
                </div>
            );
        };

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

        // const onChangeRuneAutoSave = (e: ChangeEvent<HTMLInputElement>) => {
        //     const {checked} = e.target;
        //     setRuneAutoSave(checked);
        //     localStorage.setItem("autorune", String(checked));
        //     ipcRenderer.send("autorune", checked);
        // };

        const onClickRuneExport = (pageId: number) => () => {
            setCurrentPerkPage(pageId);
            window.api.send("update-perk-page", {
                lane: lane,
                page: pageId,
                clicked: true
            });
        }

        const onClickChampionName = (championName = "", lane="") => () => {
            window.api.send("openChampionPage", {
                key: championName,
                lane: lane
            });
        }

        const onPageScroll = _.debounce((e: any) => {
            setScrollPosition((e.target as HTMLElement).scrollTop);
        }, 100);

        return (
            <>
                {tips && queueId === 420 && queueId === 440
                    ? <div className={"mini-champion-top-bar"}>
                        {/*{scrollPosition < 80*/}
                        {/*    ? <>{tips && <LaneTip/>}</>*/}
                        {/*    : <div className={"flex align-items-center"}*/}
                        {/*           style={{width: "100%", animation: "fadeIn 0.5s"}}>*/}
                        {/*        <div*/}
                        {/*            className={"image-wrapper mini-champion-champion-image mini-champion-champion-image-small"}>*/}
                        {/*            <img*/}
                        {/*                src={`https://opgg-static.akamaized.net/images/lol/champion/${metaData.key}.png?image=c_scale,q_auto,w_42&v=1628647804`}/>*/}
                        {/*        </div>*/}
                        {/*        <div className={"flex align-items-center"} style={{*/}
                        {/*            fontSize: "14px", fontWeight: "bold", marginRight: "auto",  cursor: "pointer"*/}
                        {/*        }} onClick={onClickChampionName(metaData.key, lane)}>*/}
                        {/*            {t(`champions.${data.summary.id}`)}*/}
                        {/*            <img src={"../../assets/images/icon-link.svg"} style={{marginLeft: "8px"}}/>*/}
                        {/*        </div>*/}
                        {/*        <Tabs/>*/}
                        {/*    </div>*/}
                        {/*}*/}
                        <div className={"flex align-items-center"}
                             style={{width: "100%", animation: "fadeIn 0.5s"}}>
                            <div
                                className={"image-wrapper mini-champion-champion-image mini-champion-champion-image-small"}>
                                <img
                                    src={`https://opgg-static.akamaized.net/images/lol/champion/${metaData.key}.png?image=c_scale,q_auto,w_42&v=1628647804`}/>
                            </div>
                            <div className={"flex align-items-center"} style={{
                                fontSize: "14px", fontWeight: "bold", marginRight: "auto",  cursor: "pointer"
                            }} onClick={onClickChampionName(metaData.key, lane)}>
                                {t(`champions.${data.summary.id}`)}
                                <img src={"../../assets/images/icon-link.svg"} style={{marginLeft: "8px"}}/>
                            </div>
                            <Tabs/>
                        </div>
                    </div>
                    : <>
                        {scrollPosition >= 80 &&
                        <div className={"mini-champion-top-bar"}>
                            <div className={"flex align-items-center"}
                                 style={{width: "100%", animation: "fadeIn 0.5s"}}>
                                <div
                                    className={"image-wrapper mini-champion-champion-image mini-champion-champion-image-small"}>
                                    <img
                                        src={`https://opgg-static.akamaized.net/images/lol/champion/${metaData.key}.png?image=c_scale,q_auto,w_42&v=1628647804`}/>
                                </div>
                                <div className={"flex align-items-center"} style={{
                                    fontSize: "14px", fontWeight: "bold", marginRight: "auto",  cursor: "pointer"
                                }} onClick={onClickChampionName(metaData.key, lane)}>
                                    {t(`champions.${data.summary.id}`)}
                                    <img src={"../../assets/images/icon-link.svg"} style={{marginLeft: "8px"}}/>
                                </div>
                                <Tabs/>
                            </div>
                        </div>
                        }
                    </>
                }
                <div className={"mini-champion-scroll"} onScroll={onPageScroll} style={{
                    paddingTop: `${tips && queueId === 420 && queueId === 440 ? "52px" : "0"}`
                }}>
                    <div className={"mini-champion"}>
                        <div className={"flex align-items-center justify-content-center"}>
                            <Tabs/>
                        </div>

                        <div className={"flex"} style={{width: "100%", height: "100px", marginTop: "8px"}}>
                            <div className={"image-wrapper mini-champion-champion-image"}>
                                <img
                                    src={`https://opgg-static.akamaized.net/images/lol/champion/${metaData.key}.png?image=c_scale,q_auto,w_110&v=1628647804`}/>
                                {positionData && positionData !== "aram" && positionData !== "urf" &&
                                <div className="champion-tier">
                                    <img
                                        src={`https://opgg-static.akamaized.net/images/site/champion/icon-champtier-${positionData.stats.tier_data.tier}.png`}/>
                                </div>
                                }
                            </div>
                            <div style={{marginTop: "16px", width: "340px"}}>
                                <div className={"flex align-items-center"} style={{
                                    fontSize: "14px", fontWeight: "bold", cursor: "pointer"
                                }} onClick={onClickChampionName(metaData.key, lane)}>
                                    {t(`champions.${data.summary.id}`)}
                                    <img src={"../../assets/images/icon-link.svg"} style={{marginLeft: "8px"}}/>
                                </div>
                                <div className={"flex justify-content-between"}>
                                    <div className={"mini-champion-spells"}>
                                        <div
                                            className={"mini-champion-section-title"}>{t("live.feature.champion.summoner-spells")}</div>
                                        <div className={"flex"}>
                                            {data.summoner_spells.length === 0 &&
                                            <div>No data</div>
                                            }
                                            {data.summoner_spells.length >= 1 &&
                                            <>
                                                <img
                                                    src={`https://opgg-static.akamaized.net/images/lol/spell/${spellIdtoKey[data.summoner_spells[0].ids[0]]}.png?image=c_scale,q_auto,w_28&v=1626880099`}/>
                                                <img
                                                    src={`https://opgg-static.akamaized.net/images/lol/spell/${spellIdtoKey[data.summoner_spells[0].ids[1]]}.png?image=c_scale,q_auto,w_28&v=1626880099`}/>
                                            </>
                                            }
                                        </div>
                                    </div>
                                    <div className={"mini-champion-skills"}>
                                        <div
                                            className={"mini-champion-section-title"}>{t("live.feature.champion.skill-builds")}</div>
                                        <div className="champion-contents-container flex-direction-column">
                                            {data.skill_masteries.length >= 1 &&
                                            <>
                                                <div className="flex" style={{marginTop: "12px"}}>
                                                    <Tippy content={<VideoTooltip isHover={videoTooltipHoverId === "P"}
                                                                                  championId={data.summary.id}
                                                                                  skillId={"P"}/>}>
                                                        <div className="skills skills__P"
                                                             onMouseEnter={() => setIsVideoTooltipHover("P")}
                                                             onMouseLeave={() => setIsVideoTooltipHover("")}>
                                                            <img
                                                                src={`${t(`skills.${data?.summary.id}.P.image_url`)}?image=c_scale,q_auto,w_28`}/>
                                                        </div>
                                                    </Tippy>
                                                    <Tippy content={<VideoTooltip isHover={videoTooltipHoverId === "R"}
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
                                                    {data?.skill_masteries[0].ids.map((skill: any, index: number) => {
                                                        return (
                                                            <>
                                                                <Tippy content={<VideoTooltip
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
                                            </>
                                            }
                                            {data.skill_masteries.length === 0 &&
                                            <div style={{fontSize: "12px", color: "#7b7a8e"}}>No data</div>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex" style={{marginTop: "12px"}}>
                            {data?.skills[0].order.map((skill: any, i: number) => (
                                <div className={`skills-wrapper skills-wrapper__${skill}`} key={i}></div>
                            ))}
                        </div>

                        <div className={"flex align-items-center mini-champion-counter"}>
                            <div>{t("live.feature.champion.counter-champion")}</div>
                            <div className={"flex mini-champion-counter-images"}>
                                {data.counters && data.counters.map((counter: any, index: number) => {
                                    if (index < 5) {
                                        return (
                                            <div className={"image-wrapper"}>
                                                <img
                                                    src={`${_.find(championsMetaData.data, {id: counter.champion_id}).image_url}?image=c_scale,q_auto,w_38`}/>
                                            </div>
                                        )
                                    }
                                })}
                                {((data.counters && data.counters.length === 0) || !data.counters) &&
                                <div>No Data</div>
                                }
                            </div>
                        </div>

                        <div className={"flex flex-direction-column mini-champion-runes"}>
                            <div>{t("live.feature.champion.rune-builds")}</div>
                            <div className={"champion-perk-container"}>
                                {data.rune_pages.map((rune_page: any, index: number) => {
                                    if (index < 2) {
                                        return (
                                            <>
                                                <div
                                                    className={`champion-perk ${perkCategory === index ? "champion-perk-active champion-perk-opened" : "champion-perk-closed"}`}
                                                    onClick={onClickPerkCategory(index)}>
                                                    <Tippy content={<div
                                                        dangerouslySetInnerHTML={{__html: t(`perkStyles.${rune_page.primary_page_id}.tooltip`)}}/>}>
                                                        <div className={"perk-image-wrapper"}
                                                             style={{marginRight: "6px"}}>
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
                                                        <div style={{marginBottom: "4px"}}>
                                                            <span>{t("live.feature.champion.win-rate")}</span> {(rune_page.win / rune_page.play * 100).toFixed(2)}%
                                                        </div>
                                                        <div>
                                                            {formatter.format(rune_page.play)} Matches
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    }
                                })}
                            </div>
                            <div>
                                {data.rune_pages.map((rune_page: any, index: number) => {
                                    if (index < 2) {
                                        return (
                                            <>
                                                <div className={"flex justify-content-between"}>
                                                    {rune_page.builds.map((build: any, i: number) => {
                                                        if (i < 2) {
                                                            return (
                                                                <>
                                                                    {perkCategory === index &&
                                                                    <>
                                                                        <div
                                                                            className={`champion-perk-page-summary ${perkPage === index * 2 + i ? "champion-perk-page-summary-active" : ""}`}
                                                                            onClick={onClickPerkPage(index * 2 + i)}>
                                                                            <div>{t("live.feature.champion.win-rate")}</div>
                                                                            <span>{(build.win / build.play * 100).toFixed(2)}%</span>
                                                                            <div className="champion-perk-radio-button">
                                                                                <img
                                                                                    src="../../assets/images/icon-perk-radio-on.svg"
                                                                                    alt=""
                                                                                    style={perkPage === index * 2 + i ? {display: "block"} : {display: "none"}}/>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                    }
                                                                </>
                                                            )
                                                        }
                                                    })
                                                    }
                                                </div>
                                                {rune_page.builds.map((build: any, i: number) => {
                                                    if (i < 2) {
                                                        return (
                                                            <>
                                                                {perkCategory === index && perkPage === index * 2 + i &&
                                                                <>
                                                                    <div className={"champion-perk-page"}>
                                                                        <div className={"champion-perk-page-left"}>
                                                                            <div
                                                                                className={"champion-perk-page-left-top"}>
                                                                                {
                                                                                    _.sortBy(_.filter(runesMetaData.data, {
                                                                                        page_id: build.primary_page_id,
                                                                                        slot_sequence: 0
                                                                                    }), [(o) => {
                                                                                        return o.rune_sequence;
                                                                                    }]).map((rune) => {
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
                                                                                                    }]).map((rune) => {
                                                                                                        return (
                                                                                                            <Tippy
                                                                                                                content={
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
                                                                                                }]).map((rune) => {
                                                                                                    return (
                                                                                                        <Tippy content={
                                                                                                            <div
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
                                                                                                        <Tippy content={
                                                                                                            <div
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
                                                })
                                                }
                                            </>
                                        )
                                    }
                                })}
                            </div>
                        </div>

                        <div className={"mini-champion-items"}>
                            <div className={"flex justify-content-between"} style={{width: "100%"}}>
                                <div>
                                    <div
                                        className={"mini-champion-section-title"}>{t("live.feature.champion.starter-item")}</div>
                                    <div className="champion-items-row" style={{marginTop: "12px"}}>
                                        {data?.starter_items.map((starter: any, index: number) => {
                                            return (
                                                <>
                                                    {index === 0 && starter.ids.map((id: any) => {
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
                                <div>
                                    <div
                                        className={"mini-champion-section-title"}>{t("live.feature.champion.recommend-build")}</div>
                                    <div className="champion-items-row" style={{marginTop: "12px"}}>
                                        {data?.core_items.map((items: any, index: number) => {
                                            return (
                                                <>
                                                    {index === 0 && items.ids.map((id: any, i: number) => {
                                                        return (
                                                            <>
                                                                {i < 3 &&
                                                                <Tippy content={<div
                                                                    dangerouslySetInnerHTML={{__html: t(`items.${id}.tooltip`)}}/>}>
                                                                    {_.find(itemsMetaData.data, {id: id}) && _.find(itemsMetaData.data, {id: id}).is_mythic
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
                                <div>
                                    <div
                                        className={"mini-champion-section-title"}>{t("live.feature.champion.core-items")}</div>
                                    <div className="champion-items-row" style={{marginTop: "12px"}}>
                                        {data?.core_items.map((items: any) => {
                                            return (
                                                <>
                                                    {items.ids.map((id: any) => {
                                                        if (tmp.indexOf(id) === -1) {
                                                            tmp.push(id);
                                                            cnt += 1;
                                                            if (cnt <= 4) {
                                                                return (
                                                                    <>
                                                                        <Tippy content={<div
                                                                            dangerouslySetInnerHTML={{__html: t(`items.${id}.tooltip`)}}/>}>
                                                                            {_.find(itemsMetaData.data, {id: id}) && _.find(itemsMetaData.data, {id: id}).is_mythic
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
                            <div className={"flex justify-content-between"} style={{width: "100%"}}>
                                <div className="champion-recommend-build">
                                    <div
                                        className="champion-contents-title champion-contents-title-w-line">{t("live.feature.champion.recommend-item-builds")}</div>
                                    {data?.core_items.map((items: any, index: number) => {
                                        if (index < 3) {
                                            return (
                                                <>
                                                    <div className="champion-items-row padding-left">
                                                        {items.ids.map((id: any, i: number) => {
                                                            return (
                                                                <>
                                                                    {i < 3 &&
                                                                    <Tippy content={<div
                                                                        dangerouslySetInnerHTML={{__html: t(`items.${id}.tooltip`)}}/>}>
                                                                        {_.find(itemsMetaData.data, {id: id}) && _.find(itemsMetaData.data, {id: id}).is_mythic
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
                                <div className="champion-boots">
                                    <div
                                        className="champion-contents-title champion-contents-title-w-line">{t("live.feature.champion.boots")}</div>
                                    {data.boots.map((items: any, index: number) => {
                                        if (index < 3) {
                                            return (
                                                <>
                                                    <div className="champion-boots-row">
                                                        {items.ids.map((id: any) => {
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
                </div>
            </>
        )
    } else {
        return (
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: "column", fontSize: "16px", color: "#ddd"}}>
                <video autoPlay muted loop width="426" height="240" style={{borderRadius: "12px", marginBottom: "48px"}}>
                    <source  src={"../../assets/images/video-champion-small.mp4"}
                             type="video/mp4" />
                </video>
                <div style={{padding: "0 24px", textAlign: "center", wordBreak: "keep-all"}}>{t("usage.champion")}  <span style={{color: "#ff8e05", fontWeight: "bold"}}>{t("live.tab.champion")}</span> {t("usage.move")}</div>
            </div>
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
            dangerouslySetInnerHTML={{__html: t(`skills.${championId}.${skillId}.tooltip`).replace(/\\"/gi, "'").replace(/"/gi, "'")}}></div>
        <video ref={ref} className='champion-skill-video vjs-tech' loop preload='none'
               src={t(`skills.${championId}.${skillId}.video_url`)}>
            <source src={t(`skills.${championId}.${skillId}.video_url`)} type='video/mp4'/>
        </video>
    </div>);
}

function tipFormat(tipMsg: string, key1: string | number, key2: string | number) {
    return tipMsg.replace(/\(([QWERqwerPp])\)/g, function (match, skill) {
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
                ${i18next.t(`skills.${key2}.${skill}.tooltip`).replace(/\\"/gi, "'").replace(/"/gi, "'")}
                 <video class='champion-skill-video' className='vjs-tech' autoplay loop preload='none'
                       tabIndex='-1'
                       src='${i18next.t(`skills.${key2}.${skill}.video_url`)}'>
                    <source src='${i18next.t(`skills.${key2}.${skill}.video_url`)}' type='video/mp4'>
                </video>" /><div></div></span>
            `;
    }).replace(/\[([QWERqwerPp])]/g, function (match, skill) {
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
                ${i18next.t(`skills.${key1}.${skill}.tooltip`).replace(/\\"/gi, "'").replace(/"/gi, "'")}
                 <video class='champion-skill-video' className='vjs-tech' autoplay loop preload='none'
                       tabIndex='-1'
                       src='${i18next.t(`skills.${key1}.${skill}.video_url`)}'>
                    <source src='${i18next.t(`skills.${key1}.${skill}.video_url`)}' type='video/mp4'>
                </video>" /><div></div></span>
            `;
    });
};

export default MiniChampion;
