import React, {useEffect, useRef, useState} from 'react';
import _ from "lodash";
import {useHistory} from "react-router-dom";
import {useTranslation} from "react-i18next";
import Error from "../components/common/Error";
import {useTypedSelector} from "../../redux/store";
const championsMetaData = require("../../../assets/data/meta/champions.json");
const itemMetaData = require("../../../assets/data/meta/items.json");
const spellMetaData = require("../../../assets/data/meta/spells.json");
const runeMetaData = require("../../../assets/data/meta/runes.json");
const runePageMetaData = require("../../../assets/data/meta/runePages.json");
import customToastr from "../../lib/toastr";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts';
import { timeForToday } from "../../utils/utils";
import Tippy from "@tippyjs/react";
import sendGA4Event from "../../utils/ga4";
import NotSupported from "../../components/common/NotSupported";

const MyPage = () => {
    const {t} = useTranslation();
    const history = useHistory();
    const mounted = useRef(false);
    const [mypage, setMypage] = useState<any>();
    const [index, setIndex] = useState<number>(0);
    const [allChampions, setAllChampions] = useState<any>();
    const [mostChampions, setMostChampions] = useState<any>();
    const [mostLine, setMostLine] = useState<any>();
    const [showError, setShowError] = useState<boolean>(false);
    const {summonerName} = useTypedSelector((state) => state.common);
    const [isRenewed, setIsRenewed] = useState<any>();
    const [isRenewing, setIsRenewing] = useState<any>();
    let formatter = new Intl.NumberFormat();
    let i18n = localStorage.getItem("i18n") ?? "en";
    let availability = localStorage.getItem("availability") ?? true;

    let cnt = 0;

    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    const ordinal_suffix_of = (i) => {
        let j = i % 10, k = i % 100;
        i = formatter.format(i);
        if (j == 1 && k != 11) {
            return i + "st";
        }
        if (j == 2 && k != 12) {
            return i + "nd";
        }
        if (j == 3 && k != 13) {
            return i + "rd";
        }
        return i + "th";
    };

    function getGrade(winRate: number) {
        let grade = "B-";
        if (winRate >= 45 && winRate < 50) {
            grade = "B"
        } else if (winRate >= 50 && winRate < 50) {
            grade = "B+";
        } else if (winRate >= 54 && winRate < 56) {
            grade = "A-";
        } else if (winRate >= 56 && winRate < 60) {
            grade = "A";
        } else if (winRate >= 60 && winRate < 65) {
            grade = "A+";
        } else if (winRate >= 65 && winRate < 70) {
            grade = "S";
        } else if (winRate >= 70) {
            grade = "S+";
        }

        return grade;
    }

    function getKdaGrade(kda: number) {
        let result = "B-";
        if (kda >= 2 && kda < 2.3) {
            result = "B";
        } else if (kda >= 2.3 && kda < 2.7) {
            result = "B+";
        } else if (kda >= 2.7 && kda < 3.0) {
            result = "A-";
        } else if (kda >= 3.0 && kda < 3.4) {
            result = "A";
        } else if (kda >= 3.4 && kda < 3.7) {
            result = "A+";
        } else if (kda >= 3.7 && kda < 5) {
            result = "S";
        } else if (kda >= 5) {
            result = "S+";
        }
        return result;
    }

    const reload = () => {
        window.api.invoke("mypage", localStorage.getItem("currentUser") ?? summonerName ?? "Hide on bush").then((tmp) => {
            if (tmp) {
                if (mounted.current) {
                    setMypage(tmp);

                    tmp = tmp.career;
                    setAllChampions(tmp);

                    setMostChampions(_.sortBy(_.groupBy(_.filter(tmp, (o) => {
                        return o.queueType === "rank5solo" || o.queueType === "rank5flex";
                    }), "championId"), [(o) => {
                        return -o.length;
                    }]));

                    setMostLine((_.sortBy(_.groupBy(_.filter(tmp, (o) => {
                        return o.queueType === "rank5solo" || o.queueType === "rank5flex";
                    }), "lane"), (o) => {
                        return -o.length;
                    })));
                }
            } else {
                history.push("/champions");
            }
        });
    }

    useEffect(() => {
        mounted.current = true;

        if (mounted.current) {
            sendGA4Event("view_my_page", {
                menu_name: "full"
            });
        }

        return () => {
            mounted.current = false;
        }
    }, []);

    useEffect(() => {
        if (summonerName) {
            reload();
        } else {
            history.push("/champions");
        }

        let errorTimeout = setTimeout(() => {
            setShowError(true);
        }, 9000);

        return () => {
            clearTimeout(errorTimeout);
        }
    }, [summonerName]);

    const onClickSummonerName = (summonerName: string) => () => {
        if (summonerName) {
            window.api.send("openSummonerPage", summonerName);
        }
    }

    const mostChampionsPagerClicked = (i: number) => () => {
        if (i >= 0 && i <= Math.floor(mostChampions.length)/3 && i < 3) {
            setIndex(i);
        }
    }

    const MostChampions = () => {
        let count = Math.floor(mostChampions.length/3) + 1;
        let arr = null;
        if (count >= 3) {
            arr = [0, 1, 2];
        } else {
            arr = Array.from(Array(count), (_, i) => i);
        }
        return (
            <>
                {mostChampions.length !== 0
                    ? <>
                        {arr.map((i, i1) => {
                            return (
                                <div key={i1}>
                                    {i === index &&
                                    <div className={"most-champions-wrapper"}>
                                        <div className={"pager"} onClick={mostChampionsPagerClicked(i-1)}><img src={"../../assets/images/icon-arrow-prev.svg"} /></div>
                                        {[0, 1, 2].map((k, k1) => {
                                            if (mostChampions[i1*3+k]) {
                                                let kda = _.sumBy(mostChampions[i1 * 3 + k], (o: any) => {
                                                    return o.stats["CareerStats.js"].deaths;
                                                }) === 0
                                                    ? "Perfect"
                                                    : (_.sumBy(mostChampions[i1 * 3 + k], (o: any) => {
                                                        return o.stats["CareerStats.js"].kills + o.stats["CareerStats.js"].assists;
                                                    }) / _.sumBy(mostChampions[i1 * 3 + k], (o: any) => {
                                                        return o.stats["CareerStats.js"].deaths;
                                                    })).toFixed(2);

                                                let kdaColor =
                                                    kda < 3 ? "#949494"
                                                        : kda < 4 ? "#27b38a"
                                                            : kda < 5 ? "#1f8ecd"
                                                                : kda >= 5 ? "#ff7905" : "";

                                                return (
                                                    <div className={"most-champions"} key={k1}>
                                                        <div className={"most-champions-img"}
                                                             style={{borderColor: kdaColor === "#949494" ? "3c3c3c" : kdaColor}}>
                                                            <img src={`${_.find(championsMetaData.data, {
                                                                id: mostChampions[i1 * 3 + k][0].championId
                                                            })?.image_url}?image=c_scale,q_auto,w_54&v=1628647804`}/>
                                                        </div>
                                                        <div
                                                            style={{marginTop: "8px"}}>{_.sumBy(mostChampions[i1 * 3 + k], (o: any) => {
                                                            return o.stats["CareerStats.js"].victory;
                                                        })}W {_.sumBy(mostChampions[i1 * 3 + k], (o: any) => {
                                                            return o.stats["CareerStats.js"].victory === 0 ? 1 : 0;
                                                        })}L
                                                        </div>
                                                        <div className={"most-champions__kda"}
                                                             style={{color: kdaColor}}>{kda}:1 KDA
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        })}
                                        <div className={"pager"} onClick={mostChampionsPagerClicked(i+1)}><img src={"../../assets/images/icon-arrow-next.svg"} /></div>
                                    </div>
                                    }
                                </div>
                            )
                        })}
                    </>
                    : <div className={"coming-soon"} style={{padding: "0 14px"}}>{t("mypage.no-data")}</div>
                }
                {mostChampions.length !== 0 &&
                <div className={"pager-dot-wrapper"}>
                    {arr.map((i, i1) => {
                        return (
                            <div className={`pager-dot ${i === index ? "pager-dot-active" : ""}`}
                                 onClick={() => setIndex(i)} key={i1}></div>
                        )
                    })}
                </div>
                }
            </>
        )
    };

    if (!availability || availability === "false") {
        return (
            <NotSupported />
        )
    }

    if (!mypage || !mostChampions || !mostLine || !allChampions) {
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

    let wl;
    let kills;
    let deaths;
    let assists;
    let teamKills;
    let teamDeaths;
    let teamAssists;
    if (mypage.opgg && mypage.games) {
        wl = _.countBy(mypage.games, (o) => {
            let team_key = _.find(o.participants, {
                summoner: {
                    summoner_id: mypage.opgg.summoner_id
                }
            }).team_key;
            let isWin = _.find(o.teams, {
                key: team_key
            }).game_stat.is_win;
            return isWin;
        });

        kills = _.sumBy(mypage.games, (o) => {
            let me = _.find(o.participants, {
                summoner: {
                    summoner_id: mypage.opgg.summoner_id
                }
            });

            return me.stats.kill
        });

        deaths = _.sumBy(mypage.games, (o) => {
            let me = _.find(o.participants, {
                summoner: {
                    summoner_id: mypage.opgg.summoner_id
                }
            });

            return me.stats.death
        });

        assists = _.sumBy(mypage.games, (o) => {
            let me = _.find(o.participants, {
                summoner: {
                    summoner_id: mypage.opgg.summoner_id
                }
            });

            return me.stats.assist
        });

        teamKills = _.sumBy(mypage.games, (o) => {
            let me = _.find(o.participants, {
                summoner: {
                    summoner_id: mypage.opgg.summoner_id
                }
            });

            return _.find(o.teams, {
                key: me.team_key
            }).game_stat.kill;
        });

        teamDeaths = _.sumBy(mypage.games, (o) => {
            let me = _.find(o.participants, {
                summoner: {
                    summoner_id: mypage.opgg.summoner_id
                }
            });

            return _.find(o.teams, {
                key: me.team_key
            }).game_stat.death;
        });

        teamAssists = _.sumBy(mypage.games, (o) => {
            let me = _.find(o.participants, {
                summoner: {
                    summoner_id: mypage.opgg.summoner_id
                }
            });

            return _.find(o.teams, {
                key: me.team_key
            }).game_stat.assist;
        })
    }

    const renderCustomizedLabel = (props: any) => {
        const { x, y, value } = props;
        let tmp = value.split(" ");

        return (
            <g style={{fontSize: "11px"}}>
               <text x={x} y={y-24} textAnchor={"middle"} fill={"#9e9eb1"} fontWeight={"bold"}>
                   { tmp[0] }
               </text>
                <text x={x} y={y-12} textAnchor={"middle"} fill={"#7b7a8e"}>
                    { tmp[1] }
                </text>
            </g>
        );
    };

    const colorCategory = {
        "UNRANKED": "#cbcdcd",
        "IRON": "#cbcdcd",
        "BRONZE": "#a88a67",
        "SILVER": "#c3cbd1",
        "GOLD": "#ffc659",
        "PLATINUM": "#80eee4",
        "DIAMOND": "#00a0d2",
        "MASTER": "#ff6c81",
        "GRANDMASTER": "#ff6c81",
        "CHALLENGER": "#ff6c81"
    };

    const renderCustomizedDot = (props: any) => {
        const { cx, cy, r, stroke, payload, value, categoryColors } = props;
        let color = colorCategory[props.payload.tier_info.tier];

        return (
            <circle cx={cx} cy={cy} r={3} stroke={color} strokeWidth={2} fill={"#31313c"} />
        );
    };

    const renewal = _.debounce(() => {
        if (!isRenewing) {
            customToastr.info(t("renewing-alert"));
            setIsRenewing(true);
            window.api.invoke("lol-renewal", localStorage.getItem("currentUser") ?? "Hide on bush")
                .then((res) => {
                    try {
                        if (!res.message) {
                            setTimeout(() => {
                                reload();
                                setIsRenewing(false);
                                setIsRenewed(true);
                                customToastr.success(t("renewed-alert"));
                            }, res.data.delay + 2000);
                        } else if (res.renewable_at) {
                            let tmp1 = new Date(res.renewable_at);
                            let tmp2 = new Date();
                            setIsRenewing(false);
                            if (localStorage.getItem("i18n") === "kr") {
                                customToastr.info(`${parseInt((tmp1 - tmp2) / 1000)} 초 뒤 갱신 가능합니다.`);
                            } else {
                                customToastr.info(`Please try updating after ${parseInt((tmp1 - tmp2) / 1000)} seconds`);
                            }
                        } else {
                            setIsRenewed(false);
                            setIsRenewing(false);
                        }
                    } catch (e) {
                        setIsRenewing(false);
                        customToastr.error(t("renew-fail-alert"));
                    }
                }).catch(() => {
                setIsRenewing(false);
                customToastr.error(t("renew-fail-alert"));
            });
        }
    }, 200);

    try {
        return (
            <div className={"main-container mypage"}>
                <div className={"mypage-top"}>
                    <div className={"mypage-top-bg"} style={{
                        backgroundImage: `url("http://ddragon.leagueoflegends.com/cdn/img/champion/splash/${mostChampions && _.find(championsMetaData.data, {
                            id: mostChampions.length >= 1 ? mostChampions[0][0].championId : 1
                        })?.key}_0.jpg")`
                    }}>
                    </div>
                    <div className={"mypage-top__top"}>
                        <div className={`mypage-update-btn ${isRenewed ? "mypage-update-btn-done" : ""}`}
                        onClick={renewal}><img src={"../../assets/images/icon-refresh.svg"} style={{marginRight: "4px"}}/>
                            {isRenewing
                                ? <>{t("renewing")}</>
                                : <>{isRenewed
                                    ? <>{t("renewed")}</>
                                    : <>{t("renew")}</>
                                }</>
                            }

                        </div>
                        {allChampions &&
                        <>
                            <figure className="chart-two animate">
                                <svg role="img" xmlns="http://www.w3.org/2000/svg">
                                    <circle className="circle-background"/>
                                    <circle className="circle-foreground" style={{
                                        strokeDasharray: `${_.sumBy(_.slice(allChampions, 0, 20), (o: any) => {
                                            return o.stats["CareerStats.js"].victory;
                                        }) / 20 * 251.2}px 251.2px`
                                    }}/>
                                </svg>
                                <div className={"chart-inner"}>
                                    <div>{(_.sumBy(_.slice(allChampions, 0, 20), (o: any) => {
                                        return o.stats["CareerStats.js"].victory;
                                    }) / 20 * 100).toFixed(0)}%
                                    </div>
                                    <div>{t("mypage.win-ratio")}</div>
                                </div>
                            </figure>
                            <figure className="chart-two animate">
                                <svg role="img" xmlns="http://www.w3.org/2000/svg">
                                    <circle className="circle-background"/>
                                    <circle className="circle-foreground" style={{
                                        strokeDasharray: `${_.sumBy(_.slice(allChampions, 0, 20), (o: any) => {
                                            return o.stats["CareerStats.js"].victory;
                                        }) / 20 * 100 / 70 * 251.2}px 251.2px`
                                    }}/>
                                </svg>
                                <div className={"chart-inner"}>
                                    <div>{getGrade(Math.round(_.sumBy(_.slice(allChampions, 0, 20), (o: any) => {
                                        return o.stats["CareerStats.js"].victory;
                                    }) / 20 * 100))}</div>
                                    <div>{t("mypage.condition")}</div>
                                </div>
                            </figure>
                            <figure className="chart-two animate">
                                <svg role="img" xmlns="http://www.w3.org/2000/svg">
                                    <circle className="circle-background"/>
                                    <circle className="circle-foreground" style={{
                                        strokeDasharray: `${(_.sumBy(allChampions, (o: any) => {
                                            return o.stats["CareerStats.js"].kills + o.stats["CareerStats.js"].assists;
                                        }) / (_.sumBy(allChampions, (o: any) => {
                                            return o.stats["CareerStats.js"].deaths;
                                        }) === 0 ? 1 : _.sumBy(allChampions, (o: any) => {
                                            return o.stats["CareerStats.js"].deaths;
                                        }))) / 5 * 251.2}px 251.2px`
                                    }}/>
                                </svg>
                                <div className={"chart-inner"}>
                                    <div>{getKdaGrade((_.sumBy(allChampions, (o: any) => {
                                        return o.stats["CareerStats.js"].kills + o.stats["CareerStats.js"].assists;
                                    }) / (_.sumBy(allChampions, (o: any) => {
                                        return o.stats["CareerStats.js"].deaths;
                                    }) === 0 ? 1 : _.sumBy(allChampions, (o: any) => {
                                        return o.stats["CareerStats.js"].deaths;
                                    }))))}</div>
                                    <div>{t("mypage.laning")}</div>
                                </div>
                            </figure>
                        </>
                        }
                    </div>
                    <div className={"mypage-top__bottom"}>
                        <div className={"mypage-top__bottom-seasons"}>
                            {mypage.ranked.highestRankedEntrySR.tier !== "NONE"
                                ?
                                <div>S2021 {capitalizeFirstLetter(mypage.ranked.highestRankedEntrySR.tier)} {mypage.ranked.highestRankedEntrySR.division === "NA" ? "" : mypage.ranked.highestRankedEntrySR.division}</div>
                                : <div>S2021 Unranked</div>
                            }
                            {mypage.ranked.highestPreviousSeasonEndTier !== "NONE"
                                ?
                                <div>S2020 {capitalizeFirstLetter(mypage.ranked.highestPreviousSeasonEndTier)} {mypage.ranked.highestPreviousSeasonEndDivision === "NA" ? "" : mypage.ranked.highestPreviousSeasonEndDivision}</div>
                                : <div>S2020 Unranked</div>
                            }
                        </div>
                        <div className={"mypage-top__bottom-profile"}>
                            <div className={"mypage-top__bottom-profile-img"}>
                                <img
                                    src={`https://opgg-static.akamaized.net/images/profile_icons/profileIcon${mypage.summoner.profileIconId}.jpg?image=q_auto:best,w_100&v=1518361200`}/>
                                <div className={"profile-level"}>{mypage.summoner.summonerLevel}</div>
                            </div>
                            <div className={"mypage-top__bottom-profile-info"} style={{marginRight: "40px"}}>
                                <div onClick={onClickSummonerName(mypage.summoner.displayName)}
                                     style={{cursor: "pointer"}}>{mypage.summoner.displayName} <img
                                    src={"../../assets/images/icon-link.svg"}/></div>
                                {mypage.opgg.ladder_rank &&
                                <div style={{fontSize: "12px", marginTop: "4px"}}>
                                    <span style={{color: "#9e9eb1"}}>Ladder Rank</span> <span
                                    style={{color: "#5383e8"}}>{ordinal_suffix_of(mypage.opgg.ladder_rank.rank)}</span>
                                </div>
                                }
                            </div>
                            {["RANKED_SOLO_5x5", "RANKED_FLEX_SR"].map((queue) => {
                                let queueMap: any = {
                                    "RANKED_SOLO_5x5": t("mypage.ranked-solo"),
                                    "RANKED_FLEX_SR": t("mypage.ranked-flex"),
                                    "RANKED_TFT": t("mypage.ranked-tft")
                                };
                                return (
                                    <div className={"mypage-top__bottom-profile-rank"} key={queue}>
                                        <div className={"mypage-section-title"}>{queueMap[queue]}</div>
                                        <div className={"mypage-top__bottom-profile-rank-contents"}>
                                            {mypage.ranked.queueMap[queue].tier !== "NONE"
                                                ? <img
                                                    src={`https://opgg-static.akamaized.net/images/medals/${mypage.ranked.queueMap[queue].tier.toLowerCase()}_1.png?image=q_auto:best,w_40&v=1`}/>
                                                : <img src={`../../assets/images/default.png`}/>
                                            }
                                            <div>
                                                {mypage.ranked.queueMap[queue].tier !== "NONE"
                                                    ? <div style={{
                                                        fontWeight: "bold",
                                                        fontSize: "14px",
                                                        color: "#fff"
                                                    }}>{capitalizeFirstLetter(mypage.ranked.queueMap[queue].tier)} {mypage.ranked.queueMap[queue].division === "NA" ? "" : mypage.ranked.queueMap[queue].division}</div>
                                                    : <div style={{
                                                        fontWeight: "bold",
                                                        fontSize: "14px",
                                                        color: "#fff"
                                                    }}>Unranked</div>
                                                }
                                                <div>{mypage.ranked.queueMap[queue].leaguePoints}LP</div>
                                            </div>
                                            <div>
                                                <div
                                                    style={{marginBottom: "2px"}}>{mypage.ranked.queueMap[queue].wins}W {mypage.ranked.queueMap[queue].losses}L
                                                </div>
                                                {mypage.ranked.queueMap[queue].tier !== "NONE"
                                                    ?
                                                    <div>{(mypage.ranked.queueMap[queue].wins / (mypage.ranked.queueMap[queue].wins + mypage.ranked.queueMap[queue].losses) * 100).toFixed(0)}%</div>
                                                    : <div>0%</div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <div className={"mypage-bottom"}>
                    <div className={"mypage-bottom-section"}>
                        <div className={"mypage-section-title"}>{t("mypage.tier-graph")}</div>
                        {mypage.opgg.lp_histories.length > 0 ?
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    width={500}
                                    height={300}
                                    data={mypage.opgg.lp_histories.slice(-7)}
                                    margin={{
                                        top: 40,
                                        right: 30,
                                        left: 30,
                                        bottom: 0,
                                    }}
                                >
                                    <XAxis dataKey="created_at" axisLine={false} tickLine={false} fontSize={"11px"}
                                           color={"#7b7a8e"}/>
                                    <YAxis dataKey="elo_point" hide={true} domain={["dataMin-10", "dataMax"]}/>
                                    <Line type="linear" dataKey="elo_point" strokeDasharray="4"
                                          isAnimationActive={false}
                                          stroke={"#fff"} dot={renderCustomizedDot}>
                                        <LabelList dataKey="tier" content={renderCustomizedLabel}/>
                                    </Line>
                                </LineChart>
                            </ResponsiveContainer>
                            : <div className={"coming-soon"}>{t("mypage.no-data")}</div>
                        }
                    </div>
                    <div className={"mypage-bottom-section mypage-bottom-section__2"}>
                        <div className={"mypage-section-title"}
                             style={{marginLeft: "14px"}}>{t("mypage.most-champions")}</div>
                        {mypage.career && mostChampions
                            ? <MostChampions/>
                            : <div className={"coming-soon"}>Please login to see data</div>
                        }
                    </div>
                    <div className={"mypage-bottom-section mypage-bottom-section__3"}>
                        <div className={"mypage-section-title"}>{t("mypage.analytics")}</div>
                        {mypage.career && mostLine.length >= 1
                            ? mostLine.map((lane: any, i: number) => {
                                let laneName = lane[0].lane;
                                if (laneName !== "NONE" && cnt < 2) {
                                    cnt += 1;
                                    let winRate = Math.round(_.sumBy(lane, (o: any) => {
                                        return o.stats["CareerStats.js"].victory;
                                    }) / lane.length * 100);

                                    let grade = getGrade(winRate);
                                    return (
                                        <div className={"most-line-wrapper"}
                                             style={{marginTop: `${i === 0 ? "28px" : ""}`}} key={i}>
                                            <div className={"most-lane-img"}>
                                                <img src={`../../assets/images/icon-position-${laneName}-wh.svg`}/>
                                            </div>
                                            <div className={"most-lane-champion-stats"}>
                                                <div>{grade}</div>
                                                <div>{winRate}%</div>
                                            </div>
                                            <div className={"most-lane-champion-img-container"}>
                                                {_.sortBy(_.groupBy(lane, "championId"), (o) => {
                                                    return -o.length;
                                                }).map((champion, i) => {
                                                    if (i < 5) {
                                                        return (
                                                            <div className={"most-lane-champion-img"} key={i}>
                                                                <img src={`${_.find(championsMetaData.data, {
                                                                    id: champion[0].championId
                                                                })?.image_url}?image=c_scale,q_auto,w_42&v=1628647804`}/>
                                                            </div>
                                                        )
                                                    }
                                                })}
                                            </div>
                                        </div>
                                    )
                                }
                            })
                            : <div className={"coming-soon"}>{t("mypage.no-data")}</div>
                        }
                        {mypage.career && mostLine.length >= 1 &&
                        <div className={"analytics"}>
                            <div
                                style={{marginRight: "20px"}}>{t("mypage.play-time")} {Math.ceil(_.sumBy(allChampions, (o: any) => {
                                return o.stats["CareerStats.js"].timePlayed;
                            }) / 1000 / 3600)} {t("mypage.hours")}</div>
                            <div>KDA {_.sumBy(allChampions, (o: any) => {
                                return o.stats["CareerStats.js"].deaths;
                            }) === 0
                                ? "Perfect"
                                : (_.sumBy(allChampions, (o: any) => {
                                    return o.stats["CareerStats.js"].kills + o.stats["CareerStats.js"].assists;
                                }) / _.sumBy(allChampions, (o: any) => {
                                    return o.stats["CareerStats.js"].deaths;
                                })).toFixed(2)}</div>
                        </div>
                        }
                    </div>
                </div>

                {/*<div className={"mypage-scroll-down-btn"}>{t("mypage.match-history")} Coming Soon <img*/}
                {/*    src={"../../assets/images/icon-arrow-down-btn.svg"}/></div>*/}

                {mypage.games.length > 1 &&
                <div className={"mypage-stats"} style={{width: "100%", paddingBottom: "8px"}}>
                    <div className={"mypage-stats-left"}>
                        <div className={"mypage-stats-left-container"} style={{}}>
                            <div>20G {wl.true}W {wl.false}L</div>

                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                marginTop: "18px",
                                marginBottom: "7px"
                            }}>
                                <figure className="chart-two chart-wl animate" style={{margin: "0 !important"}}>
                                    <svg role="img" xmlns="http://www.w3.org/2000/svg">
                                        <circle className="circle-background"/>
                                        <circle className="circle-foreground" style={{
                                            strokeDasharray: `${wl.true / 20 * 251.2}px 251.2px`
                                        }}/>
                                    </svg>
                                    <div className={"chart-inner"}>
                                        <div>{(wl.true / 20 * 100).toFixed(0)}%
                                        </div>
                                        <div>{t("mypage.win-ratio")}</div>
                                    </div>
                                </figure>
                                <div style={{color: "#9e9eb1"}}>
                                    <div>{(kills / 20).toFixed(1)} / <span
                                        style={{color: "#e84057"}}>{(deaths / 20).toFixed(1)}</span> / {(assists / 20).toFixed(1)}
                                    </div>
                                    <div style={{
                                        color: "#fff",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        margin: "2px 0"
                                    }}>{((kills + assists) / deaths).toFixed(2)}:1
                                    </div>
                                    <div
                                        style={{color: "#e84057"}}>P/Kill {((kills + assists) / (teamKills) * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        {mypage.opgg.recent_champion_stats.length > 0 &&
                        <div className={"mypage-stats-left-container"}>
                            {t("recently-played")}
                            <div style={{marginTop: "16px"}}>
                                {mypage.opgg.recent_champion_stats.map((stats) => {
                                    let kda = "Perfect";
                                    if (stats.death !== 0) {
                                        kda = ((stats.kill + stats.assist) / stats.death).toFixed(2)
                                    }
                                    let kdaColor =
                                        kda < 3 ? "#3c3c3c"
                                            : kda < 4 ? "#27b38a"
                                                : kda < 5 ? "#1f8ecd"
                                                    : kda >= 5 ? "#ff7905" : "";
                                    return (
                                        <div className={"mypage-stats-left-container-recent"} style={{}}>
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                overflow: "hidden",
                                                borderRadius: "8px",
                                                width: "36px",
                                                height: "36px",
                                                border: `2px solid ${kdaColor}`,
                                                marginRight: "8px"
                                            }}>
                                                <img loading={"lazy"} src={`${_.find(championsMetaData.data, {
                                                    id: stats.id
                                                })?.image_url}?image=c_scale,q_auto,w_42&v=1628647804`} style={{
                                                    objectFit: "cover",
                                                    objectPosition: "center",
                                                    width: "36px",
                                                    height: "36px",
                                                    transform: "scale(1.1)"
                                                }}/>
                                            </div>
                                            <div style={{fontSize: "11px"}}>
                                                <div style={{
                                                    color: "#fff",
                                                    marginBottom: "4px"
                                                }}>{t(`champions.${stats.id}`)}</div>
                                                <div><span
                                                    style={{color: "#e84057"}}>{(stats.win / stats.play * 100).toFixed(0)}%</span> {stats.win}W {stats.play - stats.win}L
                                                </div>
                                            </div>
                                            <div style={{
                                                marginLeft: "auto",
                                                fontSize: "11px",
                                                color: kdaColor === "#3c3c3c" ? "#7b7a8e" : kdaColor
                                            }}>
                                                {((stats.kill + stats.assist) / stats.death).toFixed(2)}:1 KDA
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        }
                    </div>
                    <div className={"mypage-stats-right"}>
                        {mypage.games.map((game, i) => {
                            let me = _.find(game.participants, {
                                summoner: {
                                    summoner_id: mypage.opgg.summoner_id
                                }
                            });
                            let blues = _.filter(game.participants, {"team_key": "BLUE"});
                            let reds = _.filter(game.participants, {"team_key": "RED"});

                            let blueTeam = _.find(game.teams, {"key": "BLUE"})
                            let redTeam = _.find(game.teams, {"key": "RED"})

                            let OPScoreMax = _.minBy((me.team_key === "RED" ? reds : blues), (o) => {
                                return o.stats.op_score_rank;
                            });

                            let isWin = _.find(game.teams, {
                                game_stat: {
                                    is_win: true
                                }
                            })?.key === me.team_key;

                            let isRemake = game?.teams[0]?.game_stat?.is_remake;

                            let opscore = OPScoreMax.summoner.summoner_id === me.summoner.summoner_id ? (isWin ? "MVP" : "ACE") : null;
                            let kda = "Perfect";
                            if (me.stats.death !== 0) {
                                kda = ((me.stats.kill + me.stats.assist) / me.stats.death).toFixed(2) + ":1";
                            }

                            // console.log(game, isWin, me, reds, OPScoreMax, opscore);

                            return (
                                <div className={"mypage-stats-right-list"} key={i}>
                                    <div
                                        className={`mypage-stats-right-list-result ${isRemake ? "" : (!isWin ? "mypage-stats-right-list-result-lose" : "mypage-stats-right-list-result-win")}`}></div>
                                    <div style={{
                                        marginLeft: "12px",
                                        width: "106px",
                                        marginTop: `${i18n === "en" ? "12px" : "8px"}`,
                                        marginRight: "10px"
                                    }}>
                                        <div
                                            className={`${isRemake ? "remake" : (isWin ? "win" : "lose")}`}>{game.queue_info.queue_translate}</div>
                                        <div style={{
                                            color: "#9e9eb1",
                                            marginTop: "2px"
                                        }}>{timeForToday(game.created_at)}</div>
                                        <div style={{
                                            width: "48px",
                                            height: "1px",
                                            backgroundColor: "#31313c",
                                            marginTop: "8px",
                                            marginBottom: "4px"
                                        }}></div>
                                        <div style={{
                                            fontWeight: "bold",
                                            color: "#9e9eb1"
                                        }}>{t(`${isRemake ? "remake" : (isWin ? "win" : "lose")}`)}</div>
                                        <div style={{
                                            color: "#9e9eb1",
                                            marginTop: "2px"
                                        }}>{parseInt(game.game_length_second / 60)}{t("minutes")} {game.game_length_second % 60}{t("seconds")}</div>
                                    </div>
                                    <div style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        marginTop: `${i18n === "en" ? "10px" : "7px"}`
                                    }}>
                                        <div style={{display: "flex", alignItems: "center"}}>
                                            <div style={{position: "relative"}}>
                                                <div style={{
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    overflow: "hidden",
                                                    borderRadius: "24px",
                                                    width: "48px",
                                                    height: "48px"
                                                }}>
                                                    <img loading={"lazy"} src={`${_.find(championsMetaData.data, {
                                                        id: me.champion_id
                                                    })?.image_url}?image=c_scale,q_auto,w_54&v=1628647804`} style={{
                                                        objectFit: "cover",
                                                        objectPosition: "center",
                                                        width: "48px",
                                                        height: "48px",
                                                        transform: "scale(1.1)"
                                                    }}/>
                                                </div>
                                                <div className={"level"}>{me.stats.champion_level}</div>
                                            </div>
                                            <div style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                marginLeft: "4px"
                                            }}>
                                                <img loading={"lazy"} src={`${_.find(spellMetaData.data, {
                                                    id: me.spells[0]
                                                }).image_url}?image=c_scale,q_auto,w_22&v=1628647804`}
                                                     style={{
                                                         marginTop: "1px",
                                                         marginBottom: "2px",
                                                         borderRadius: "4px"
                                                     }}/>
                                                <img loading={"lazy"} src={`${_.find(spellMetaData.data, {
                                                    id: me.spells[1]
                                                }).image_url}?image=c_scale,q_auto,w_22&v=1628647804`}
                                                     style={{borderRadius: "4px"}}/>
                                            </div>
                                            <div style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                marginLeft: "4px"
                                            }}>
                                                <div style={{
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    width: "22px",
                                                    height: "22px",
                                                    backgroundColor: "#000",
                                                    borderRadius: "11px",
                                                    marginTop: "1px",
                                                    marginBottom: "2px"
                                                }}>
                                                    <Tippy content={<div
                                                        dangerouslySetInnerHTML={{__html: t(`perks.${me.rune.primary_rune_id}.tooltip`)}}/>}>
                                                        <img loading={"lazy"} src={`${_.find(runeMetaData.data, {
                                                            id: me.rune.primary_rune_id
                                                        }).image_url}?image=c_scale,q_auto,w_22&v=1628647804`}/>
                                                    </Tippy>
                                                </div>
                                                <Tippy content={<div
                                                    dangerouslySetInnerHTML={{__html: t(`perkStyles.${me.rune.secondary_page_id}.tooltip`)}}/>}>
                                                    <img loading={"lazy"} src={`${_.find(runePageMetaData.data, {
                                                        id: me.rune.secondary_page_id
                                                    }).image_url}?image=c_scale,q_auto,w_22&v=1628647804`}
                                                         style={{borderRadius: "4px"}}/>
                                                </Tippy>
                                            </div>
                                            <div style={{marginLeft: "12px", width: "119px"}}>
                                                <div style={{fontSize: "15px", color: "#fff", fontWeight: "bold"}}>
                                                    {me.stats.kill}
                                                    <span style={{color: "#7b7a8e", fontWeight: "normal"}}> / </span>
                                                    <span style={{color: "#e84057"}}>{me.stats.death}</span>
                                                    <span style={{color: "#7b7a8e", fontWeight: "normal"}}> / </span>
                                                    {me.stats.assist}
                                                </div>
                                                <div style={{color: "#9e9eb1", marginTop: "2px"}}>
                                                    {kda} KDA
                                                </div>
                                            </div>
                                            <div style={{
                                                borderLeft: "solid 1px #31313c",
                                                paddingLeft: "8px",
                                                width: "138px"
                                            }}>
                                                <div style={{
                                                    marginBottom: "2px",
                                                    color: "#e84057"
                                                }}>P/Kill {((me.stats.kill + me.stats.assist) / (me.team_key === "RED" ? redTeam.game_stat.kill : blueTeam.game_stat.kill) * 100).toFixed(0)}%
                                                </div>
                                                <div style={{
                                                    marginBottom: "2px",
                                                    fontSize: "11px"
                                                }}>{t("control-ward")} {me.stats.vision_wards_bought_in_game}</div>
                                                <div style={{
                                                    marginBottom: "2px",
                                                    fontSize: "11px"
                                                }}>CS {me.stats.minion_kill + me.stats.neutral_minion_kill} ({((me.stats.minion_kill + me.stats.neutral_minion_kill) / parseInt(game.game_length_second / 60)).toFixed(1)})
                                                </div>
                                                {game.average_tier_info &&
                                                <div style={{fontSize: "11px"}}>{t("tier-average")} <b>{game.average_tier_info.tier[0] + game.average_tier_info.tier.toLowerCase().slice(1)}</b>
                                                </div>
                                                }
                                            </div>
                                        </div>
                                        <div style={{display: "flex", alignItems: "center"}}>
                                            <div style={{display: "flex"}}>
                                                {me.items.map((item) => {
                                                    if (item !== 0) {
                                                        return (
                                                            <Tippy content={<div
                                                                dangerouslySetInnerHTML={{__html: t(`items.${item}.tooltip`)}}/>}>
                                                                <img loading={"lazy"}
                                                                     src={`${_.find(itemMetaData.data, {
                                                                         id: item
                                                                     })?.image_url}?image=c_scale,q_auto,w_22&v=1628647804`}
                                                                     style={{borderRadius: "4px", marginRight: "2px"}}/>
                                                            </Tippy>
                                                        )
                                                    }

                                                    return (
                                                        <div className={"blank"}></div>
                                                    )
                                                })}
                                                {me.trinket_item ?
                                                    <Tippy content={<div
                                                        dangerouslySetInnerHTML={{__html: t(`items.${me.trinket_item}.tooltip`)}}/>}>
                                                        <img loading={"lazy"} src={`${_.find(itemMetaData.data, {
                                                            id: me.trinket_item
                                                        }).image_url}?image=c_scale,q_auto,w_22&v=1628647804`}
                                                             style={{borderRadius: "4px", marginRight: "8px"}}/>
                                                    </Tippy>
                                                    : <div className={"blank"}></div>
                                                }
                                            </div>
                                            <div style={{display: "flex"}}>
                                                {me.stats.largest_multi_kill > 1 &&
                                                <div
                                                    className={`tags`}>{t(`multikill.${me.stats.largest_multi_kill}`)}</div>
                                                }
                                                {opscore &&
                                                <div
                                                    className={`tags ${opscore === "MVP" ? "mvp" : "ace"}`}>{opscore}</div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        display: "flex",
                                        marginLeft: "23px",
                                        marginTop: "4px",
                                        alignItems: "center"
                                    }}>
                                        <div style={{marginRight: "8px"}}>
                                            {blues.map((summoner, i) => {
                                                if (summoner.summoner) {
                                                    return (
                                                        <div style={{
                                                            display: "flex",
                                                            marginBottom: "2px",
                                                            cursor: "pointer"
                                                        }}
                                                             key={i}
                                                             onClick={onClickSummonerName(summoner.summoner.name)}>
                                                            <div style={{
                                                                display: "flex",
                                                                justifyContent: "center",
                                                                alignItems: "center",
                                                                overflow: "hidden",
                                                                borderRadius: "8px",
                                                                width: "16px",
                                                                height: "16px",
                                                                marginRight: "4px"
                                                            }}>
                                                                <img loading={"lazy"}
                                                                     src={`${_.find(championsMetaData.data, {
                                                                         id: summoner.champion_id
                                                                     })?.image_url}?image=c_scale,q_auto,w_22&v=1628647804`}
                                                                     style={{
                                                                         objectFit: "cover",
                                                                         objectPosition: "center",
                                                                         width: "16px",
                                                                         height: "16px",
                                                                         transform: "scale(1.1)"
                                                                     }}/>
                                                            </div>
                                                            <div style={{
                                                                width: "60px",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap"
                                                            }}>{summoner.summoner.name}</div>
                                                        </div>
                                                    )
                                                } else {
                                                    return (
                                                        <div style={{
                                                            display: "flex",
                                                            marginBottom: "2px",
                                                            cursor: "pointer"
                                                        }}>
                                                            <div style={{
                                                                display: "flex",
                                                                justifyContent: "center",
                                                                alignItems: "center",
                                                                overflow: "hidden",
                                                                borderRadius: "8px",
                                                                width: "16px",
                                                                height: "16px",
                                                                marginRight: "4px"
                                                            }}>
                                                                <img loading={"lazy"}
                                                                     src={`${_.find(championsMetaData.data, {
                                                                         id: summoner.champion_id
                                                                     })?.image_url}?image=c_scale,q_auto,w_22&v=1628647804`}
                                                                     style={{
                                                                         objectFit: "cover",
                                                                         objectPosition: "center",
                                                                         width: "16px",
                                                                         height: "16px",
                                                                         transform: "scale(1.1)"
                                                                     }}/>
                                                            </div>
                                                            <div style={{
                                                                width: "60px",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap"
                                                            }}>(Bot)
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            })}
                                        </div>
                                        <div>
                                            {reds.map((summoner, i) => {
                                                if (summoner.summoner) {
                                                    return (
                                                        <div style={{
                                                            display: "flex",
                                                            marginBottom: "2px",
                                                            cursor: "pointer"
                                                        }}
                                                             key={i}
                                                             onClick={onClickSummonerName(summoner.summoner.name)}>
                                                            <div style={{
                                                                display: "flex",
                                                                justifyContent: "center",
                                                                alignItems: "center",
                                                                overflow: "hidden",
                                                                borderRadius: "8px",
                                                                width: "16px",
                                                                height: "16px",
                                                                marginRight: "4px"
                                                            }}>
                                                                <img loading={"lazy"}
                                                                     src={`${_.find(championsMetaData.data, {
                                                                         id: summoner.champion_id
                                                                     })?.image_url}?image=c_scale,q_auto,w_22&v=1628647804`}
                                                                     style={{
                                                                         objectFit: "cover",
                                                                         objectPosition: "center",
                                                                         width: "16px",
                                                                         height: "16px",
                                                                         transform: "scale(1.1)"
                                                                     }}/>
                                                            </div>
                                                            <div style={{
                                                                width: "60px",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap"
                                                            }}>{summoner.summoner.name}</div>
                                                        </div>
                                                    )
                                                } else {
                                                    return (
                                                        <div style={{
                                                            display: "flex",
                                                            marginBottom: "2px",
                                                            cursor: "pointer"
                                                        }}>
                                                            <div style={{
                                                                display: "flex",
                                                                justifyContent: "center",
                                                                alignItems: "center",
                                                                overflow: "hidden",
                                                                borderRadius: "8px",
                                                                width: "16px",
                                                                height: "16px",
                                                                marginRight: "4px"
                                                            }}>
                                                                <img loading={"lazy"}
                                                                     src={`${_.find(championsMetaData.data, {
                                                                         id: summoner.champion_id
                                                                     })?.image_url}?image=c_scale,q_auto,w_22&v=1628647804`}
                                                                     style={{
                                                                         objectFit: "cover",
                                                                         objectPosition: "center",
                                                                         width: "16px",
                                                                         height: "16px",
                                                                         transform: "scale(1.1)"
                                                                     }}/>
                                                            </div>
                                                            <div style={{
                                                                width: "60px",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap"
                                                            }}>(Bot)
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div className={"btn-more"} onClick={onClickSummonerName(mypage.opgg.name)}>{t("more")} <img
                            src={"../../assets/images/icon-link.svg"} style={{marginLeft: "8px"}}/></div>
                    </div>
                </div>
                }
            </div>
        )
    } catch (e) {
        return (
            <Error error={500} msgType={"503"} isMini={false}/>
        )
    }
}

export default MyPage;