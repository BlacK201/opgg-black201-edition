import React, {useCallback, useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import _ from "lodash";
import useOnScreen from "../../utils/useOnScreen";
import axios from "axios";
import {NavLink} from "react-router-dom";
import Tippy from "@tippyjs/react";
import sendGA4Event from "../../utils/ga4";
const lolConstants = require("../../../main/constants/game/leagueoflegends");

const championsMetaData = require("../../../assets/data/meta/champions.json");

const tabContent = [
    {
        title: "TOP",
        icon: "TOP.svg",
        link: "top",
        event: "top"
    },
    {
        title: "JUNGLE",
        icon: "JUNGLE.png",
        link: "jungle",
        event: "jungle"
    },
    {
        title: "MID",
        icon: "MID.png",
        link: "mid",
        event: "mid"
    },
    {
        title: "ADC",
        icon: "ADC.png",
        link: "adc",
        event: "adc"
    },
    {
        title: "SUPPORT",
        icon: "SUPPORT.png",
        link: "support",
        event: "support"
    }
];


const tabModeContent = [
    {
        title: "op",
        event: "live_op"
    },
    {
        title: "sidebar.tier",
        event: "champion_statistics"
    }
];

const tabSeasonContent = [
    {
        title: "19",
        event: "19"
    },
    {
        title: "20",
        event: "20"
    }
];

const ChampionRecommendation = () => {
    const { t, i18n } = useTranslation();

    const [mostChampions, setMostChampions] = useState({});
    const [mostChampions2, setMostChampions2] = useState({});
    const [championStats, setChampionStats] = useState();
    const [patchNotes, setPatchNotes] = useState();
    const [opChampions, setOpChampions] = useState({
        top: [],
        jungle: [],
        mid: [],
        adc: [],
        support: []
    });
    const [tabIndex, setTabIndex] = useState<number>(["top", "jungle", "mid", "adc", "support"].indexOf(localStorage.getItem("lobbyPosition") ?? "top") ?? 0);
    const [tabModeIndex, setTabModeIndex] = useState<number>(1);
    const [tabSeasonIndex, setTabSeasonIndex] = useState<number>(parseInt(localStorage.getItem("lastSeasonIndex") ?? "0"));
    // const [opCalled, setOpCalled] = useState({
    //     top: false,
    //     jungle: false,
    //     mid: false,
    //     adc: false,
    //     support: false
    // });
    const [championStatsSort, setChampionStatsSort] = useState("rank");
    const [mostChampionsSort, setMostChampionsSort] = useState("play");
    const [tierStats, setTierStats] = useState();
    const [languages, setLanguages] = useState(i18n.language);
    const [scrollEnded, setScrollEnded] = useState({
        scroll_opgg_pick_champions: false,
        scroll_opgg_pick_op: false,
        scroll_opgg_pick_season: false
    });
    const [isFirst, setIsFirst] = useState({
        click_mode: true,
        click_lane: true,
        click_season: true
    });

    let formatter = new Intl.NumberFormat();

    useEffect(() => {
        if (i18n.language !== "kr") {
            setLanguages("en");
        } else {
            setLanguages("kr");
        }
    }, [i18n.language]);

    useEffect(() => {
        if (isFirst.click_lane) {
            setIsFirst({
                ...isFirst,
                click_lane: false
            });
        }

        if (!isFirst.click_lane) {
            document.querySelector("#s1").scrollTop = 0;
            sendGA4Event("click_opgg_pick_lane", {
                champions_tab_name: tabModeContent[tabModeIndex].event,
                lane_tab_name: tabContent[tabIndex].event,
                season_tab_name: tabSeasonContent[tabSeasonIndex].event
            });
        }
    }, [tabIndex]);

    useEffect(() => {
        if (isFirst.click_mode) {
            setIsFirst({
                ...isFirst,
                click_mode: false
            });
        }
        if (!isFirst.click_mode) {
            document.querySelector("#s1").scrollTop = 0;
            sendGA4Event("click_opgg_pick_champions_tab", {
                champions_tab_name: tabModeContent[tabModeIndex].event,
                lane_tab_name: tabContent[tabIndex].event,
                season_tab_name: tabSeasonContent[tabSeasonIndex].event
            });
        }
    }, [tabModeIndex]);

    useEffect(() => {
        localStorage.setItem("lastSeasonIndex", String(["19", "20"].indexOf(tabSeasonContent[tabSeasonIndex].title)));
        // window.api.invoke("champion-recommendation", tabSeasonContent[tabSeasonIndex].title).then((res) => {
        //     if (res) {
        //         setMostChampions(res.mostChampion);
        //     }
        // });

        if (isFirst.click_season) {
            setIsFirst({
                ...isFirst,
                click_season: false
            });
        }
        if (!isFirst.click_season) {
            document.querySelector("#s2").scrollTop = 0;
            sendGA4Event("click_opgg_pick_season_tab", {
                champions_tab_name: tabModeContent[tabModeIndex].event,
                lane_tab_name: tabContent[tabIndex].event,
                season_tab_name: tabSeasonContent[tabSeasonIndex].event
            });
        }
    }, [tabSeasonIndex]);

    useEffect(() => {
        window.api.invoke("champion-recommendation", "19").then((res) => {
            setMostChampions(res.mostChampion);
        });

        window.api.invoke("champion-recommendation", "20").then((res) => {
            setMostChampions2(res.mostChampion);
        });

        axios.get(`https://lol-api-champion.op.gg/api/${localStorage.getItem("region") ?? "kr"}/champions/ranked`).then((res) => {
            // console.log(res.data.data);
            setChampionStats(res.data.data);
        });

        axios.get(`https://lol-api-champion.op.gg/api/${localStorage.getItem("region") ?? "kr"}/champions/ranked/tier-statistics?period=month`).then((res) => {
            // console.log(res.data.data);
            setTierStats(_.find(res.data.data, {
                tier: localStorage.getItem("soloRank") ?? "UNRANKED"
            }));
        });

        axios.get("https://desktop-app-data.op.gg/patchnote.json").then((res) => {
            setPatchNotes(res.data);
        });

        axios.get(`https://desktop-app-data.op.gg/analytics/${localStorage.getItem("region") ?? "KR"}/champion_stats.json`).then((res) => {
            // console.log(res.data);
            let tier = (lolConstants.OP_TIER_MAP[localStorage.getItem("soloRank") ?? "GOLD"] ?? "GOLD").substring(0, 1);
            setOpChampions({
                top: _.filter(res.data, {
                    position: "T",
                    subType: 420,
                    tierRank: tier
                }),
                jungle: _.filter(res.data, {
                    position: "J",
                    subType: 420,
                    tierRank: tier
                }),
                mid: _.filter(res.data, {
                    position: "M",
                    subType: 420,
                    tierRank: tier
                }),
                adc: _.filter(res.data, {
                    position: "A",
                    subType: 420,
                    tierRank: tier
                }),
                support: _.filter(res.data, {
                    position: "S",
                    subType: 420,
                    tierRank: tier
                }),
            })
        });

        const fn = (event, data) => {
            setTabIndex(["top", "jungle", "mid", "adc", "support"].indexOf(data.position ?? "top"));
        }
        window.api.on("is-solo-rank", fn);

        sendGA4Event("view_opgg_pick_page", {});

        return () => {
            window.api.removeListener("is-solo-rank", fn);
        }
    }, []);

    const scrollEvent = useCallback((eventName) =>
            _.debounce((el) => {
                let s1 = document.querySelector(`#${el.target.id}`);
                let scrollP = (s1.scrollTop / s1.scrollHeight);
                let scrollAmount = 20;

                if (scrollP < 0.2 && scrollP >= 0.1) {
                    scrollAmount = 20;
                } else if (scrollP >= 0.2 && scrollP < 0.7) {
                    scrollAmount = 50;
                } else {
                    setScrollEnded({
                        ...scrollEnded,
                        [eventName]: true
                    });
                    scrollAmount = 80;
                }

                // console.log(eventName, scrollAmount, scrollEnded);

                sendGA4Event(eventName, {
                    percentage: scrollAmount,
                    champions_tab_name: tabModeContent[tabModeIndex].event,
                    lane_tab_name: tabContent[tabIndex].event,
                    season_tab_name: tabSeasonContent[tabSeasonIndex].event
                });
            }, 1000)
        ,[scrollEnded])

    // useEffect(() => {
    //     if (!opCalled[tabContent[tabIndex].link]) {
    //         setOpCalled({
    //             ...opCalled,
    //             [tabContent[tabIndex].link]: true
    //         });
    //
    //         axios.get(`https://lol-api-champion.op.gg/api/${localStorage.getItem("region")?.toLowerCase() ?? "kr"}/honey-champions/soloranked/${tabContent[tabIndex].link}`).then((res) => {
    //             console.log(res.data.data);
    //             setOpChampions({
    //                 ...opChampions,
    //                 [tabContent[tabIndex].link]: res.data.data
    //             });
    //         });
    //     }
    // }, [tabIndex]);

    if (mostChampions && (localStorage.getItem("opggpick") === "true")) {
        return (
            <div className={"champion-recommendation"}>
                <div className={"champion-recommendation__header"}>
                    {(localStorage.getItem("soloRank") ?? "NONE") !== "NONE"
                        ? <>
                            <div className={"tier-information"}>
                                <img
                                    src={`https://opgg-static.akamaized.net/images/medals_new/${(localStorage.getItem("soloRank") ?? "default").toLowerCase()}.png?image=q_auto,f_webp,w_80`}/>
                                <div>{localStorage.getItem("soloRank") ?? "Unranked"} {t("tier-avg")}</div>
                            </div>
                            {tierStats &&
                                <div className={"average-column"}>
                                    <Tippy content={t("kill")}>
                                        <div className={"average-column__item"}>
                                            <div className={"column-name"}>
                                                <img src={"../../assets/images/icon-kill.svg"}/>
                                            </div>
                                            <div>{(tierStats?.kill / tierStats?.play).toFixed(2)}</div>
                                        </div>
                                    </Tippy>
                                    <Tippy content={t("death")}>
                                        <div className={"average-column__item"}>
                                            <div className={"column-name"}>
                                                <img src={"../../assets/images/icon-death.svg"}/>
                                            </div>
                                            <div>{(tierStats?.death / tierStats?.play).toFixed(2)}</div>
                                        </div>
                                    </Tippy>
                                    <Tippy content={t("assist")}>
                                        <div className={"average-column__item"}>
                                            <div className={"column-name"}>
                                                <img src={"../../assets/images/icon-assist.svg"}/>
                                            </div>
                                            <div>{(tierStats?.assist / tierStats?.play).toFixed(2)}</div>
                                        </div>
                                    </Tippy>
                                    <Tippy content={t("cs")}>
                                        <div className={"average-column__item"}>
                                            <div className={"column-name"}>
                                                <img src={"../../assets/images/icon-cs.svg"}/>
                                            </div>
                                            <div>{(tierStats?.cs / tierStats?.play).toFixed(0)}</div>
                                        </div>
                                    </Tippy>
                                    <Tippy content={t("gold")}>
                                        <div className={"average-column__item"}>
                                            <div className={"column-name"}>
                                                <img src={"../../assets/images/icon-gold-gr.svg"}/>
                                            </div>
                                            <div>{formatter.format((tierStats?.gold / tierStats?.play).toFixed(0))}</div>
                                        </div>
                                    </Tippy>
                                    <Tippy content={t("ward")}>
                                        <div className={"average-column__item"}>
                                            <div className={"column-name"}>
                                                <img src={"../../assets/images/icon-ward.svg"}/>
                                            </div>
                                            <div>{(tierStats?.ward / tierStats?.play).toFixed(2)}</div>
                                        </div>
                                    </Tippy>
                                </div>
                            }
                        </>

                        : <>
                            <div className={"tier-information"}>
                                <img
                                    src={`https://opgg-static.akamaized.net/images/medals_new/default_unranked.svg?image=q_auto,f_webp,w_80,co_rgb:7b7a8e,e_colorize:100`}/>
                                <div>{localStorage.getItem("soloRank") === "NONE" ? "Unranked" : localStorage.getItem("soloRank")} {t("tier-avg")}</div>
                            </div>
                            <div className={"average-column"}>
                                <Tippy content={t("kill")}>
                                    <div className={"average-column__item"}>
                                        <div className={"column-name"}>
                                            <img src={"../../assets/images/icon-kill.svg"}/>
                                        </div>
                                        <div>-</div>
                                    </div>
                                </Tippy>
                                <Tippy content={t("death")}>
                                    <div className={"average-column__item"}>
                                        <div className={"column-name"}>
                                            <img src={"../../assets/images/icon-death.svg"}/>
                                        </div>
                                        <div>-</div>
                                    </div>
                                </Tippy>
                                <Tippy content={t("assist")}>
                                    <div className={"average-column__item"}>
                                        <div className={"column-name"}>
                                            <img src={"../../assets/images/icon-assist.svg"}/>
                                        </div>
                                        <div>-</div>
                                    </div>
                                </Tippy>
                                <Tippy content={t("cs")}>
                                    <div className={"average-column__item"}>
                                        <div className={"column-name"}>
                                            <img src={"../../assets/images/icon-cs.svg"}/>
                                        </div>
                                        <div>-</div>
                                    </div>
                                </Tippy>
                                <Tippy content={t("gold")}>
                                    <div className={"average-column__item"}>
                                        <div className={"column-name"}>
                                            <img src={"../../assets/images/icon-gold-gr.svg"}/>
                                        </div>
                                        <div>-</div>
                                    </div>
                                </Tippy>
                                <Tippy content={t("ward")}>
                                    <div className={"average-column__item"}>
                                        <div className={"column-name"}>
                                            <img src={"../../assets/images/icon-ward.svg"}/>
                                        </div>
                                        <div>-</div>
                                    </div>
                                </Tippy>
                            </div>
                        </>
                    }
                </div>

                <div className={"champion-recommendation__content"}>
                    <div className={"right-area"}>
                        <div className={"filter-container"}>
                            <TabsMode
                                index={tabModeIndex}
                                setIndex={setTabModeIndex}
                                content={tabModeContent} />
                            <Tabs
                                index={tabIndex}
                                setIndex={setTabIndex}
                                content={tabContent} />
                        </div>
                        <div className={"content-desc"} style={{
                            margin: "8px 0"
                        }}>
                            {t("champion-tier-desc")}
                        </div>
                        <div className={"champion-list"}>
                            <div className={"content-table"}>
                                <div className={"content-table__row content-table__row-header"}>
                                    <div className={"c1"}
                                         onClick={() => {
                                             sendGA4Event("click_opgg_pick_filter", {
                                                 filter_name: "rank",
                                                 section_name: tabModeContent[tabModeIndex].event,
                                                 on: 1
                                             });
                                             setChampionStatsSort("rank");
                                         }}
                                         style={{
                                             borderBottom: `${championStatsSort === "rank" ? "2px solid #6e4fff" : ""}`,
                                             color: `${championStatsSort === "rank" ? "#6e4fff" : ""}`
                                         }}
                                    >#</div>
                                    <div className={"c2"}></div>
                                    <div className={"c3"}>{t("champion")}</div>
                                    <div className={"c4"}>{tabModeIndex === 1 ? t("tier") : ""}</div>
                                    <div className={"c5"}
                                         onClick={() => {
                                             sendGA4Event("click_opgg_pick_filter", {
                                                 filter_name: "win",
                                                 section_name: tabModeContent[tabModeIndex].event,
                                                 on: 1
                                             });
                                             setChampionStatsSort("win");
                                         }}
                                         style={{
                                             borderBottom: `${championStatsSort === "win" ? "2px solid #6e4fff" : ""}`,
                                             color: `${championStatsSort === "win" ? "#6e4fff" : ""}`
                                         }}
                                    >{t("win-rate")}</div>
                                    <div className={"c6"}
                                         onClick={() => {
                                             sendGA4Event("click_opgg_pick_filter", {
                                                 filter_name: "pick",
                                                 section_name: tabModeContent[tabModeIndex].event,
                                                 on: 1
                                             });
                                             setChampionStatsSort("pick");
                                         }}
                                         style={{
                                             borderBottom: `${championStatsSort === "pick" ? "2px solid #6e4fff" : ""}`,
                                             color: `${championStatsSort === "pick" ? "#6e4fff" : ""}`
                                         }}
                                    >{t("pick-rate")}</div>
                                    <div className={"c7"}
                                         onClick={() => {
                                             sendGA4Event("click_opgg_pick_filter", {
                                                 filter_name: "ban",
                                                 section_name: tabModeContent[tabModeIndex].event,
                                                 on: 1
                                             });
                                             setChampionStatsSort("ban");
                                         }}
                                         style={{
                                             borderBottom: `${championStatsSort === "ban" ? "2px solid #6e4fff" : ""}`,
                                             color: `${championStatsSort === "ban" ? "#6e4fff" : ""}`
                                         }}
                                    >{t("ban-rate")}</div>
                                </div>
                                <div id={"s1"} className={"scroll"} onScroll={(!scrollEnded["scroll_opgg_pick_champions"] || !scrollEnded["scroll_opgg_pick_op"]) ? scrollEvent(`${tabModeIndex === 0 ? "scroll_opgg_pick_op" : "scroll_opgg_pick_champions"}`) : null}>
                                    {tabModeIndex === 1
                                        ? <>
                                            {_.sortBy(_.filter(championStats, (el) => {
                                                for (let i = 0; i < el.positions.length; i++) {
                                                    return el.positions[i].name === tabContent[tabIndex]?.link.toUpperCase();
                                                }
                                            }), (el) => {
                                                let position =  _.find(el.positions, {
                                                    name: tabContent[tabIndex]?.link.toUpperCase()
                                                });
                                                switch(championStatsSort) {
                                                    case "rank":
                                                        return position.stats.tier_data.rank;
                                                    case "win":
                                                        return position.stats.win_rate * -1;
                                                    case "pick":
                                                        return position.stats.pick_rate * -1;
                                                    case "ban":
                                                        return position.stats.ban_rate * -1;
                                                    default:
                                                        return position.stats.tier_data.rank;
                                                }

                                            }).map((c, i) => {
                                                let p = _.find(c.positions, {
                                                    name: tabContent[tabIndex]?.link.toUpperCase()
                                                });

                                                let rank_diff = 0;
                                                rank_diff =  p.stats.tier_data.rank_prev - p.stats.tier_data.rank;
                                                let key = _.find(championsMetaData.data, {id: c.id})?.key;

                                                return (
                                                    <NavLink to={{
                                                        pathname: `/champions/${key}`,
                                                        state: {
                                                            key: key,
                                                            id: c.id,
                                                            lane: tabContent[tabIndex]?.link
                                                        }
                                                    }} key={i} draggable={false} onClick={() => {
                                                        sendGA4Event("click_opgg_pick_champions_champion", {
                                                            champion_id: c.id,
                                                            champions_tab_name: tabModeContent[tabModeIndex].event,
                                                            lane_tab_name: tabContent[tabIndex].event,
                                                            season_tab_name: tabSeasonContent[tabSeasonIndex].event
                                                        });
                                                    }}>
                                                        <div className={"content-table__row content-table__row-item"}>
                                                            <div className={"c1"}>{p.stats.tier_data.rank}</div>
                                                            <div className={"c2"} style={{
                                                                justifyContent: "flex-start"
                                                            }}>
                                                                {rank_diff !== 0
                                                                    ? <>
                                                                        <img
                                                                            src={`../../assets/images/icon-rank-${rank_diff < 0 ? "down" : "up"}.svg`}/>
                                                                        <div
                                                                            className={`${rank_diff < 0 ? "rank-down" : "rank-up"}`}>{Math.abs(rank_diff)}</div>
                                                                    </>
                                                                    : <>
                                                                        <img src={"../../assets/images/icon-equal.svg"} />
                                                                    </>
                                                                }
                                                            </div>
                                                            <div className={"c3"}>
                                                                <img src={`https://opgg-static.akamaized.net/meta/images/lol/champion/${_.find(championsMetaData.data, {id: c.id})?.key}.png?image=c_crop,h_103,w_103,x_9,y_9/q_auto,f_webp,w_32`} />
                                                            </div>
                                                            <div className={"c4"}>
                                                                <img src={`../../assets/images/optier-${p.stats?.tier_data.tier}.svg`} />
                                                            </div>
                                                            <div className={`c5 ${championStatsSort === "win" ? "sort-on" : "sort-off"}`}>{(p.stats.win_rate * 100).toFixed(2)}%</div>
                                                            <div className={`c6 ${championStatsSort === "pick" ? "sort-on" : "sort-off"}`}>{(p.stats.pick_rate * 100).toFixed(2)}%</div>
                                                            <div className={`c7 ${championStatsSort === "ban" ? "sort-on" : "sort-off"}`}>{(p.stats.ban_rate * 100).toFixed(2)}%</div>
                                                        </div>
                                                    </NavLink>
                                                )
                                            })}
                                        </>
                                        : <>
                                            {_.sortBy(opChampions[tabContent[tabIndex]?.link], (el) => {
                                                switch(championStatsSort) {
                                                    case "rank":
                                                        return el.rank;
                                                    case "win":
                                                        return el.WR * -1;
                                                    case "pick":
                                                        return el.PR * -1;
                                                    case "ban":
                                                        return el.BR * -1;
                                                    default:
                                                        return el.rank;
                                                }
                                            }).map((c, i) => {
                                                return (
                                                    <NavLink to={{
                                                        pathname: `/champions/${c.championName}`,
                                                        state: {
                                                            key: c.championName,
                                                            id: c.championId,
                                                            lane: tabContent[tabIndex]?.link
                                                        }
                                                    }} key={i} draggable={false} onClick={() => {
                                                        sendGA4Event("click_opgg_pick_champions_op", {
                                                            champion_id: c.id,
                                                            champions_tab_name: tabModeContent[tabModeIndex].event,
                                                            lane_tab_name: tabContent[tabIndex].event,
                                                            season_tab_name: tabSeasonContent[tabSeasonIndex].event
                                                        });
                                                    }}>
                                                        <div className={"content-table__row content-table__row-item"}>
                                                            <div className={"c1"}>{c.rank}</div>
                                                            <div className={"c2"}></div>
                                                            <div className={"c3"}>
                                                                <img src={`https://opgg-static.akamaized.net/meta/images/lol/champion/${c.championName}.png?image=c_crop,h_103,w_103,x_9,y_9/q_auto,f_webp,w_32`} />
                                                            </div>
                                                            <div className={"c4"}>
                                                                {c.rank <= 10 &&
                                                                    <Tippy content={t("op-champion")}>
                                                                        <div className={"honey"}>
                                                                            <img src={"../../assets/images/icon-honey.svg"} />
                                                                        </div>
                                                                    </Tippy>
                                                                }
                                                            </div>
                                                            <div className={`c5 ${championStatsSort === "win" ? "sort-on" : "sort-off"}`}>{(c.WR * 100).toFixed(2)}%</div>
                                                            <div className={`c6 ${championStatsSort === "pick" ? "sort-on" : "sort-off"}`}>{(c.PR * 100).toFixed(2)}%</div>
                                                            <div className={`c7 ${championStatsSort === "ban" ? "sort-on" : "sort-off"}`}>{(c.BR * 100).toFixed(2)}%</div>
                                                        </div>
                                                    </NavLink>
                                                )
                                            })}
                                        </>
                                    }

                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={"left-area"}>
                        <div className={"season-most"}>
                            <div className={"content-header"} style={{
                                height: 76
                            }}>
                                <div className={"content-title"} style={{
                                    position: "relative"
                                }}>
                                    <div>{t("season-most-champion")}</div>
                                    <div style={{
                                        position: "absolute",
                                        right: 0,
                                        top: 0
                                    }}>
                                        <TabsSeason index={tabSeasonIndex}
                                                    setIndex={setTabSeasonIndex}
                                                    content={tabSeasonContent}
                                        />
                                    </div>
                                </div>
                                <div className={"content-desc"} style={{
                                    width: 364,
                                    wordBreak: "keep-all"
                                }}>
                                    {t("season-most-champion-desc")}
                                </div>
                            </div>
                            <div className={"content-table"}>
                                <div className={"content-table__row content-table__row-header"}>
                                    <div className={"c1"}>#</div>
                                    <div className={"c2"}>{t("champion")}</div>
                                    <div className={"c2_1"} onClick={() => {
                                        // setMostChampionsSort("winRate")
                                    }} style={{
                                        // borderBottom: `${mostChampionsSort === "winRate" ? "2px solid #6e4fff" : ""}`,
                                        // color: `${mostChampionsSort === "winRate" ? "#6e4fff" : ""}`
                                    }}>{t("win-rate")}</div>
                                    <div className={"c3"} onClick={() => {
                                        // setMostChampionsSort("play")
                                    }} style={{
                                        // borderBottom: `${mostChampionsSort === "play" ? "2px solid #6e4fff" : ""}`,
                                        // color: `${mostChampionsSort === "play" ? "#6e4fff" : ""}`
                                    }}>{t("games")}</div>
                                    <div className={"c4"}>{t("weak-against")}</div>
                                    <div className={"c5"}>{t("strong-against")}</div>
                                    <div className={"c6"}>{t("synergy-champion")}</div>
                                </div>
                                <div id={"s2"} className={"scroll"} onScroll={!scrollEnded["scroll_opgg_pick_season"] ? scrollEvent("scroll_opgg_pick_season") : null}>
                                    {tabSeasonIndex === 0
                                        ? <>
                                            {mostChampions?.champion_stats?.length > 0
                                                ? <>
                                                    {_.sortBy(mostChampions?.champion_stats, (el) => {
                                                        switch (mostChampionsSort) {
                                                            case "winRate":
                                                                return -1 * Math.round(el.win/el.play*10000)/100;
                                                            case "play":
                                                            default:
                                                                return -1 * el.play;
                                                        }
                                                    }).map((c, i) => {
                                                        return (
                                                            <MostChampionRow
                                                                c={c}
                                                                i={i}
                                                                lane={tabContent[tabIndex]?.link}
                                                                champion={_.find(championStats, {id: c.id})}
                                                                // op={_.find(opChampions[tabContent[tabIndex].link], {
                                                                //     tier: localStorage.getItem("soloRank") ?? "GOLD",
                                                                //     champion_id: c.id
                                                                // })}
                                                                op={_.find(opChampions[tabContent[tabIndex]?.link], {
                                                                    championId: c.id
                                                                })}
                                                            />
                                                        )
                                                    })}
                                                </>
                                                : <div style={{
                                                    marginTop: 24,
                                                    fontSize: 12,
                                                    fontWeight: "bold",
                                                    width: "100%",
                                                    textAlign: "center",
                                                    color: "#5d5a73"
                                                }}>
                                                    {t("no-season")}
                                                </div>
                                            }
                                        </>
                                        : <>
                                            {mostChampions2?.champion_stats?.length > 0
                                                ? <>
                                                    {_.sortBy(mostChampions2?.champion_stats, (el) => {
                                                        switch (mostChampionsSort) {
                                                            case "winRate":
                                                                return -1 * Math.round(el.win/el.play*10000)/100;
                                                            case "play":
                                                            default:
                                                                return -1 * el.play;
                                                        }
                                                    }).map((c, i) => {
                                                        return (
                                                            <MostChampionRow2
                                                                c={c}
                                                                i={i}
                                                                lane={tabContent[tabIndex]?.link}
                                                                champion={_.find(championStats, {id: c.id})}
                                                                // op={_.find(opChampions[tabContent[tabIndex].link], {
                                                                //     tier: localStorage.getItem("soloRank") ?? "GOLD",
                                                                //     champion_id: c.id
                                                                // })}
                                                                op={_.find(opChampions[tabContent[tabIndex]?.link], {
                                                                    championId: c.id
                                                                })}
                                                            />
                                                        )
                                                    })}
                                                </>
                                                : <div style={{
                                                    marginTop: 24,
                                                    fontSize: 12,
                                                    fontWeight: "bold",
                                                    width: "100%",
                                                    textAlign: "center",
                                                    color: "#5d5a73"
                                                }}>
                                                    {t("no-preseason")}
                                                </div>
                                            }
                                        </>
                                    }
                                </div>
                            </div>
                        </div>
                        {patchNotes &&
                            <div className={"patch-note"}>
                                <div className={"content-header"} style={{borderBottom: "none"}}>
                                    <div className={"content-title"} style={{
                                        position: "relative"
                                    }}>
                                        <div>{patchNotes.version} {t("patch-notes")}</div>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            position: "absolute",
                                            right: 0,
                                            top: 0,
                                            fontSize: 12,
                                            fontWeight: "normal",
                                            color: "#7b7a8e",
                                            cursor: "pointer"
                                        }} onClick={() => {
                                            sendGA4Event("click_opgg_pick_patch_note_detail", {
                                                champions_tab_name: tabModeContent[tabModeIndex].event
                                                lane_tab_name: tabContent[tabIndex].event,
                                                season_tab_name: tabSeasonContent[tabSeasonIndex].event
                                            });
                                            window.api.openExternal(patchNotes.data[languages]?.url);
                                        }}>{t("patch-notes-detail")} <img width={16}
                                                                          src={"../../assets/images/icon-arrow-next.svg"}/>
                                        </div>
                                    </div>
                                    <div className={"content-desc"}>
                                        {t("patch-note-desc")}
                                    </div>
                                </div>
                                <div className={"scroll"}>
                                    <div style={{
                                        display: "flex",
                                        marginRight: 24
                                    }}>
                                        {_.filter(patchNotes.data[languages].content, {status: "buff"}).map((c) => {
                                            return (
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    marginRight: 8
                                                }}>
                                                    <Tippy content={c.log}>
                                                        <img
                                                            className={"patch-note__champion patch-note__champion-buff"}
                                                            src={`https://opgg-static.akamaized.net/meta/images/lol/champion/${c.key}.png?image=c_crop,h_103,w_103,x_9,y_9/q_auto,f_webp,w_32`}/>
                                                    </Tippy>
                                                    <img src={`../../assets/images/icon-rank-up.svg`}/>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div style={{
                                        display: "flex",
                                        marginRight: 24
                                    }}>
                                        {_.filter(patchNotes.data[languages].content, {status: "nerf"}).map((c) => {
                                            return (
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    marginRight: 8
                                                }}>
                                                    <Tippy content={c.log}>
                                                        <img
                                                            className={"patch-note__champion patch-note__champion-nerf"}
                                                            src={`https://opgg-static.akamaized.net/meta/images/lol/champion/${c.key}.png?image=c_crop,h_103,w_103,x_9,y_9/q_auto,f_webp,w_32`}/>
                                                    </Tippy>
                                                    <img src={`../../assets/images/icon-rank-down.svg`}/>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div style={{
                                        display: "flex",
                                        marginRight: 24
                                    }}>
                                        {_.filter(patchNotes.data[languages].content, {status: "same"}).map((c) => {
                                            return (
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    marginRight: 8
                                                }}>
                                                    <Tippy content={c.log}>
                                                        <img
                                                            className={"patch-note__champion patch-note__champion-adjust"}
                                                            src={`https://opgg-static.akamaized.net/meta/images/lol/champion/${c.key}.png?image=c_crop,h_103,w_103,x_9,y_9/q_auto,f_webp,w_32`}/>
                                                    </Tippy>
                                                    <img src={`../../assets/images/icon-equal.svg`}/>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            flexDirection: "column",
            fontSize: "16px",
            color: "#ddd"
        }}>
            <video autoPlay muted loop width="600" height="337"
                   style={{borderRadius: "12px", marginBottom: "48px"}}>
                <source src={"../../assets/images/opggpick.mp4"}
                        type="video/mp4"/>
            </video>
            <div style={{textAlign: "center"}} dangerouslySetInnerHTML={{__html: t("usage.opggpick")}}></div>
        </div>
    )
}

const MostChampionRow = ({c, i, lane, champion, op}) => {
    const ref = useRef();
    const isVisible = useOnScreen(ref);
    const [called, setCalled] = useState({
        top: false,
        jungle: false,
        mid: false,
        adc: false,
        support: false
    });
    const [calledSynergy, setCalledSynergy] = useState({
        top: false,
        jungle: false,
        mid: false,
        adc: false,
        support: false
    });
    const [data, setData] = useState({
        top: [],
        jungle: [],
        mid: [],
        adc: [],
        support: []
    });
    const [synergyData, setSynergyData] = useState({
        top: [],
        jungle: [],
        mid: [],
        adc: [],
        support: []
    });

    const laneMap = {
        top: "jungle",
        jungle: "mid",
        mid: "jungle",
        adc: "support",
        support: "adc"
    }

    useEffect(() => {
        if (isVisible) {
            if (!called[lane]) {
                setCalled({
                    ...called,
                    [lane]: true
                });

                axios.get(`https://lol-api-champion.op.gg/api/${localStorage.getItem("region") ?? "kr"}/champions/ranked/${c.id}/${lane}/counters`).then((res) => {
                    // console.log(c, res.data.data);
                    if (res.data.data.length > 3) {
                        setData({
                            ...data,
                            [lane]: _.sortBy(res.data.data, (e) => {
                                return -1 * e.win / e.play;
                            })
                        });
                    } else {
                        setData({
                            ...data,
                            [lane]: []
                        });
                    }
                });
            }

            if (!calledSynergy[lane]) {
                setCalledSynergy({
                    ...calledSynergy,
                    [lane]: true
                });

                axios.get(`https://lol-api-champion.op.gg/api/${localStorage.getItem("region") ?? "kr"}/champions/ranked/${c.id}/${lane}/synergies/${laneMap[lane]}`).then((res) => {
                    // console.log(c, res.data.data);
                    if (res.data.data.length > 3) {
                        setSynergyData({
                            ...synergyData,
                            [lane]: res.data.data
                        });
                    } else {
                        setSynergyData({
                            ...synergyData,
                            [lane]: []
                        });
                    }
                });
            }
        }
    }, [isVisible, lane]);

    let positionData = _.find(champion?.positions, {name: lane?.toUpperCase()});

    return (
        <NavLink to={{
            pathname: `/champions/${_.find(championsMetaData.data, {id: c.id})?.key}`,
            state: {
                key: _.find(championsMetaData.data, {id: c.id})?.key,
                id: c.id,
                lane: lane
            }
        }} key={i} draggable={false} onClick={() => {
            sendGA4Event("click_opgg_pick_champions_most", {
                champion_id: c.id
            });
        }}>
            <div ref={ref} className={"content-table__row content-table__row-item"} style={{
                display: "flex"
            }}>
                <div className={"c1"}>{i + 1}</div>
                <div className={"c2"}>
                    <div style={{
                        position: "relative"
                    }}>
                        <img className={"c-img"}
                             src={`https://opgg-static.akamaized.net/images/lol/champion/${_.find(championsMetaData.data, {id: c.id})?.key}.png?image=c_crop,h_103,w_103,x_9,y_9/q_auto,f_webp,w_32`}/>
                        {/*<div>*/}
                        {/*    {positionData?.stats?.tier_data &&*/}
                        {/*        <img className={"c-tier-img"} src={`../../assets/images/optier-${positionData?.stats?.tier_data.tier}.svg`} />*/}
                        {/*    }*/}
                        {/*</div>*/}
                    </div>
                    <div style={{
                        position: "relative",
                        width: "56px",
                        display: "flex",
                        // alignItems: "center",
                        justifyContent: "space-between"
                    }}>
                        {positionData?.stats?.tier_data &&
                            <div style={{
                                marginTop: 1
                            }}>
                                <img src={`../../assets/images/optier-${positionData?.stats?.tier_data.tier}.svg`} />
                            </div>
                        }
                        {op && op.rank <= 10 &&
                            <div className={"honey"}>
                                <img src={"../../assets/images/icon-honey.svg"} />
                            </div>
                        }
                    </div>
                </div>
                <div className={"c2_1"}>{Math.round(c.win/c.play*10000)/100}%</div>
                <div className={"c3"}>{c.play}</div>
                <div className={"c4"}>
                    {data[lane]?.length >= 6
                        ? <>
                            {_.cloneDeep(data)[lane]?.reverse().map((c, i) => {
                                if (i < 3) {
                                    return (
                                        <div className={"champion-winrate"}>
                                            <img
                                                src={`https://opgg-static.akamaized.net/images/lol/champion/${_.find(championsMetaData.data, {id: c.champion_id})?.key}.png?image=c_crop,h_103,w_103,x_9,y_9/q_auto,f_webp,w_24`}/>
                                            <div>{Math.round(c.win/c.play*1000)/10}%</div>
                                        </div>
                                    )
                                }
                            })}
                        </>
                        : <ChampionPlaceholder />
                    }

                </div>
                <div className={"c5"}>
                    {data[lane]?.length >= 6
                        ? <>
                            {data[lane]?.map((c, i) => {
                                if (i < 3) {
                                    return (
                                        <div className={"champion-winrate"}>
                                            <img
                                                src={`https://opgg-static.akamaized.net/images/lol/champion/${_.find(championsMetaData.data, {id: c.champion_id})?.key}.png?image=c_crop,h_103,w_103,x_9,y_9/q_auto,f_webp,w_24`}/>
                                            <div>{Math.round(c.win/c.play*1000)/10}%</div>
                                        </div>
                                    )
                                }
                            })}
                        </>
                        : <ChampionPlaceholder />
                    }

                </div>
                <div className={"c6"}>
                    {synergyData[lane]?.length >= 3
                        ? <>{synergyData[lane]?.map((c, i) => {
                            if (c.synergy_champion_id && i < 3) {
                                return (
                                    <div className={"champion-winrate"}>
                                        <img
                                            src={`https://opgg-static.akamaized.net/images/lol/champion/${_.find(championsMetaData.data, {id: c.synergy_champion_id})?.key}.png?image=c_crop,h_103,w_103,x_9,y_9/q_auto,f_webp,w_24`}/>
                                        <div>{Math.round(c.win/c.play*1000)/10}%</div>
                                    </div>
                                )
                            }
                        })}
                        </>
                        : <ChampionPlaceholder />
                    }

                </div>
            </div>
        </NavLink>
    )
}
const MostChampionRow2 = ({c, i, lane, champion, op}) => {
    const ref = useRef();
    const isVisible = useOnScreen(ref);
    const [called, setCalled] = useState({
        top: false,
        jungle: false,
        mid: false,
        adc: false,
        support: false
    });
    const [calledSynergy, setCalledSynergy] = useState({
        top: false,
        jungle: false,
        mid: false,
        adc: false,
        support: false
    });
    const [data, setData] = useState({
        top: [],
        jungle: [],
        mid: [],
        adc: [],
        support: []
    });
    const [synergyData, setSynergyData] = useState({
        top: [],
        jungle: [],
        mid: [],
        adc: [],
        support: []
    });

    const laneMap = {
        top: "jungle",
        jungle: "mid",
        mid: "jungle",
        adc: "support",
        support: "adc"
    }

    useEffect(() => {
        if (isVisible) {
            if (!called[lane]) {
                setCalled({
                    ...called,
                    [lane]: true
                });

                axios.get(`https://lol-api-champion.op.gg/api/${localStorage.getItem("region") ?? "kr"}/champions/ranked/${c.id}/${lane}/counters`).then((res) => {
                    // console.log(c, res.data.data);
                    if (res.data.data.length > 3) {
                        setData({
                            ...data,
                            [lane]: _.sortBy(res.data.data, (e) => {
                                return -1 * e.win / e.play;
                            })
                        });
                    } else {
                        setData({
                            ...data,
                            [lane]: []
                        });
                    }
                });
            }

            if (!calledSynergy[lane]) {
                setCalledSynergy({
                    ...calledSynergy,
                    [lane]: true
                });

                axios.get(`https://lol-api-champion.op.gg/api/${localStorage.getItem("region") ?? "kr"}/champions/ranked/${c.id}/${lane}/synergies/${laneMap[lane]}`).then((res) => {
                    // console.log(c, res.data.data);
                    if (res.data.data.length > 3) {
                        setSynergyData({
                            ...synergyData,
                            [lane]: res.data.data
                        });
                    } else {
                        setSynergyData({
                            ...synergyData,
                            [lane]: []
                        });
                    }
                });
            }
        }
    }, [isVisible, lane]);

    let positionData = _.find(champion?.positions, {name: lane?.toUpperCase()});

    return (
        <NavLink to={{
            pathname: `/champions/${_.find(championsMetaData.data, {id: c.id})?.key}`,
            state: {
                key: _.find(championsMetaData.data, {id: c.id})?.key,
                id: c.id,
                lane: lane
            }
        }} key={i} draggable={false} onClick={() => {
            sendGA4Event("click_opgg_pick_champions_most", {
                champion_id: c.id
            });
        }}>
            <div ref={ref} className={"content-table__row content-table__row-item"} style={{
                display: "flex"
            }}>
                <div className={"c1"}>{i + 1}</div>
                <div className={"c2"}>
                    <div style={{
                        position: "relative"
                    }}>
                        <img className={"c-img"}
                             src={`https://opgg-static.akamaized.net/images/lol/champion/${_.find(championsMetaData.data, {id: c.id})?.key}.png?image=c_crop,h_103,w_103,x_9,y_9/q_auto,f_webp,w_32`}/>
                        {/*<div>*/}
                        {/*    {positionData?.stats?.tier_data &&*/}
                        {/*        <img className={"c-tier-img"} src={`../../assets/images/optier-${positionData?.stats?.tier_data.tier}.svg`} />*/}
                        {/*    }*/}
                        {/*</div>*/}
                    </div>
                    <div style={{
                        position: "relative",
                        width: "56px",
                        display: "flex",
                        // alignItems: "center",
                        justifyContent: "space-between"
                    }}>
                        {positionData?.stats?.tier_data &&
                            <div style={{
                                marginTop: 1
                            }}>
                                <img src={`../../assets/images/optier-${positionData?.stats?.tier_data.tier}.svg`} />
                            </div>
                        }
                        {op && op.rank <= 10 &&
                            <div className={"honey"}>
                                <img src={"../../assets/images/icon-honey.svg"} />
                            </div>
                        }
                    </div>
                </div>
                <div className={"c2_1"}>{Math.round(c.win/c.play*10000)/100}%</div>
                <div className={"c3"}>{c.play}</div>
                <div className={"c4"}>
                    {data[lane]?.length >= 6
                        ? <>
                            {_.cloneDeep(data)[lane]?.reverse().map((c, i) => {
                                if (i < 3) {
                                    return (
                                        <div className={"champion-winrate"}>
                                            <img
                                                src={`https://opgg-static.akamaized.net/images/lol/champion/${_.find(championsMetaData.data, {id: c.champion_id})?.key}.png?image=c_crop,h_103,w_103,x_9,y_9/q_auto,f_webp,w_24`}/>
                                            <div>{Math.round(c.win/c.play*1000)/10}%</div>
                                        </div>
                                    )
                                }
                            })}
                        </>
                        : <ChampionPlaceholder />
                    }

                </div>
                <div className={"c5"}>
                    {data[lane]?.length >= 6
                        ? <>
                            {data[lane]?.map((c, i) => {
                                if (i < 3) {
                                    return (
                                        <div className={"champion-winrate"}>
                                            <img
                                                src={`https://opgg-static.akamaized.net/images/lol/champion/${_.find(championsMetaData.data, {id: c.champion_id})?.key}.png?image=c_crop,h_103,w_103,x_9,y_9/q_auto,f_webp,w_24`}/>
                                            <div>{Math.round(c.win/c.play*1000)/10}%</div>
                                        </div>
                                    )
                                }
                            })}
                        </>
                        : <ChampionPlaceholder />
                    }

                </div>
                <div className={"c6"}>
                    {synergyData[lane]?.length >= 3
                        ? <>{synergyData[lane]?.map((c, i) => {
                            if (c.synergy_champion_id && i < 3) {
                                return (
                                    <div className={"champion-winrate"}>
                                        <img
                                            src={`https://opgg-static.akamaized.net/images/lol/champion/${_.find(championsMetaData.data, {id: c.synergy_champion_id})?.key}.png?image=c_crop,h_103,w_103,x_9,y_9/q_auto,f_webp,w_24`}/>
                                        <div>{Math.round(c.win/c.play*1000)/10}%</div>
                                    </div>
                                )
                            }
                        })}
                        </>
                        : <ChampionPlaceholder />
                    }

                </div>
            </div>
        </NavLink>
    )
}

interface TabProps {
    index: number,
    setIndex: React.Dispatch<React.SetStateAction<number>>,
    content: {
        title: string;
        icon: string;
        link: any;
    }[]
}

const Tabs = ({ index, setIndex, content }: TabProps) => {
    const { t }= useTranslation();

    return (
        <div className="statistics-tabs">
            {content.map((tab, i) => (
                <div className={`recommendation-tab ${index === i ? "recommendation-tab-active" : ""}`}
                     onClick={() => setIndex(i)} key={i}
                     style={{
                         width: 36,
                         height: 36
                     }}
                >
                    <img src={`${index === i ? `../../assets/images/icon-position-${tab.title}-wh.svg` : `../../assets/images/icon-position-${tab.title}.png`}`} alt={tab.title} style={{marginRight: 0}} />
                </div>
            ))}
        </div>
    );
};

interface TabModeProps {
    index: number,
    setIndex: React.Dispatch<React.SetStateAction<number>>,
    content: {
        title: string;
    }[]
}

const TabsMode = ({ index, setIndex, content }: TabModeProps) => {
    const { t }= useTranslation();

    return (
        <div className="statistics-tabs mode-tabs" style={{
            marginRight: 8
        }}>
            {content.map((tab, i) => (
                <div className={`recommendation-tab-mode ${index === i ? "recommendation-tab-mode-active" : ""}`}
                     onClick={() => setIndex(i)} key={i} style={{minWidth: 107, padding: 0}}>
                    <span className={`recommendation-tab-mode-title ${index === i ? "recommendation-tab-mode-title-active" : ""}`} style={{
                        marginRight: 0
                    }}>{t(tab.title)}</span>
                </div>
            ))}
        </div>
    );
};

const TabsSeason = ({ index, setIndex, content }: TabModeProps) => {
    const { t }= useTranslation();

    return (
        <div className="statistics-tabs mode-tabs" style={{
            marginRight: 8
        }}>
            {content.map((tab, i) => (
                <div className={`recommendation-tab-mode ${index === i ? "recommendation-tab-mode-active" : ""}`}
                     onClick={() => setIndex(i)} key={i} style={{minWidth: 107}}>
                    <span className={`recommendation-tab-mode-title ${index === i ? "recommendation-tab-mode-title-active" : ""}`} style={{
                        marginRight: 0
                    }}>{t(`season.${tab.title}`)}</span>
                </div>
            ))}
        </div>
    );
};

const ChampionPlaceholder = () => {
    const {t} = useTranslation();
    return (
        <div className={"champion-placeholder"}>
            <div className={"champion-placeholder__container"}>
                <div className={"champion-placeholder__circle"}></div>
                <div className={"champion-placeholder__circle"}></div>
                <div className={"champion-placeholder__circle"}></div>
            </div>
            <div style={{color: "#5d5a73", marginTop: 4, fontSize: 11, height: 15}}>{t("no-data")}</div>
        </div>
    )
}

export default ChampionRecommendation;
