import React, {useCallback, useEffect, useState} from 'react';
import _ from 'lodash';
import {useTypedSelector} from "../../redux/store";
import {useTranslation} from "react-i18next";
import {useDispatch} from "react-redux";
import {setEOG, setIngame, setOpScore} from "../../redux/slices/common";
import Tippy from "@tippyjs/react";
import Error from "../components/common/Error";
import sendGA4Event from "../../utils/ga4";
import NotSupported from "../../components/common/NotSupported";
const spellMetaData = require("../../../assets/data/meta/spells.json");
const championsMetaData = require("../../../assets/data/meta/champions.json");
const runeMetaData = require("../../../assets/data/meta/runes.json");
const runePageMetaData = require("../../../assets/data/meta/runePages.json");

const IngameNew = () => {
    const { t }= useTranslation();
    const {ingame, opscore, eog, champion} = useTypedSelector(state => state.common);
    const dispatch = useDispatch();
    let availability = localStorage.getItem("availability") ?? true;

    useEffect(() => {
        sendGA4Event("view_ingame_page", {
            menu_name: "full"
        });
    }, []);

    if (!availability || availability === "false") {
        return (
            <NotSupported />
        )
    }

    if (ingame && ingame.data) {
        let myTeam: any = _.sortBy(_.filter(ingame.data.participants, {
            team_key: "BLUE"
        }), (el) => {
            let position: any = {
                "TOP": 0,
                "JUNGLE": 1,
                "MID": 2,
                "ADC": 3,
                "SUPPORT": 4
            }
            return position[el.position];
        });

        let enemyTeam: any = _.sortBy(_.filter(ingame.data.participants, {
            team_key: "RED"
        }), (el) => {
            let position: any = {
                "TOP": 0,
                "JUNGLE": 1,
                "MID": 2,
                "ADC": 3,
                "SUPPORT": 4
            }
            return position[el.position];
        });

        // console.log(myTeam
        //     , enemyTeam);

        let hasTip = champion && champion.tips && false;

        if (myTeam && enemyTeam && myTeam.length === 5 && enemyTeam.length === 5) {
            return (
                <div className="main-container live-ingame">
                    {hasTip &&
                        <div className={"live-ingame-tips"}>tips</div>
                    }
                    <div className={`live-ingame-table ${!eog && "live-ingame-table-active"}`} style={{marginTop: `${hasTip ? "" : "54px"}`}}>
                        <div className={`ingame-team-area ingame-team-area-blue ${eog && "ingame-team-area-active"}`}>
                        </div>
                        <div className={`ingame-team-area ingame-team-area-red ${eog && "ingame-team-area-active"}`}>
                        </div>
                        <div className="live-ingame-table-header live-ingame-table-header__1">
                            <div className="live-ingame-table-header__1-team">
                                <div className="name">{t("live.feature.ingame.blue")}</div>
                                {/*<div className="graph-damage-type">*/}
                                {/*    <div className="graph-damage-type-ap"> </div>*/}
                                {/*    <div className="graph-damage-type-ad"> </div>*/}
                                {/*</div>*/}
                            </div>
                            <div className="live-ingame-table-header__1-info">
                                {/*<div className="ap">AP</div>*/}
                                {/*<div className="ad">AD</div>*/}
                            </div>
                            <div className="live-ingame-table-header__1-team">
                                {/*<div className="graph-damage-type">*/}
                                {/*    <div className="graph-damage-type-ad"> </div>*/}
                                {/*    <div className="graph-damage-type-ap"> </div>*/}
                                {/*</div>*/}
                                <div className="name">{t("live.feature.ingame.red")}</div>
                            </div>
                        </div>
                        <div className="live-ingame-table-header live-ingame-table-header__2">
                            <div className="live-ingame-table-header-column live-ingame-table-header-column__1">S2022
                            </div>
                            <div
                                className="live-ingame-table-header-column live-ingame-table-header-column__2">{!eog ? t("live.feature.ingame.rune") : "Damage Dealt/Taken"}</div>
                            <div className="live-ingame-table-header-column live-ingame-table-header-column__3">S2021
                            </div>
                            <div
                                className="live-ingame-table-header-column live-ingame-table-header-column__position"></div>
                            <div className="live-ingame-table-header-column live-ingame-table-header-column__4">S2021
                            </div>
                            <div
                                className="live-ingame-table-header-column live-ingame-table-header-column__5">{!eog ? t("live.feature.ingame.rune") : "Damage Dealt/Taken"}</div>
                            <div className="live-ingame-table-header-column live-ingame-table-header-column__6">S2022
                            </div>
                        </div>
                        <div className="live-ingame-table-body">
                            <LiveInGameTableBody teams={{
                                ingame: ingame,
                                myTeam: myTeam,
                                enemyTeam: enemyTeam
                            }}/>
                        </div>
                    </div>
                </div>
            )
        } else {
            return (
                <Error error={500} msgType={"ingame"} isMini={false}/>
            )
        }
    } else if (ingame && ingame.success === false) {
        return (
            <Error error={503} msgType={"ingameIssue"} isMini={false} />
        )
    } else {
        return (
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: "column", fontSize: "16px", color: "#ddd"}}>
                <img src={"../../assets/images/lol-loading.png"} style={{borderRadius: "12px", marginBottom: "48px", width: "600px", height: "332px"}} />
                <div>{t("usage.ingame")}  <span style={{color: "#ff8e05", fontWeight: "bold"}}>{t("live.tab.ingame")}</span> {t("usage.move")}</div>
                <div style={{marginTop: "8px", fontSize: "14px", color: "#7b7a8e"}}>{t("usage.ps-ingame")}</div>
            </div>
        )
    }
}

const LiveInGameTableBody = ({teams}: any) => {
    const [swapState, setSwapState] = useState({
        src: -1,
        dest: -1,
        srcTeam: -1,
        swapped: true
    });

    // change to current user
    let myTeamId = _.find(teams.ingame.data.participants, {
       summoner: {name: localStorage.getItem("currentUser")}
    })?.team_key;
    if (!myTeamId) {
        myTeamId = "BLUE";
    }

    // console.log(localStorage.getItem("currentUser"), myTeamId);

    return <>{
        [...Array(5)].map((n, i) => {
            return (
                <LiveInGameTableBodyRow teams={{
                    myTeamId: myTeamId,
                    ingame: teams.ingame,
                    myTeam: teams.myTeam[i],
                    enemyTeam: teams.enemyTeam[i]
                }} i={i} swapState={swapState} setSwapState={setSwapState} />
            )
        })
    }</>
}

const LiveInGameTableBodyRow = ({teams, i, swapState, setSwapState}: any) => {
    const {t} = useTranslation();
    let line = ["top", "jungle", "mid", "adc", "support"];
    const {eog, opscore} = useTypedSelector(state => state.common);
    const [eogMyTeam, setEogMyTeam] = useState<any>();
    const [eogEnemyTeam, setEogEnemyTeam] = useState<any>();
    const [eogMyTeamAll, setEogMyTeamAll] = useState<any>();
    const [eogEnemyTeamAll, setEogEnemyTeamAll] = useState<any>();
    const [eogMyTeamDamage, setEogMyTeamDamage] = useState<any>();
    const [eogEnemyTeamDamage, setEogEnemyTeamDamage] = useState<any>();
    const [eogMyTeamTaken, setEogMyTeamTaken] = useState<any>();
    const [eogEnemyTeamTaken, setEogEnemyTeamTaken] = useState<any>();
    const [opscoreMyTeam, setOpscoreMyTeam] = useState<any>();
    const [opscoreEnemyTeam, setOpscoreEnemyTeam] = useState<any>();
    let formatter = new Intl.NumberFormat();
    const dispatch = useDispatch();

    const ordinal_suffix_of = (i) => {
        let j = i % 10, k = i % 100;
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

    const setEogData = () => {
        if (eog) {
            try {
                let players = eog.teams[0].players.concat(eog.teams[1].players);
                // console.log(
                //     teams,
                //     players,
                //     _.find(eog.teams, (o) => {
                //         return _.find(o.players, {
                //             summonerName: teams.myTeam.summoner.name
                //         })
                //     }),
                //     _.find(players, {
                //         summonerName: teams.myTeam.summoner.name
                //     }),
                //     _.find(players, {
                //         summonerName: teams.enemyTeam.summoner.name
                //     })
                // );

                setEogMyTeam(_.find(players, {
                    summonerName: teams.myTeam.summoner.name
                }));

                setEogEnemyTeam(_.find(players, {
                    summonerName: teams.enemyTeam.summoner.name
                }));

                setEogMyTeamAll(_.find(eog.teams, (o) => {
                    return _.find(o.players, {
                        summonerName: teams.myTeam.summoner.name
                    })
                }));

                setEogEnemyTeamAll(_.find(eog.teams, (o) => {
                    return _.find(o.players, {
                        summonerName: teams.enemyTeam.summoner.name
                    })
                }));

                let tmp = _.find(eog.teams, (o) => {
                    return _.find(o.players, {
                        summonerName: teams.myTeam.summoner.name
                    })
                });
                setEogMyTeamDamage(_.maxBy(tmp.players, (o) => {
                    return o.stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS
                }).stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS);
                setEogMyTeamTaken(_.maxBy(tmp.players, (o) => {
                    return o.stats.TOTAL_DAMAGE_TAKEN
                }).stats.TOTAL_DAMAGE_TAKEN);

                tmp = _.find(eog.teams, (o) => {
                    return _.find(o.players, {
                        summonerName: teams.enemyTeam.summoner.name
                    })
                });
                setEogEnemyTeamDamage(_.maxBy(tmp.players, (o) => {
                    return o.stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS
                }).stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS);
                setEogEnemyTeamTaken(_.maxBy(tmp.players, (o) => {
                    return o.stats.TOTAL_DAMAGE_TAKEN
                }).stats.TOTAL_DAMAGE_TAKEN);
            } catch {

            }
        }
    }

    const setOpscoreData = () => {
        if (opscore) {
            try {
                let team100Max;
                let team200Max;
                let win1 = 100;
                let win2 = 200;

                if (teams.myTeamId === 100) {
                    team100Max = _.maxBy(opscore.result.slice(0, 5), (o) => {
                        return o.opscore;
                    });
                    team200Max = _.maxBy(opscore.result.slice(5, 10), (o) => {
                        return o.opscore;
                    });
                } else {
                    win1 = 200;
                    win2 = 100;
                    team100Max = _.maxBy(opscore.result.slice(5, 10), (o) => {
                        return o.opscore;
                    });
                    team200Max = _.maxBy(opscore.result.slice(0, 5), (o) => {
                        return o.opscore;
                    });
                }


                let t1 = _.find(opscore.result, {
                    summonerName: teams.myTeam.summoner.name
                });
                let t2 = _.find(opscore.result, {
                    summonerName: teams.enemyTeam.summoner.name
                });
                let tmp1 = {};
                let tmp2 = {};

                if (t1) {
                    if (team100Max && team100Max.summonerName === teams.myTeam.summoner.name) {
                        Object.assign(tmp1, t1, {
                            isMax: true,
                            isWinning: opscore.winningTeam === win1,
                            rankString: opscore.winningTeam === win1 ? "MVP" : "ACE"
                        });
                    } else {
                        Object.assign(tmp1, t1, {
                            isMax: false,
                            isWinning: opscore.winningTeam === win1,
                            rankString: ordinal_suffix_of(t1.rank)
                        });
                    }
                }
                setOpscoreMyTeam(tmp1);

                if (t2) {
                    if (team200Max && team200Max.summonerName === teams.enemyTeam.summoner.name) {
                        Object.assign(tmp2, t2, {
                            isMax: true,
                            isWinning: opscore.winningTeam === win2,
                            rankString: opscore.winningTeam === win2 ? "MVP" : "ACE"
                        });
                    } else {
                        Object.assign(tmp2, t2, {
                            isMax: false,
                            isWinning: opscore.winningTeam === win2,
                            rankString: ordinal_suffix_of(t2.rank)
                        });
                    }
                }
                setOpscoreEnemyTeam(tmp2);
            } catch {

            }
        }
    }

    useEffect(() => {
        setEogData();
    }, [eog]);

    useEffect(() => {
        setOpscoreData();
    }, [opscore]);

    useEffect(() => {
        setEogData();
        setOpscoreData();
    }, [teams.ingame]);

    const getKDAClass = (kdaString: string) => {
        const kda = Number(kdaString.split(":")[0])
        if (kda >= 5) {
            return "kda-5"
        } else if (kda >= 4) {
            return "kda-4"
        } else if (kda >= 3) {
            return "kda-3"
        } else {
            return "kda-0"
        }
    }

    const [state, setState] = useState({
        isDragging: false,
        isDragging0: false,
        isDragging1: false,
        translateX: 0,
        translateY: 0
    });

    // mouse move
    const handleMouseMove = useCallback(
        ({ clientX, clientY }) => {
            if (state.isDragging) {
                setState(prevState => ({
                    ...prevState,
                    translateX: clientX,
                    translateY: clientY
                }));
            }
        },
        [state.isDragging]
    );

    // mouse left click release
    const handleMouseUp = useCallback(() => {
        if (state.isDragging) {
            setState(prevState => ({
                ...prevState,
                isDragging: false,
                isDragging0: false,
                isDragging1: false
            }));
            setSwapState(prevState => ({
                ...prevState,
                swapped: false,
            }));
        }
    }, [state.isDragging]);

    // mouse left click hold
    const handleMouseDown = useCallback((i, teamIndex) => () => {
        if (teamIndex === 0) {
            setState(prevState => ({
                ...prevState,
                isDragging: true,
                isDragging0: true
            }));
        } else {
            setState(prevState => ({
                ...prevState,
                isDragging: true,
                isDragging1: true
            }));
        }

        setSwapState(prevState => ({
            ...prevState,
            src: i,
            srcTeam: teamIndex
        }));
    }, []);

    // console.log(teams);
    const handleMouseEnter = useCallback((dest, teamIndex) => () => {
        if (!swapState.swapped) {
            if (swapState.srcTeam === teamIndex) {
                let clonedIngame = _.cloneDeep(teams.ingame);
                [clonedIngame.data.participants[dest], clonedIngame.data.participants[swapState.src]] = [clonedIngame.data.participants[swapState.src], clonedIngame.data.participants[dest]]
                dispatch(setIngame(clonedIngame));
                clonedIngame.swapped = true;
            }

            setSwapState(prevState => ({
                ...prevState,
                dest: dest,
                swapped: true
            }));
        }
    }, [swapState.swapped, swapState.src]);

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp, handleMouseEnter]);

    // console.log(teams.myTeam, teams.enemyTeam);

    let tierDivision: any = {
        1: "I",
        2: "II",
        3: "III",
        4: "IV"
    };

    let myPrevSeason = _.find(teams.myTeam.summoner.previous_seasons, {season_id: 17});
    let enemyPrevSeason = _.find(teams.enemyTeam.summoner.previous_seasons, {season_id: 17});

    return (
        <div className="live-ingame-table-body-row">
            {state.isDragging0 &&
            <div style={{
                width: "474px",
                height: "85px"
            }}></div>
            }
            <div className={`live-ingame-table-body-row-user ${state.isDragging0 ? "live-ingame-table-body-row-user-dragging" : ""}`}
                 onMouseEnter={handleMouseEnter(i, 0)}
                 style={{
                     position: `${state.isDragging0 ? "absolute" : ""}`,
                     // left: `${state.isDragging0 ? `${state.translateX-474/2}px`: ""}`,
                     top: `${state.isDragging0 ? `${state.translateY-160}px`: ""}`,
                     // cursor: `${state.isDragging0 ? `grab`: "normal"}`,
                 }}>
                <div className="live-ingame-table-body-column live-ingame-table-body-column__1">
                    {/*<img  onMouseDown={handleMouseDown(i, 0)}*/}
                    {/*      onMouseEnter={handleMouseEnter(i, 0)}*/}
                    {/*      src="../../assets/images/icon-draggable.svg"*/}
                    {/*      style={{cursor: "grab"}}*/}
                    {/*/>*/}
                    <div className="live-ingame-area live-ingame-area-tier live-ingame-area-tier-ml">
                        {teams.myTeam.summoner.league_stats.length > 0
                            ?  <>
                                    <div className="live-ingame-area-tier-wrapper">
                                        <img loading={"lazy"} src={`${teams.myTeam.summoner.league_stats[0].tier_info.tier_image_url}`}/>
                                    </div>
                                    <div>{tierDivision[teams.myTeam.summoner.league_stats[0].tier_info.division]}</div>
                                </>
                            : <>
                                <div className="live-ingame-area-tier-wrapper" style={{backgroundColor: "transparent"}}>
                                    <img
                                        src={`../../assets/images/default.png`}/>
                                </div>
                                <div></div>
                            </>
                        }
                    </div>
                    <div className="live-ingame-area live-ingame-area-profile">
                        <div className="live-ingame-area-profile-top">
                            <div className="champion-image-wrapper" style={teams.myTeam.summoner.isMe ? {borderColor: "#ff8e05", borderRadius: "20px"} : {}}>
                                <img loading={"lazy"}  src={`${_.find(championsMetaData.data, {
                                    id: teams.myTeam.champion_id
                                })?.image_url}?image=c_scale,q_auto,w_42`} />
                                {/*<img src="https://opgg-static.akamaized.net/images/site/champion/icon-champtier-1.png" />*/}
                            </div>
                            <div className="spell-image-wrapper">
                                <img loading={"lazy"} src={`${_.find(spellMetaData.data, {
                                    id: teams.myTeam.spells[0]
                                })?.image_url}?image=c_scale,q_auto,w_16`} />
                                <img loading={"lazy"} src={`${_.find(spellMetaData.data, {
                                    id: teams.myTeam.spells[1]
                                })?.image_url}?image=c_scale,q_auto,w_16`} />
                            </div>
                            <div className="profile-wrapper">
                                <div style={{cursor: "pointer"}} onClick={() => window.api.send("openSummonerPage", teams.myTeam.summoner.name)}>{teams.myTeam.summoner.name}</div>
                                {!eog
                                    ? <>
                                        { teams.myTeam.summoner.league_stats.length > 0
                                            ? <div>{teams.myTeam.summoner.league_stats[0].win}W {teams.myTeam.summoner.league_stats[0].lose}L</div>
                                            : <div>0W 0L</div>
                                        }
                                    </>
                                    : <>
                                        {eogMyTeam &&
                                            <div>
                                                <span>{eogMyTeam.stats.CHAMPIONS_KILLED}</span> / <span>{eogMyTeam.stats.NUM_DEATHS}</span> / <span>{eogMyTeam.stats.ASSISTS}</span>
                                            </div>
                                        }
                                    </>
                                }
                            </div>
                        </div>
                        <div className="live-ingame-area-profile-bottom">
                            {!eog
                                ? <>
                                    {teams.myTeam.most_champion_stat
                                    ? <>
                                            <div className="game-played">
                                                <div>{teams.myTeam.most_champion_stat.play} Played <span style={teams.myTeam.most_champion_stat.win/teams.myTeam.most_champion_stat.play*100 >= 60 ? {"color": "#d31a45"} : {}}>{(teams.myTeam.most_champion_stat.win/teams.myTeam.most_champion_stat.play*100).toFixed(0)}%</span> ({teams.myTeam.most_champion_stat.win}W {teams.myTeam.most_champion_stat.lose}L)</div>
                                            </div>
                                            <div>KDA <span className={`${getKDAClass(((teams.myTeam.most_champion_stat.kill+teams.myTeam.most_champion_stat.assist)/teams.myTeam.most_champion_stat.death).toString())}`}>{((teams.myTeam.most_champion_stat.kill+teams.myTeam.most_champion_stat.assist)/teams.myTeam.most_champion_stat.death).toFixed(2)}:1</span></div>
                                        </>
                                    : <>
                                            <div className="game-played">
                                                <div>0 Played <span>0%</span> (0W 0L)</div>
                                            </div>
                                            <div>KDA <span className={"kda-0"}>0:1</span></div>
                                        </>
                                    }
                                </>
                                : <>
                                    {eogMyTeam && eogMyTeamAll &&
                                    <>
                                        <div className="game-played" style={{marginTop: "5px"}}>
                                            <div>{eogMyTeam.stats.VISION_WARDS_BOUGHT_IN_GAME} Control
                                                Ward <span>{((eogMyTeam.stats.CHAMPIONS_KILLED+eogMyTeam.stats.ASSISTS)/eogMyTeamAll.stats.CHAMPIONS_KILLED*100).toFixed(0)}%</span> P/Kill
                                            </div>
                                        </div>
                                        <div className="eog-stats">
                                            {opscoreMyTeam &&
                                                <div className={`eog-stats-item opscore ${opscoreMyTeam.isWinning ? (opscoreMyTeam.isMax ? "mvp": "") : (opscoreMyTeam.isMax ? "ace" : "")}`}>{opscoreMyTeam.rankString}</div>
                                            }
                                            {eogMyTeam.stats.LARGEST_MULTI_KILL >= 2 &&
                                                <div className={"eog-stats-item multikill"}>{t(`multikill.${eogMyTeam.stats.LARGEST_MULTI_KILL}`)}</div>
                                            }
                                        </div>
                                    </>
                                    }
                                </>
                            }
                        </div>
                    </div>
                    <div className="live-ingame-table-body-column__1-seperator"></div>
                </div>
                <div className="live-ingame-table-body-column live-ingame-table-body-column__2">
                    {!eog
                        ? <>
                            <div className="live-ingame-perks-row">
                                <div className="perks-image-wrapper perks-image-wrapper-primary">
                                    <img loading={"lazy"} src={_.find(runePageMetaData.data, {id: teams.myTeam.rune_build?.primary_page_id})?.image_url+"?image=c_scale,q_auto,w_20"} />
                                </div>
                                {teams.myTeam.rune_build?.primary_rune_ids.map((perk) => (
                                    <Tippy content={<div dangerouslySetInnerHTML={{__html: t(`perks.${perk}.tooltip`)}} />}>
                                        <div className="perks-image-wrapper">
                                            <img loading={"lazy"} src={_.find(runeMetaData.data, {id: perk})?.image_url+"?image=c_scale,q_auto,w_16"} />
                                        </div>
                                    </Tippy>
                                ))}
                            </div>
                            <div className="live-ingame-perks-row">
                                <div className="perks-image-wrapper perks-image-wrapper-primary">
                                    <img loading={"lazy"} src={_.find(runePageMetaData.data, {id: teams.myTeam.rune_build?.secondary_page_id})?.image_url+"?image=c_scale,q_auto,w_20"} />
                                </div>
                                {teams.myTeam.rune_build?.secondary_rune_ids.map((perk) => {
                                    return (
                                        <Tippy content={<div dangerouslySetInnerHTML={{__html: t(`perks.${perk}.tooltip`)}} />}>
                                            <div className="perks-image-wrapper">
                                                <img loading={"lazy"} src={_.find(runeMetaData.data, {id: perk})?.image_url+"?image=c_scale,q_auto,w_16"} />
                                            </div>
                                        </Tippy>
                                    )
                                })}
                            </div>
                            <div className="live-ingame-perks-row">
                                {teams.myTeam.rune_build?.stat_mod_ids.map((perk) => (
                                    <div className="perks-image-wrapper" style={{backgroundColor: "#222"}}>
                                        <div className="shards-image-wrapper">
                                            <img loading={"lazy"} src={`https://opgg-static.akamaized.net/images/lol/perkShard/${perk}.png?image=q_auto:best,w_18`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                        : <>
                            {eogMyTeam && eogMyTeamDamage && eogMyTeamTaken
                                ? <div className={"eog-damage"}>
                                    <div className={"eog-label"}>{formatter.format(eogMyTeam.stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS)}</div>
                                    <div className={"eog-graph"}>
                                        <div className={"eog-graph-inner eog-graph-inner-damage"} style={{
                                            width: `${eogMyTeam.stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS/eogMyTeamDamage*100}%`
                                        }}></div>
                                    </div>
                                    <div className={"eog-label"}>{formatter.format(eogMyTeam.stats.TOTAL_DAMAGE_TAKEN)}</div>
                                    <div className={"eog-graph"}>
                                        <div className={"eog-graph-inner"} style={{
                                            width: `${eogMyTeam.stats.TOTAL_DAMAGE_TAKEN/eogMyTeamTaken*100}%`
                                        }}></div>
                                    </div>
                                </div>
                                : <div className={"eog-damage"}>
                                    <div className={"eog-label"}>0</div>
                                    <div className={"eog-graph"}>
                                        <div className={"eog-graph-inner eog-graph-inner-damage"}></div>
                                    </div>
                                    <div className={"eog-label"}>0</div>
                                    <div className={"eog-graph"}>
                                        <div className={"eog-graph-inner"}></div>
                                    </div>
                                </div>
                            }
                        </>
                    }
                </div>
                <div className="live-ingame-table-body-column live-ingame-table-body-column__3">
                    {myPrevSeason &&
                    <div className="live-ingame-area live-ingame-area-tier">
                        <div className="live-ingame-area-tier-wrapper live-ingame-area-tier-wrapper-nobg">
                            <img loading={"lazy"} src={`${myPrevSeason.tier_info.tier_image_url}`} />
                        </div>
                        <div>{tierDivision[myPrevSeason.tier_info.division]}</div>
                    </div>
                    }
                </div>
            </div>

            <div className="live-ingame-table-body-column live-ingame-table-body-column__position">
                {teams.myTeam.summoner.isCarrying &&
                    <>
                        {teams.myTeamId === 100
                            ? <Tippy content={<div dangerouslySetInnerHTML={{__html: t("live.feature.ingame.carry-potential-desc")}} />}>
                                <img className={"me-carrying"} src={`../../assets/images/icon-mvp2.svg`}/>
                            </Tippy>
                            : <Tippy content={<div dangerouslySetInnerHTML={{__html: t("live.feature.ingame.potential-threat-desc")}} />}>
                                <img className={"enemy-carrying-right"} src={`../../assets/images/icon-mvp.svg`}/>
                            </Tippy>
                        }
                    </>
                }
                {/*<img src={`../../assets/images/icon-position-${line[i].toUpperCase()}-wh.svg`} />*/}
                {teams.enemyTeam.summoner.isCarrying &&
                <>
                    {teams.myTeamId === 200
                        ? <Tippy content={<div dangerouslySetInnerHTML={{__html: t("live.feature.ingame.carry-potential-desc")}} />}>
                            <img className={"me-carrying-right"} src={`../../assets/images/icon-mvp2.svg`}/>
                        </Tippy>
                        : <Tippy content={<div dangerouslySetInnerHTML={{__html: t("live.feature.ingame.potential-threat-desc")}} />}>
                            <img className={"enemy-carrying"} src={`../../assets/images/icon-mvp.svg`}/>
                        </Tippy>
                    }
                </>
                }
            </div>

            {state.isDragging1 &&
            <div style={{
                width: "474px",
                height: "85px"
            }}></div>
            }
            <div className={`live-ingame-table-body-row-user ${state.isDragging1 ? "live-ingame-table-body-row-user-dragging" : ""}`}
                 onMouseEnter={handleMouseEnter(i, 1)}
                 style={{
                     position: `${state.isDragging1 ? "absolute" : ""}`,
                     // left: `${state.isDragging1 ? `${state.translateX-454-474/2}px`: ""}`,
                     right: "4px",
                     top: `${state.isDragging1 ? `${state.translateY-160}px`: ""}`,
                     // cursor: `${state.isDragging1 ? `grab`: "normal"}`,
                 }}>
                <div className="live-ingame-table-body-column live-ingame-table-body-column__3">
                    {enemyPrevSeason &&
                    <div className="live-ingame-area live-ingame-area-tier">
                        <div className="live-ingame-area-tier-wrapper live-ingame-area-tier-wrapper-nobg">
                            <img loading={"lazy"} src={`${enemyPrevSeason.tier_info.tier_image_url}`} />
                        </div>
                        <div>{tierDivision[enemyPrevSeason.tier_info.division]}</div>
                    </div>
                    }
                </div>
                <div className="live-ingame-table-body-column live-ingame-table-body-column__2">
                    {!eog
                        ? <>
                            <div className="live-ingame-perks-row live-ingame-perks-row-right">
                                <div className="perks-image-wrapper perks-image-wrapper-primary">
                                    <img loading={"lazy"} src={_.find(runePageMetaData.data, {id: teams.enemyTeam.rune_build?.primary_page_id})?.image_url+"?image=c_scale,q_auto,w_20"} />
                                </div>
                                {teams.enemyTeam.rune_build?.primary_rune_ids.map((perk) => (
                                    <Tippy content={<div dangerouslySetInnerHTML={{__html: t(`perks.${perk}.tooltip`)}} />}>
                                        <div className="perks-image-wrapper">
                                            <img loading={"lazy"} src={_.find(runeMetaData.data, {id: perk})?.image_url+"?image=c_scale,q_auto,w_16"} />
                                        </div>
                                    </Tippy>
                                ))}
                            </div>
                            <div className="live-ingame-perks-row live-ingame-perks-row-right">
                                <div className="perks-image-wrapper perks-image-wrapper-primary">
                                    <img loading={"lazy"} src={_.find(runePageMetaData.data, {id: teams.enemyTeam.rune_build?.secondary_page_id})?.image_url+"?image=c_scale,q_auto,w_20"} />
                                </div>
                                {teams.enemyTeam.rune_build?.secondary_rune_ids.map((perk) => {
                                    return (
                                        <Tippy content={<div dangerouslySetInnerHTML={{__html: t(`perks.${perk}.tooltip`)}} />}>
                                            <div className="perks-image-wrapper">
                                                <img loading={"lazy"} src={_.find(runeMetaData.data, {id: perk})?.image_url+"?image=c_scale,q_auto,w_16"} />
                                            </div>
                                        </Tippy>
                                    )
                                })}
                            </div>
                            <div className="live-ingame-perks-row live-ingame-perks-row-right">
                                {teams.enemyTeam.rune_build?.stat_mod_ids.map((perk) => (
                                    <div className="perks-image-wrapper" style={{backgroundColor: "#222"}}>
                                        <div className="shards-image-wrapper">
                                            <img loading={"lazy"} src={`https://opgg-static.akamaized.net/images/lol/perkShard/${perk}.png?image=q_auto:best,w_18`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                        : <>
                            {eogEnemyTeam && eogEnemyTeamDamage && eogEnemyTeamTaken
                                ? <div className={"eog-damage"}>
                                    <div className={"eog-label eog-label-right"}>{formatter.format(eogEnemyTeam.stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS)}</div>
                                    <div className={"eog-graph eog-graph-right"}>
                                        <div className={"eog-graph-inner eog-graph-inner-damage"} style={{
                                            width: `${eogEnemyTeam.stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS/eogEnemyTeamDamage*100}%`
                                        }}></div>
                                    </div>
                                    <div className={"eog-label eog-label-right"}>{formatter.format(eogEnemyTeam.stats.TOTAL_DAMAGE_TAKEN)}</div>
                                    <div className={"eog-graph eog-graph-right"}>
                                        <div className={"eog-graph-inner"} style={{
                                            width: `${eogEnemyTeam.stats.TOTAL_DAMAGE_TAKEN/eogEnemyTeamTaken*100}%`
                                        }}></div>
                                    </div>
                                </div>
                                : <div className={"eog-damage"}>
                                    <div className={"eog-label eog-label-right"}>0</div>
                                    <div className={"eog-graph eog-graph-right"}>
                                        <div className={"eog-graph-inner eog-graph-inner-damage"}></div>
                                    </div>
                                    <div className={"eog-label eog-label-right"}>0</div>
                                    <div className={"eog-graph eog-graph-right"}>
                                        <div className={"eog-graph-inner"}></div>
                                    </div>
                                </div>
                            }
                        </>
                    }
                </div>
                <div className="live-ingame-table-body-column live-ingame-table-body-column__1">
                    <div className="live-ingame-table-body-column__1-seperator live-ingame-table-body-column__1-seperator-right"></div>
                    <div className="live-ingame-area live-ingame-area-profile live-ingame-area-profile-right">
                        <div className="live-ingame-area-profile-top">
                            <div className="profile-wrapper profile-wrapper-right">
                                <div style={{cursor: "pointer"}} onClick={() => window.api.send("openSummonerPage", teams.enemyTeam.summoner.name)}>{teams.enemyTeam.summoner.name}</div>
                                {!eog
                                    ? <>
                                        { teams.enemyTeam.summoner.league_stats.length > 0
                                            ? <div>{teams.enemyTeam.summoner.league_stats[0].win}W {teams.enemyTeam.summoner.league_stats[0].lose}L</div>
                                            : <div>0W 0L</div>
                                        }
                                    </>
                                    : <>
                                        {eogEnemyTeam &&
                                        <div>
                                            <span>{eogEnemyTeam.stats.CHAMPIONS_KILLED}</span> / <span>{eogEnemyTeam.stats.NUM_DEATHS}</span> / <span>{eogEnemyTeam.stats.ASSISTS}</span>
                                        </div>
                                        }
                                    </>
                                }
                            </div>
                            <div className="spell-image-wrapper spell-image-wrapper-right">
                                <img loading={"lazy"} src={`${_.find(spellMetaData.data, {
                                    id: teams.enemyTeam.spells[0]
                                })?.image_url}?image=c_scale,q_auto,w_16`} />
                                <img loading={"lazy"} src={`${_.find(spellMetaData.data, {
                                    id: teams.enemyTeam.spells[1]
                                })?.image_url}?image=c_scale,q_auto,w_16`} />
                            </div>
                            <div className="champion-image-wrapper" style={teams.enemyTeam.summoner.isMe ? {borderColor: "#ff8e05", borderRadius: "20px"} : {}}>
                                <img loading={"lazy"}  src={`${_.find(championsMetaData.data, {
                                    id: teams.enemyTeam.champion_id
                                })?.image_url}?image=c_scale,q_auto,w_42`} />
                                {/*<img src="https://opgg-static.akamaized.net/images/site/champion/icon-champtier-1.png" />*/}
                            </div>
                        </div>
                        <div className="live-ingame-area-profile-bottom live-ingame-area-profile-bottom-right">
                            {!eog
                                ? <>
                                    {teams.enemyTeam.most_champion_stat
                                        ? <>
                                            <div className="game-played">
                                                <div>{teams.enemyTeam.most_champion_stat.play} Played <span style={teams.enemyTeam.most_champion_stat.win/teams.enemyTeam.most_champion_stat.play*100 >= 60 ? {"color": "#d31a45"} : {}}>{(teams.enemyTeam.most_champion_stat.win/teams.enemyTeam.most_champion_stat.play*100).toFixed(0)}%</span> ({teams.enemyTeam.most_champion_stat.win}W {teams.enemyTeam.most_champion_stat.lose}L)</div>
                                            </div>
                                            <div>KDA <span className={`${getKDAClass(((teams.enemyTeam.most_champion_stat.kill+teams.enemyTeam.most_champion_stat.assist)/teams.enemyTeam.most_champion_stat.death).toString())}`}>{((teams.enemyTeam.most_champion_stat.kill+teams.enemyTeam.most_champion_stat.assist)/teams.enemyTeam.most_champion_stat.death).toFixed(2)}:1</span></div>
                                        </>
                                        : <>
                                            <div className="game-played">
                                                <div>0 Played <span>0%</span> (0W 0L)</div>
                                            </div>
                                            <div>KDA <span className={"kda-0"}>0:1</span></div>
                                        </>
                                    }
                                </>
                                : <>
                                    {eogEnemyTeam && eogEnemyTeamAll &&
                                    <>
                                        <div className="game-played" style={{marginTop: "5px"}}>
                                            <div>{eogEnemyTeam.stats.VISION_WARDS_BOUGHT_IN_GAME} Control
                                                Ward <span>{((eogEnemyTeam.stats.CHAMPIONS_KILLED+eogEnemyTeam.stats.ASSISTS)/eogEnemyTeamAll.stats.CHAMPIONS_KILLED*100).toFixed(0)}%</span> P/Kill
                                            </div>
                                        </div>
                                        <div className="eog-stats eog-stats-right">
                                            {opscoreEnemyTeam &&
                                            <div className={`eog-stats-item opscore ${opscoreEnemyTeam.isWinning ? (opscoreEnemyTeam.isMax ? "mvp": "") : (opscoreEnemyTeam.isMax ? "ace" : "")}`}>{opscoreEnemyTeam.rankString}</div>
                                            }
                                            {eogEnemyTeam.stats.LARGEST_MULTI_KILL >= 2 &&
                                            <div className={"eog-stats-item multikill"}>{t(`multikill.${eogEnemyTeam.stats.LARGEST_MULTI_KILL}`)}</div>
                                            }
                                        </div>
                                    </>
                                    }
                                </>
                            }
                        </div>
                    </div>
                    <div className="live-ingame-area live-ingame-area-tier live-ingame-area-tier-mr">
                        {teams.enemyTeam.summoner.league_stats.length > 0
                            ?  <>
                                <div className="live-ingame-area-tier-wrapper">
                                    <img loading={"lazy"} src={`${teams.enemyTeam.summoner.league_stats[0].tier_info.tier_image_url}`}/>
                                </div>
                                <div>{tierDivision[teams.enemyTeam.summoner.league_stats[0].tier_info.division]}</div>
                            </>
                            : <>
                                <div className="live-ingame-area-tier-wrapper" style={{backgroundColor: "transparent"}}>
                                    <img
                                        src={`../../assets/images/default.png`}/>
                                </div>
                                <div></div>
                            </>
                        }
                    </div>
                    {/*<img*/}
                    {/*    style={{cursor: "grab"}}*/}
                    {/*    onMouseDown={handleMouseDown(i, 1)}*/}
                    {/*    onMouseEnter={handleMouseEnter(i, 1)}*/}
                    {/*    src="../../assets/images/icon-draggable.svg"*/}
                    {/*/>*/}
                </div>
            </div>
        </div>
    )
}

export default IngameNew;