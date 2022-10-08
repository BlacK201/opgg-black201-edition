import React, {useEffect} from 'react';
import { useTranslation } from "react-i18next";
import {useTypedSelector} from "../../../redux/store";
import _ from 'lodash';
// const { ipcRenderer } = globalThis.require('electron');
const championsMetaData = require("../../../../assets/data/meta/champions.json");
import sendGA4Event from "../../../utils/ga4";

const MiniMultisearch = () => {
    const {t} =useTranslation();
    const { multisearch } = useTypedSelector(state => state.common);

    useEffect(() => {
        sendGA4Event("view_multi_search_page", {
            "menu_name": "mini"
        });
    });

    const onClickSummonerName = (summonerName = "") => () => {
        window.api.send("openSummonerPage", summonerName);
    }

    if (_.isEmpty(multisearch) || !multisearch) {
        return (
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: "column", fontSize: "16px", color: "#ddd"}}>
                <video autoPlay muted loop width="426" height="240" style={{borderRadius: "12px", marginBottom: "48px"}}>
                    <source  src={"../../assets/images/video-multisearch-small.mp4"}
                             type="video/mp4" />
                </video>
                <div style={{padding: "0 24px", textAlign: "center", wordBreak: "keep-all"}}>{t("usage.multisearch")}  <span style={{color: "#ff8e05", fontWeight: "bold"}}>{t("live.tab.multisearch")}</span> {t("usage.move")}</div>
            </div>
        )
    }

    return (
        <div className="mini-multisearch">
            {multisearch.map((data, i) => {
                if(_.isEmpty(data) || !data) return null;
                let currentRank = _.find(data.summoner.league_stats, {
                    queue_info: {game_type: "SOLORANKED"}
                });
                let sortedByPosition = _.sortBy(_.groupBy(data.recent_game_stats, (o) => {
                    return o.position;
                }), (o) => {
                    return -o.length;
                });
                return (
                    <div className={"mini-multisearch-row justify-content-between"} key={i}>
                        <div className={"mini-multisearch-lane"}>
                            {sortedByPosition && sortedByPosition.length > 0 && sortedByPosition[0].length > 0 &&
                                <img src={`../../assets/images/icon-position-${sortedByPosition[0][0].position}-dark.svg`}/>
                            }
                        </div>
                        <div style={{
                            width: "170px"
                        }}>

                            {data.summoner.previous_seasons && data.summoner.previous_seasons?.length > 0
                                ? <div className={"mini-multisearch-season"}>{data.summoner.previous_seasons[0].tier_info.tier} {data.summoner.previous_seasons[0].tier_info.division}</div>
                                : <div className={"mini-multisearch-season"}>Unranked</div>
                            }
                            <div className={"flex"} style={{marginTop: "6px", marginBottom: "8px"}}>
                                <div className={"image-wrapper"}>
                                    {data.summoner.profile_image_url
                                        ? <img className={"profile-icon-image"} src={data.summoner.profile_image_url} />
                                        : <img className={"profile-icon-image"} src={"https://opgg-static.akamaized.net/images/profile_icons/profileIcon29.jpg?image=q_auto:best,w_48&v=1518361200"} />
                                    }
                                </div>
                                <div className={"flex flex-column"}>
                                    <div className={"mini-multisearch-name"} onClick={onClickSummonerName(data.summoner.name)}>{data.summoner.name}</div>
                                    <div className={"mini-multisearch-tier"}>
                                        {currentRank.tier_info.tier
                                            ? currentRank.tier_info.tier
                                            : <>Unranked</>
                                        }
                                    </div>
                                    <div className={"mini-multisearch-stats"}>
                                        {currentRank.win}W <span>{currentRank.lose}L</span>
                                        <span style={{marginLeft: "2px"}}>
                                            {currentRank.lose !== 0
                                                ? <>{(currentRank.win / (currentRank.win + currentRank.lose) * 100).toFixed(0)}%</>
                                                : <>0%</>
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={"flex justify-content-between"}>
                                {sortedByPosition && sortedByPosition?.map((position, i) => {
                                    if (i < 2) {
                                        let won = _.filter(position, {
                                            is_win: true
                                        }).length;

                                        return (
                                            <div className={"flex align-items-center"} key={i}>
                                                <div className={"image-wrapper profile-lane-image"}>
                                                    <img
                                                        src={`../../assets/images/icon-position-${position[0].position}.svg`}/>
                                                </div>
                                                <div>
                                                    <div>{(position.length / data.recent_game_stats.length * 100).toFixed(0)}%</div>
                                                    <div>W/R {(won / position.length * 100).toFixed(0)}%</div>
                                                </div>
                                            </div>
                                        )
                                    }
                                })}
                            </div>
                        </div>

                        <div className={"flex flex-column"} style={{
                            width: "172px",
                            height: "110px",
                            flexWrap: "wrap",
                            alignContent: "space-between",
                        }}>
                            {data.recent_game_stats && data.recent_game_stats.length > 0 && data.recent_game_stats.map((recent, i) => {
                                let champion = _.find(championsMetaData.data, {
                                    id: recent.champion_id
                                });

                                if (champion) {
                                    return (
                                        <div className={"flex justify-content-between"} style={{
                                            width: "82px"
                                        }} key={i}>
                                            <div className={"image-wrapper multisearch-champion-image"}>
                                                <div className={`ms-game-img`}>
                                                    <img style={{
                                                        width: "20px",
                                                        height: "20px"
                                                    }} src={champion?.image_url}/>
                                                </div>
                                                {/*<img src={"https://opgg-static.akamaized.net/images/lol/champion/Velkoz.png?image=c_scale,q_auto,w_24&v=1628647804"} />*/}
                                            </div>
                                            <div
                                                className={`mini-multisearch-game-kda mini-multisearch-game-kda-${recent.is_remake ? "remake": recent.is_win}`}>{recent.kill}/{recent.death}/{recent.assist}</div>
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
};

export default MiniMultisearch;