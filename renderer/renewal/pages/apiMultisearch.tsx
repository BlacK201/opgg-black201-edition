import React, {useState, useEffect} from "react";
import {ErrorBoundary} from "../../components/common/ErrorBoundary";
import {useTranslation} from "react-i18next";
import {useHistory} from "react-router-dom";
import {useTypedSelector} from "../../redux/store";
import {PAGE_PATH_LIVE_MULTISEARCH} from "../../constants";
// import reactGa from "../../utils/ga";
import _ from "lodash";
// import mixpanel from "../../utils/mixpanel";
import sendGA4Event from "../../utils/ga4";
import NotSupported from "../../components/common/NotSupported";
import axios from "axios";

const championsMetaData = require("../../../assets/data/meta/champions.json");

// const {ipcRenderer} = globalThis.require("electron");

const apiMultisearch = () => {
    const {multisearch} = useTypedSelector((state) => state.common);
    const history = useHistory();
    const {t} = useTranslation();
    let availability = localStorage.getItem("availability") ?? true;
    const [summoners, setSummoners] = useState<any>([]);

    useEffect(() => {
        // mixpanel.track("view_multi_search_page", {
        //     "menu_name": "full"
        // });
        sendGA4Event("view_multi_search_page", {
            "menu_name": "full"
        });

        if (_.isEmpty(multisearch)) {
            // history.push("/");
        }
    }, []);

    // reactGa.pageview(PAGE_PATH_LIVE_MULTISEARCH);
    if (!availability || availability === "false") {
        return (
            <NotSupported />
        )
    }

    if (!_.isEmpty(multisearch)) {
        return (
            <div className="main-container multisearch">
                {/*<div className="multisearch-menu">*/}
                {/*  <div className="multisearch-menu-item">*/}
                {/*    <span>Refresh</span>*/}
                {/*    <img src="../../assets/images/icon_refresh2.svg" />*/}
                {/*  </div>*/}
                {/*  <div className="multisearch-menu-item multisearch-menu-count">*/}
                {/*    <span>Ranked Solo</span>*/}
                {/*    <span>30’ 00</span>*/}
                {/*    <img src="../../assets/images/icon_down.svg" />*/}
                {/*  </div>*/}
                {/*</div>*/}
                <div className="multisearch-main">
                    {multisearch.map((d: any) => {
                        if (!d.summoner.name) return null;
                        return (
                            <ErrorBoundary
                                key={d.summoner.name}
                                errorComponent={<MultiSearchItemError d={d}/>}
                            >
                                <MultiSearchItem d={d}/>
                            </ErrorBoundary>
                        );
                    })}
                </div>
            </div>
        );
    } else {
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
                    <source src={"../../assets/images/video-multisearch.mp4"}
                            type="video/mp4"/>
                </video>
                <div>{t("usage.multisearch")} <span
                    style={{color: "#ff8e05", fontWeight: "bold"}}>{t("live.tab.multisearch")}</span> {t("usage.move")}
                </div>
            </div>
        )
    }
};

export default apiMultisearch;

const MultiSearchItem = ({d}: any) => {
    const onClickSummonerName =
        (summonerName = "") =>
            () => {
                window.api.send("openSummonerPage", summonerName);
            };

    let currentRank = _.find(d.summoner.league_stats, {
        queue_info: {game_type: "SOLORANKED"}
    });

    let sortedByPosition = _.sortBy(_.groupBy(d.recent_game_stats, (o) => {
        return o.position;
    }), (o) => {
        return -o.length;
    });

    return (
        <div className="multisearch-main-item">
            <div className="ms-tiers">
                {d.summoner.previous_seasons.length === 0 && (
                    <div style={{fontSize: "11px"}} className={"ms-tiers-tier"}>Unranked</div>
                )}
                {d.summoner.previous_seasons.map((season, i) => {
                    if (i < 2) {
                        if (i === 0) {
                            return (
                                <div key={i} className="ms-tiers-tier ms-tiers-cur">
                                    {season.tier_info.tier} {season.tier_info.division}
                                </div>
                            );
                        } else {
                            return (
                                <div key={i} className="ms-tiers-tier">
                                    {season.tier_info.tier} {season.tier_info.division}
                                </div>
                            );
                        }
                    }
                })}
            </div>
            <div className="ms-info">
                <div className="ms-info-header">
                    <div className="ms-tier ms-circle">
                        {currentRank.tier_info.tier_image_url.includes("default.png")
                            ? <img src={`../../assets/images/default.png`} alt="tier"/>
                            : <img src={currentRank.tier_info.tier_image_url} alt="tier"/>
                        }
                    </div>
                    <div className="ms-profile">
                        <img
                            className="ms-picture"
                            src={d.summoner.profile_image_url}
                            alt="profile"
                        />
                        {d.summoner.level && <div className="ms-level">{d.summoner.level}</div>}
                    </div>
                    {sortedByPosition.length > 0
                        ? <div className="ms-position ms-circle">
                            <img
                                src={`../../assets/images/icon-position-${sortedByPosition[0][0].position}.png`}
                                alt="lane"
                            />
                        </div>
                        : <div className="ms-position ms-circle" style={{backgroundColor: "transparent"}}>
                        </div>
                    }
                </div>
                <div className="ms-info-profile">
                    <div
                        className="ms-summoner-name"
                        onClick={onClickSummonerName(d.summoner.name)}
                    >
                        {d.summoner.name}
                    </div>
                    {currentRank.tier_info.tier
                        ? <div
                        className="ms-tier-detail">{currentRank.tier_info.tier} {currentRank.tier_info.division} ({currentRank.tier_info.lp} LP)</div>
                        : <div className="ms-tier-detail">Unranked</div>
                    }
                </div>
                <div
                    className="ms-stats"
                    style={
                        currentRank.win !== 0 && currentRank.lose !== 0
                            ? {}
                            : {visibility: "hidden"}
                    }
                >
                    <div>
                        <div className="ms-wl">
                            <div className="ms-win">{currentRank.win}W</div>
                            <div className="ms-lose">{currentRank.lose}L</div>
                        </div>
                        <div className="ms-wl-bar">
                            <div className="ms-w-rate" style={{width: `${currentRank.win / (currentRank.win + currentRank.lose) * 100}%`}}></div>
                        </div>
                    </div>
                    <div className="ms-wl-ratio">{(currentRank.win / (currentRank.win + currentRank.lose) * 100).toFixed(0)}%</div>
                </div>
                <RecentTab d={d}/>
            </div>
        </div>
    );
};

function RecentTab({d}: any) {
    const {t} = useTranslation();
    const [recentTab, setRecentTab] = useState("matches");
    const [checkbox, setCheckbox] = useState(false);
    const {timeForToday} = require("../../utils/utils");


    useEffect(() => {
        if (checkbox) setRecentTab("champions");
        else setRecentTab("matches");
    }, [checkbox]);

    let sortedByPosition = _.sortBy(_.groupBy(d.recent_game_stats, (o) => {
        return o.position;
    }), (o) => {
        return -o.length;
    });

    return (
        <>
            <div className="ms-recent">
                <span>{t("recent-champion")}</span>
                <label className="ms-recent-switch">
                    <input
                        type="checkbox"
                        checked={checkbox}
                        onChange={() => {
                            setCheckbox(!checkbox);
                        }}
                    />
                    <span className="ms-recent-slider"></span>
                </label>
            </div>
            <div className="multisearch-lane">
                {sortedByPosition?.map((position: any, index) => {
                    if (index < 2) {
                        let won = _.filter(position, {
                            is_win: true
                        }).length;

                        return (
                            <div key={position[0].position} className="ms-lane">
                                <div className="ms-lane-img">
                                    <img
                                        alt="lane"
                                        src={`../../assets/images/icon-position-${position[0].position}.png`}
                                    />
                                </div>
                                <div className="ms-lane-stats">
                                    <div className="ms-lane-ratio">{(position.length / d.recent_game_stats.length * 100).toFixed(0)}%</div>
                                    <div className="ms-lane-wl-ratio">{t("win-ratio-short")} {(won / position.length * 100).toFixed(0)}%</div>
                                </div>
                            </div>
                        );
                    }
                })}
            </div>
            <div
                className="multisearch-recent-games"
                style={{display: recentTab === "matches" ? "flex" : "none"}}
            >
                {d.recent_game_stats?.length > 0 ? (
                    d.recent_game_stats.map((recent: any, i: number) => {
                        let champion = _.find(championsMetaData.data, {
                            id: recent.champion_id
                        });

                        if (champion) {
                            return (
                                <div key={i} className="ms-game">
                                    <div className={`ms-game-img`}>
                                        <img style={{
                                            width: "20px",
                                            height: "20px"
                                        }} src={champion?.image_url}/>
                                    </div>
                                    <div className={`ms-game-stat ms-game-${recent.is_remake ? "remake": recent.is_win}`}>
                                        {recent.kill}/{recent.death}/{recent.assist}
                                    </div>
                                    <div className={"ms-game-hours"}>
                                        {timeForToday(recent.created_at)}
                                    </div>
                                </div>
                            );
                        }
                    })
                ) : (
                    <div className="ms-no-data">
                        {t("live.feature.multisearch.no-data")}
                    </div>
                )}
            </div>
            <div
                className="multisearch-most-champions"
                style={{display: recentTab === "champions" ? "flex" : "none"}}
            >
                {d.summoner.most_champions?.champion_stats?.length > 0 ? (
                    d.summoner.most_champions?.champion_stats?.map((most: any, i: number) => {
                        if (i < 10)
                            let champion = _.find(championsMetaData.data, {
                                id: most.id
                            });
                        if (champion) {
                            let kda = Number(((most.kill + most.assist) / most.death).toFixed(2));
                            let winRate = Number((most.win / most.play * 100).toFixed(0));
                            return (
                                <div key={i} className="ms-champion">
                                    <div className="ms-champion-header">
                                        <div className={`ms-game-img round`}>
                                            <img style={{
                                                width: "20px",
                                                height: "20px"
                                            }} src={`${champion?.image_url}?image=c_scale,q_auto,w_20`}/>
                                        </div>
                                        <div
                                            className="ms-champion-kda"
                                            style={
                                                kda !== Infinity
                                                    ? kda >= 3
                                                        ? kda >= 4
                                                            ? {color: "#e28a56"}
                                                            : {color: "#56b388"}
                                                        : {}
                                                    : {color: "#e84057"}
                                            }
                                        >
                                            {most.death === 0
                                                ? <>Perfect KDA</>
                                                : <>{kda}:1 KDA</>
                                            }
                                        </div>
                                    </div>
                                    <div className="ms-champion-index">
                                        <div
                                            className="ms-champion-win-rate"
                                            style={
                                                winRate >= 50
                                                    ? {color: "#d31a45"}
                                                    : {}
                                            }
                                        >
                                            {winRate}%
                                        </div>
                                        <div style={{margin: "0 0px 0 8px", fontSize: "10px", color: "#35343f"}}>/</div>
                                        <div style={{minWidth: "20px", textAlign: "right"}}>{most.play}</div>
                                    </div>
                                </div>
                            );
                        }
                    })
                ) : (
                    <div className="ms-no-data">
                        {t("live.feature.multisearch.no-data")}
                    </div>
                )}
            </div>
        </>
    );
}

const MultiSearchItemError = ({d}: any) => {
    const onClickSummonerName =
        (summonerName = "") =>
            () => {
                window.api.send("openSummonerPage", summonerName);
            };
    return (
        <div className="multisearch-main-item multisearch-main-item-error">
            <div className="ms-tiers">
                {d.seasons?.length === 0 && (
                    <div style={{fontSize: "12px"}}>No recent Ranked Solo</div>
                )}
                {d.seasons?.slice(0, 2).map((season, i) => {
                    if (i === 0) {
                        return (
                            <div key={season} className="ms-tiers-tier ms-tiers-cur">
                                {season}
                            </div>
                        );
                    } else {
                        return (
                            <div key={season} className="ms-tiers-tier">
                                {season}
                            </div>
                        );
                    }
                })}
            </div>
            <div className="ms-info">
                <div className="ms-info-header">
                    <div className="ms-tier ms-circle">
                        <img src={`https:${d.tier_icon}`} alt="tier"/>
                    </div>
                    <div className="ms-profile">
                        <img
                            className="ms-picture"
                            src={`https://opgg-static.akamaized.net/images/profile_icons/profileIcon${d.profileIconId}.jpg?image=q_auto&v=1518361200`}
                            alt="profile"
                        />
                        {d.level && <div className="ms-level">{d.level}</div>}
                    </div>
                    {d.positions?.length > 0 && (
                        <div className="ms-position ms-circle">
                            <img
                                src={`../../assets/images/icon-position-${d.positions[0].pos_lane}.png`}
                                alt="lane"
                            />
                        </div>
                    )}
                </div>
                <div className="ms-info-profile">
                    <div
                        className="ms-summoner-name"
                        onClick={onClickSummonerName(d.name)}
                    >
                        {d.name}
                    </div>
                    <div className="ms-tier-detail">{d.tier}</div>
                </div>
            </div>
        </div>
    );
};
