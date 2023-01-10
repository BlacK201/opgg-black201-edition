import React, {useEffect, useState, useCallback} from "react";
import {useTypedSelector} from "../../../redux/store";
import {useTranslation} from "react-i18next";
import _ from "lodash";
import {useDispatch} from "react-redux";
import {setIngame} from "../../../redux/slices/common";
import Error from "../../components/common/Error";
// import mixpanel from "../../../utils/mixpanel";
import sendGA4Event from "../../../utils/ga4";

const MiniIngame = () => {
    const {t} = useTranslation();
    const {ingame, eog} = useTypedSelector(state => state.common);

    useEffect(() => {
        sendGA4Event("view_ingame_page", {
            "menu_name": "mini"
        });
    }, []);

    if (ingame && ingame.success) {
        let myTeam = _.find(ingame.teams, {
            teamId: 100
        });

        let enemyTeam = _.find(ingame.teams, {
            teamId: 200
        });
        if (myTeam && enemyTeam && myTeam.participants.length === 5 && enemyTeam.participants.length === 5) {
            return (
                <div className={"mini-ingame"}>
                    <div className={`mini-ingame-table ${!eog && "mini-ingame-table-active"}`}>
                        <div
                            className={`mini-ingame-team-area mini-ingame-team-area-blue ${eog && "mini-ingame-team-area-active"}`}></div>
                        <div
                            className={`mini-ingame-team-area mini-ingame-team-area-red ${eog && "mini-ingame-team-area-active"}`}></div>
                        <div className={"mini-ingame-table-header"}>
                            <div className={"mini-ingame-table-header-row justify-content-between"}
                                 style={{padding: "0 12px"}}>
                                <div>{t("live.feature.ingame.blue")}</div>
                                <div>{t("live.feature.ingame.red")}</div>
                            </div>
                            <div className={"mini-ingame-table-header-row mini-ingame-table-header-row__2"}>
                                {!eog
                                    ? <>
                                        <div className={"mini-ingame-table-header-column"}
                                             style={{justifyContent: "flex-end"}}></div>
                                        <div
                                            className={"mini-ingame-table-header-column mini-ingame-table-header-column__2"}>S2021
                                        </div>
                                        <div
                                            className={"mini-ingame-table-header-column mini-ingame-table-header-column__3"}>Position
                                        </div>
                                        <div
                                            className={"mini-ingame-table-header-column mini-ingame-table-header-column__2"}>S2021
                                        </div>
                                        <div className={"mini-ingame-table-header-column"}></div>
                                    </>
                                    : <>
                                        <div
                                            className={"mini-ingame-table-header-column mini-ingame-table-header-column__eog"}>
                                        </div>
                                        <div
                                            className={"mini-ingame-table-header-column mini-ingame-table-header-column__damage"}>Damage
                                        </div>
                                        <div
                                            className={"mini-ingame-table-header-column mini-ingame-table-header-column__rank"}>S2021
                                        </div>
                                        <div
                                            className={"mini-ingame-table-header-column mini-ingame-table-header-column__position"}>
                                        </div>
                                        <div
                                            className={"mini-ingame-table-header-column mini-ingame-table-header-column__rank"}>S2021
                                        </div>
                                        <div
                                            className={"mini-ingame-table-header-column mini-ingame-table-header-column__damage"}>Damage
                                        </div>
                                        <div
                                            className={"mini-ingame-table-header-column mini-ingame-table-header-column__eog"}></div>
                                    </>
                                }
                            </div>
                        </div>
                        <div className={"mini-ingame-table-body"}>
                            <LiveInGameTableBody teams={{
                                ingame: ingame,
                                myTeam: myTeam,
                                enemyTeam: enemyTeam
                            }}/>
                        </div>
                    </div>
                </div>
            )
        }
        else {
            return (
                <Error error={500} msgType={"ingame"} isMini={true}/>
            )
        }
    }

    return (
        <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: "column", fontSize: "16px", color: "#ddd"}}>
            <img src={"../../assets/images/lol-loading.png"} style={{borderRadius: "12px", marginBottom: "48px", width: "426px", height: "240px"}} />
            <div style={{padding: "0 24px", textAlign: "center", wordBreak: "keep-all"}}>{t("usage.ingame")}  <span style={{color: "#ff8e05", fontWeight: "bold"}}>{t("live.tab.ingame")}</span> {t("usage.move")}</div>
            <div style={{marginTop: "8px", fontSize: "14px", color: "#7b7a8e"}}>{t("usage.ps-ingame")}</div>
        </div>
    )
};

const LiveInGameTableBody = ({teams}: any) => {
    const [swapState, setSwapState] = useState({
        src: -1,
        dest: -1,
        srcTeam: -1,
        swapped: true
    });

    return <>{
        [...Array(5)].map((n, i) => {
            return (
                <LiveInGameTableBodyRow teams={{
                    ingame: teams.ingame,
                    myTeam: teams.myTeam.participants[i],
                    enemyTeam: teams.enemyTeam.participants[i]
                }} i={i} swapState={swapState} setSwapState={setSwapState}/>
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

    useEffect(() => {
        if (eog) {
            try {
                let players = eog.teams[0].players.concat(eog.teams[1].players);

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
    }, [eog]);

    useEffect(() => {
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
    }, [opscore]);

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
        ({clientX, clientY}) => {
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

    const handleMouseEnter = useCallback((dest, teamIndex) => () => {
        if (!swapState.swapped) {
            if (swapState.srcTeam === teamIndex) {
                let clonedIngame = _.cloneDeep(teams.ingame);
                [clonedIngame.teams[teamIndex].participants[dest], clonedIngame.teams[teamIndex].participants[swapState.src]] = [clonedIngame.teams[teamIndex].participants[swapState.src], clonedIngame.teams[teamIndex].participants[dest]]
                dispatch(setIngame(clonedIngame));
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

    if (!eog && !opscore) {
        return (
            <div className={"mini-ingame-table-body-row"}>
                {state.isDragging0 &&
                <div style={{
                    width: "206px",
                    height: "104px"
                }}></div>
                }
                <div className={`flex ${state.isDragging0 ? "mini-ingame-user" : ""}`}
                     onMouseEnter={handleMouseEnter(i, 0)}
                     style={{
                         position: `${state.isDragging0 ? "absolute" : ""}`,
                         // left: `${state.isDragging0 ? `${state.translateX - 30}px` : ""}`,
                         top: `${state.isDragging0 ? `${state.translateY - 130}px` : ""}`,
                         // cursor: `${state.isDragging0 ? `grab` : "normal"}`,
                     }}>
                    <div className={"mini-ingame-table-body-column"}>
                        <img
                            style={{cursor: "grab"}}
                            onMouseDown={handleMouseDown(i, 0)}
                            onMouseEnter={handleMouseEnter(i, 0)}
                            src="../../assets/images/icon-draggable.svg"
                        />
                        <div className="live-ingame-area live-ingame-area-profile" style={{marginLeft: "12px"}}>
                            <div>
                                {teams.myTeam.rankedChampionStats
                                    ? <div style={{color: "#9e9eb1"}}>
                                        <div>{teams.myTeam.rankedChampionStats.win}W {teams.myTeam.rankedChampionStats.loss}L</div>
                                    </div>
                                    : <div style={{color: "#9e9eb1"}}>
                                        <div>0W 0L</div>
                                    </div>
                                }
                            </div>
                            <div className="mini-ingame-profile-top">
                                <div className={`champion-image-wrapper`} style={{
                                    marginRight: "8px",
                                    position: "relative",
                                    borderColor: `${teams.myTeam.summoner.isMe ? "#ff8e05" : ""}`
                                }}>
                                    <img src={`https:${teams.myTeam.champion.imageUrl}`}/>
                                    {/*<img src="https://opgg-static.akamaized.net/images/site/champion/icon-champtier-1.png" />*/}
                                </div>
                                {teams.myTeam.summoner.tier &&
                                <div
                                    className={"mini-ingame-tier-div"}>{teams.myTeam.summoner.tier.tierRank.shortString}</div>
                                }
                                <div className="spell-image-wrapper">
                                    <img src={`https:${teams.myTeam.spells[0].imageUrl}`}/>
                                    <img src={`https:${teams.myTeam.spells[1].imageUrl}`}/>
                                </div>
                                <div className="spell-image-wrapper" style={{marginLeft: "4px"}}>
                                    <div className={"flex"}>
                                        {teams.myTeam.perks.primaryPerks.map((perk: any, index: number) => {
                                            if (index === 0) {
                                                return (
                                                    <div className="perks-image-wrapper">
                                                        <img src={`https:${_.find(perk, {isActive: true})?.iconUrl}`}/>
                                                    </div>
                                                )
                                            }
                                        })}
                                    </div>
                                    <div className="flex">
                                        <img src={`https:${teams.myTeam.perks.primaryPerkStyle.imageUrl}`}/>
                                    </div>
                                </div>
                            </div>
                            <div className="mini-ingame-profile-bottom">
                                {teams.myTeam.rankedChampionStats
                                    ? <>
                                        <div className="game-played">
                                            <div>{teams.myTeam.rankedChampionStats.played} Played</div>
                                        </div>
                                        <div>KDA <span
                                            className={`${getKDAClass(teams.myTeam.rankedChampionStats.general.kdaString)}`}>{teams.myTeam.rankedChampionStats.general.kdaString}</span>
                                        </div>
                                    </>
                                    : <>
                                        <div className="game-played">
                                            <div>0 Played</div>
                                        </div>
                                        <div>KDA <span className={"kda-0"}>0:1</span></div>
                                    </>
                                }
                            </div>
                        </div>
                    </div>
                    <div className={"mini-ingame-table-body-column mini-ingame-table-body-column__2"}>
                        <div className={"flex align-items-center flex-direction-column"}>
                            {teams.myTeam.summoner.tier
                                ? <>
                                    <div className="mini-ingame-tier-wrapper">
                                        <img src={`https:${teams.myTeam.summoner.tier.tierRank.imageUrl}`}/>
                                    </div>
                                    <div style={{
                                        color: "#98a0a7",
                                        fontSize: "11px"
                                    }}>{teams.myTeam.summoner.tier.tierRank.division.toUpperCase()}</div>
                                </>
                                : <>
                                    <div className="mini-ingame-tier-wrapper">
                                        <img
                                            src={`../../assets/images/default.png`}/>
                                    </div>
                                    <div></div>
                                </>
                            }
                        </div>
                    </div>
                </div>
                <div className={"mini-ingame-table-body-column mini-ingame-table-body-column__3"}>
                    <img src={`../../assets/images/icon-position-${line[i].toUpperCase()}-wh.svg`}/>
                </div>
                {state.isDragging1 &&
                <div style={{
                    width: "206px",
                    height: "104px"
                }}></div>
                }
                <div className={`flex ${state.isDragging1 ? "mini-ingame-user" : ""}`}
                     onMouseEnter={handleMouseEnter(i, 1)}
                     style={{
                         position: `${state.isDragging1 ? "absolute" : ""}`,
                         // left: `${state.isDragging1 ? `${state.translateX - 200}px` : ""}`,
                         right: "4px",
                         top: `${state.isDragging1 ? `${state.translateY - 130}px` : ""}`,
                         // cursor: `${state.isDragging1 ? `grab` : "normal"}`,
                     }}>
                    <div className={"mini-ingame-table-body-column mini-ingame-table-body-column__2"}
                         style={{alignItems: "flex-end"}}>
                        <div className={"flex align-items-center flex-direction-column"}>
                            {teams.enemyTeam.summoner.tier
                                ? <>
                                    <div className="mini-ingame-tier-wrapper">
                                        <img src={`https:${teams.enemyTeam.summoner.tier.tierRank.imageUrl}`}/>
                                    </div>
                                    <div style={{
                                        color: "#98a0a7",
                                        fontSize: "11px"
                                    }}>{teams.enemyTeam.summoner.tier.tierRank.division.toUpperCase()}</div>
                                </>
                                : <>
                                    <div className="mini-ingame-tier-wrapper">
                                        <img
                                            src={`../../assets/images/default.png`}/>
                                    </div>
                                    <div></div>
                                </>
                            }
                        </div>
                    </div>
                    <div className={"mini-ingame-table-body-column"}>
                        <div className="live-ingame-area live-ingame-area-profile" style={{marginLeft: "auto"}}>
                            <div style={{
                                display: "flex",
                                width: "100%",
                                justifyContent: "flex-end"
                            }}>
                                {teams.enemyTeam.rankedChampionStats
                                    ? <div style={{color: "#9e9eb1"}}>
                                        <div>{teams.enemyTeam.rankedChampionStats.win}W {teams.enemyTeam.rankedChampionStats.loss}L</div>
                                    </div>
                                    : <div style={{color: "#9e9eb1"}}>
                                        <div>0W 0L</div>
                                    </div>
                                }
                            </div>
                            <div className="mini-ingame-profile-top" style={{flexDirection: "row-reverse"}}>
                                <div className={`champion-image-wrapper`} style={{
                                    marginLeft: "8px",
                                    borderColor: `${teams.enemyTeam.summoner.isMe ? "#ff8e05" : ""}`
                                }}>
                                    <img src={`https:${teams.enemyTeam.champion.imageUrl}`}/>
                                    {/*<img src="https://opgg-static.akamaized.net/images/site/champion/icon-champtier-1.png" />*/}
                                </div>
                                {teams.enemyTeam.summoner.tier &&
                                <div
                                    className={"mini-ingame-tier-div mini-ingame-tier-div-right"}>{teams.enemyTeam.summoner.tier.tierRank.shortString}</div>
                                }
                                <div className="spell-image-wrapper">
                                    <img src={`https:${teams.enemyTeam.spells[0].imageUrl}`}/>
                                    <img src={`https:${teams.enemyTeam.spells[1].imageUrl}`}/>
                                </div>
                                <div className="spell-image-wrapper" style={{marginRight: "4px"}}>
                                    <div className={"flex"}>
                                        {teams.enemyTeam.perks.primaryPerks.map((perk: any, index: number) => {
                                            if (index === 0) {
                                                return (
                                                    <div className="perks-image-wrapper">
                                                        <img src={`https:${_.find(perk, {isActive: true})?.iconUrl}`}/>
                                                    </div>
                                                )
                                            }
                                        })}
                                    </div>
                                    <div className="flex">
                                        <img src={`https:${teams.enemyTeam.perks.primaryPerkStyle.imageUrl}`}/>
                                    </div>
                                </div>
                            </div>
                            <div className="mini-ingame-profile-bottom" style={{
                                marginLeft: "auto",
                                textAlign: "right"
                            }}>
                                {teams.enemyTeam.rankedChampionStats
                                    ? <>
                                        <div className="game-played">
                                            <div>{teams.enemyTeam.rankedChampionStats.played} Played</div>
                                        </div>
                                        <div>KDA <span
                                            className={`${getKDAClass(teams.enemyTeam.rankedChampionStats.general.kdaString)}`}>{teams.enemyTeam.rankedChampionStats.general.kdaString}</span>
                                        </div>
                                    </>
                                    : <>
                                        <div className="game-played">
                                            <div>0 Played</div>
                                        </div>
                                        <div>KDA <span>0:1</span></div>
                                    </>
                                }
                            </div>
                        </div>
                        <img
                            style={{cursor: "grab", marginLeft: "auto"}}
                            onMouseDown={handleMouseDown(i, 1)}
                            onMouseEnter={handleMouseEnter(i, 1)}
                            src="../../assets/images/icon-draggable.svg"
                        />
                    </div>
                </div>
            </div>
        )
    } else {
        return (
            <div className={"mini-ingame-table-body-row"}>
                <div className={"mini-ingame-table-body-column mini-ingame-table-body-column__eog"}>
                    <div className="live-ingame-area live-ingame-area-profile" style={{marginLeft: "0"}}>
                        <div>
                            {teams.myTeam.rankedChampionStats
                                ? <div style={{color: "#9e9eb1"}}>
                                    <div>{teams.myTeam.rankedChampionStats.win}W {teams.myTeam.rankedChampionStats.loss}L</div>
                                </div>
                                : <div style={{color: "#9e9eb1"}}>
                                    <div>0W 0L</div>
                                </div>
                            }
                        </div>
                        <div className="mini-ingame-profile-top">
                            <div className={`champion-image-wrapper`} style={{
                                marginRight: "8px",
                                position: "relative",
                                borderColor: `${teams.myTeam.summoner.isMe ? "#ff8e05" : ""}`
                            }}>
                                <img src={`https:${teams.myTeam.champion.imageUrl}`}/>
                                {/*<img src="https://opgg-static.akamaized.net/images/site/champion/icon-champtier-1.png" />*/}
                            </div>
                            {teams.myTeam.summoner.tier &&
                            <div
                                className={"mini-ingame-tier-div"}>{teams.myTeam.summoner.tier.tierRank.shortString}</div>
                            }
                            <div className="spell-image-wrapper">
                                <img src={`https:${teams.myTeam.spells[0].imageUrl}`}/>
                                <img src={`https:${teams.myTeam.spells[1].imageUrl}`}/>
                            </div>
                        </div>
                        <div className="mini-ingame-profile-bottom">
                            {eogMyTeam && eogMyTeamAll &&
                            <div>
                                <div style={{color: "#fff"}}>
                                    <span>{eogMyTeam.stats.CHAMPIONS_KILLED}</span><span style={{
                                    color: "#98a0a7",
                                    margin: "0 2px"
                                }}>/</span><span>{eogMyTeam.stats.NUM_DEATHS}</span><span
                                    style={{color: "#98a0a7", margin: "0 2px"}}>/</span>
                                    <span>{eogMyTeam.stats.ASSISTS}</span>
                                </div>
                                <div>
                                    <span>{((eogMyTeam.stats.CHAMPIONS_KILLED + eogMyTeam.stats.ASSISTS) / eogMyTeamAll.stats.CHAMPIONS_KILLED * 100).toFixed(0)}%</span> P/Kill
                                </div>
                            </div>
                            }
                        </div>
                    </div>
                </div>
                <div className={"mini-ingame-table-body-column mini-ingame-table-body-column__damage"}>
                    {eogMyTeam && eogMyTeamDamage
                        ? <div className={"eog-damage"}>
                            <div className={"eog-label"}>{formatter.format(eogMyTeam.stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS)}</div>
                            <div className={"eog-graph"}>
                                <div className={"eog-graph-inner eog-graph-inner-damage"} style={{
                                    width: `${eogMyTeam.stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS/eogMyTeamDamage*100}%`
                                }}></div>
                            </div>
                        </div>
                        : <div className={"eog-damage"}>
                            <div className={"eog-label"}>0</div>
                            <div className={"eog-graph"}>
                                <div className={"eog-graph-inner eog-graph-inner-damage"}></div>
                            </div>
                        </div>
                    }
                    <div className="eog-stats">
                        {opscoreMyTeam &&
                        <div className={`eog-stats-item opscore ${opscoreMyTeam.isWinning ? (opscoreMyTeam.isMax ? "mvp": "") : (opscoreMyTeam.isMax ? "ace" : "")}`}>{opscoreMyTeam.rankString}</div>
                        }
                    </div>
                </div>
                <div className={"mini-ingame-table-body-column mini-ingame-table-body-column__rank"}>
                    <div className={"flex align-items-center flex-direction-column"}>
                        {teams.myTeam.summoner.tier
                            ? <>
                                <div className="mini-ingame-tier-wrapper">
                                    <img src={`https:${teams.myTeam.summoner.tier.tierRank.imageUrl}`}/>
                                </div>
                                <div style={{
                                    color: "#98a0a7",
                                    fontSize: "11px"
                                }}>{teams.myTeam.summoner.tier.tierRank.division.toUpperCase()}</div>
                            </>
                            : <>
                                <div className="mini-ingame-tier-wrapper">
                                    <img
                                        src={`../../assets/images/default.png`}/>
                                </div>
                                <div></div>
                            </>
                        }
                    </div>
                </div>
                <div className={"mini-ingame-table-body-column mini-ingame-table-body-column__position"}>
                    <img src={`../../assets/images/icon-position-${line[i].toUpperCase()}-wh.svg`}/>
                </div>
                <div className={"mini-ingame-table-body-column mini-ingame-table-body-column__rank"}>
                    <div className={"flex align-items-center flex-direction-column"}>
                        {teams.enemyTeam.summoner.tier
                            ? <>
                                <div className="mini-ingame-tier-wrapper">
                                    <img src={`https:${teams.enemyTeam.summoner.tier.tierRank.imageUrl}`}/>
                                </div>
                                <div style={{
                                    color: "#98a0a7",
                                    fontSize: "11px"
                                }}>{teams.enemyTeam.summoner.tier.tierRank.division.toUpperCase()}</div>
                            </>
                            : <>
                                <div className="mini-ingame-tier-wrapper">
                                    <img
                                        src={`../../assets/images/default.png`}/>
                                </div>
                                <div></div>
                            </>
                        }
                    </div>
                </div>
                <div className={"mini-ingame-table-body-column mini-ingame-table-body-column__damage mini-ingame-table-body-column__damage-right"}>
                    {eogEnemyTeam && eogEnemyTeamDamage
                        ? <div className={"eog-damage"}>
                            <div className={"eog-label eog-label-right"}>{formatter.format(eogEnemyTeam.stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS)}</div>
                            <div className={"eog-graph eog-graph-right"}>
                                <div className={"eog-graph-inner eog-graph-inner-damage"} style={{
                                    width: `${eogEnemyTeam.stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS/eogEnemyTeamDamage*100}%`
                                }}></div>
                            </div>
                        </div>
                        : <div className={"eog-damage"}>
                            <div className={"eog-label"}>0</div>
                            <div className={"eog-graph"}>
                                <div className={"eog-graph-inner eog-graph-inner-damage"}></div>
                            </div>
                        </div>
                    }
                    <div className="eog-stats">
                        {opscoreEnemyTeam &&
                        <div className={`eog-stats-item opscore ${opscoreEnemyTeam.isWinning ? (opscoreEnemyTeam.isMax ? "mvp": "") : (opscoreEnemyTeam.isMax ? "ace" : "")}`}>{opscoreEnemyTeam.rankString}</div>
                        }
                    </div>
                </div>
                <div className={"mini-ingame-table-body-column mini-ingame-table-body-column__eog"}>
                    <div className="live-ingame-area live-ingame-area-profile" style={{marginLeft: "auto"}}>
                        <div style={{
                            display: "flex",
                            width: "100%",
                            justifyContent: "flex-end"
                        }}>
                            {teams.enemyTeam.rankedChampionStats
                                ? <div style={{color: "#9e9eb1"}}>
                                    <div>{teams.enemyTeam.rankedChampionStats.win}W {teams.enemyTeam.rankedChampionStats.loss}L</div>
                                </div>
                                : <div style={{color: "#9e9eb1"}}>
                                    <div>0W 0L</div>
                                </div>
                            }
                        </div>
                        <div className="mini-ingame-profile-top" style={{flexDirection: "row-reverse"}}>
                            <div className={`champion-image-wrapper`} style={{
                                marginLeft: "8px",
                                borderColor: `${teams.enemyTeam.summoner.isMe ? "#ff8e05" : ""}`
                            }}>
                                <img src={`https:${teams.enemyTeam.champion.imageUrl}`}/>
                                {/*<img src="https://opgg-static.akamaized.net/images/site/champion/icon-champtier-1.png" />*/}
                            </div>
                            {teams.enemyTeam.summoner.tier &&
                            <div
                                className={"mini-ingame-tier-div mini-ingame-tier-div-right"}>{teams.enemyTeam.summoner.tier.tierRank.shortString}</div>
                            }
                            <div className="spell-image-wrapper">
                                <img src={`https:${teams.enemyTeam.spells[0].imageUrl}`}/>
                                <img src={`https:${teams.enemyTeam.spells[1].imageUrl}`}/>
                            </div>
                        </div>
                        <div className="mini-ingame-profile-bottom" style={{
                            marginLeft: "auto",
                            textAlign: "right"
                        }}>
                            {eogEnemyTeam && eogEnemyTeamAll &&
                            <div>
                                <div style={{color: "#fff"}}>
                                    <span>{eogEnemyTeam.stats.CHAMPIONS_KILLED}</span><span style={{
                                    color: "#98a0a7",
                                    margin: "0 2px"
                                }}>/</span><span>{eogEnemyTeam.stats.NUM_DEATHS}</span><span
                                    style={{color: "#98a0a7", margin: "0 2px"}}>/</span>
                                    <span>{eogEnemyTeam.stats.ASSISTS}</span>
                                </div>
                                <div>
                                    <span>{((eogEnemyTeam.stats.CHAMPIONS_KILLED + eogEnemyTeam.stats.ASSISTS) / eogEnemyTeamAll.stats.CHAMPIONS_KILLED * 100).toFixed(0)}%</span> P/Kill
                                </div>
                            </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default MiniIngame;
