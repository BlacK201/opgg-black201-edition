import React, {useEffect, useState} from 'react';
import {useTranslation} from "react-i18next";
import axios from 'axios';
import _ from 'lodash';
import Tippy from "@tippyjs/react";
import Dropdown from "../components/common/Dropdown";
import sendGA4Event from "../../utils/ga4";

interface DropdownOptionType {
    value: string | number;
    label?: string;
    icon?: string;
    display?: string;
}

const dropboxContent = [
    {
        display: "KR",
        value: "KR",
        label: "KR",
        icon: "../../assets/images/01-icon-icon-kr.svg"
    },
    {
        value: "NA",
        label: "NA",
        icon: "../../assets/images/01-icon-icon-na.svg"
    },
    {
        value: "EUNE",
        label: "EUNE",
        icon: "../../assets/images/01-icon-icon-eun.svg"
    },
    {
        value: "EUW",
        label: "EUW",
        icon: "../../assets/images/01-icon-icon-euw.svg"
    },
    {
        value: "BR",
        label: "BR",
        icon: "../../assets/images/01-icon-icon-br.svg"
    },
    {
        value: "JP",
        label: "JP",
        icon: "../../assets/images/01-icon-icon-jp.svg"
    },
    {
        value: "LAN",
        label: "LAN",
        icon: "../../assets/images/01-icon-icon-lan.svg"
    },
    {
        value: "LAS",
        label: "LAS",
        icon: "../../assets/images/01-icon-icon-las.svg"
    },
    {
        value: "OCE",
        label: "OCE",
        icon: "../../assets/images/01-icon-icon-oce.svg"
    },
    {
        value: "RU",
        label: "RU",
        icon: "../../assets/images/01-icon-icon-ru.svg"
    },
    {
        value: "TR",
        label: "TR",
        icon: "../../assets/images/01-icon-icon-tr.svg"
    },
];

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

const tabModeContent = [
    {
        title: "Ranked Solo",
        icon: "icon-position-RIFT.png",
        queueId: 420
    },
    {
        title: "Ranked Flex 5:5",
        icon: "icon-position-RIFT.png",
        queueId: 440
    },
];

const LiveOPChampions = () => {
    const {t} = useTranslation();
    const [tabIndex, setTabIndex] = useState<number>(0);
    const [tabModeIndex, setTabModeIndex] = useState<number>(0);
    const [data, setData] = useState<any>(false);
    const [duoData, setDuoData] = useState<any>(false);
    const [region, setRegion] = useState<string>(localStorage.getItem("region")?.toUpperCase() ?? "KR");
    const [selectedRegion, setSelectedRegion] = useState<DropdownOptionType>(_.filter(dropboxContent, {value: localStorage.getItem("region")?.toUpperCase() ?? "KR"})[0] ?? {
        display: "KR",
        value: "KR",
        label: "KR",
        icon: "../../assets/images/01-icon-icon-kr.svg"
    });

    useEffect(() => {
        sendGA4Event("view_live_op_page", {
            "menu_name": "full"
        });
    }, []);

    useEffect(() => {
        if (!data) {
            axios.get(`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/analytics/${region}/champion_stats.json`).then((res) => {
                setData(res.data);
            }).catch(() => {
                axios.get(`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/analytics/KR/champion_stats.json`).then((res) => {
                    setData(res.data);
                });
            });

            axios.get(`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/analytics/${region}/duo_stats_small.json`).then((res) => {
                setDuoData(res.data);
            }).catch(() => {
                axios.get(`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/analytics/KR/duo_stats_small.json`).then((res) => {
                    setData(res.data);
                });
            });
        }
    }, [data]);

    useEffect(() => {
        axios.get(`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/analytics/${region}/champion_stats.json`).then((res) => {
            setData(res.data);
        });

        axios.get(`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/analytics/${region}/duo_stats_small.json`).then((res) => {
            setDuoData(res.data);
        });
    }, [region]);

    const handleSelectedPosition = (value: any) => {
        setRegion(value.label);
        setSelectedRegion(value);
    };

    return (
        <div className="main-container contents-container">
            <div className="title-banner">
                <div className="title">{t("op")}</div>
                <div className="subtitle">{t("update-once")}</div>
                <div className="tabs-container" style={{width: "auto"}}>
                    <TabsMode
                        index={tabModeIndex}
                        setIndex={setTabModeIndex}
                        content={tabModeContent} />
                    <Tabs
                        index={tabIndex}
                        setIndex={setTabIndex}
                        content={tabContent} />
                    <Dropdown
                        options={dropboxContent}
                        value={selectedRegion}
                        onChange={handleSelectedPosition} />
                </div>
            </div>

            <Table statistics={data} duoData={duoData} lane={tabContent[tabIndex]?.title} mode={tabModeContent[tabModeIndex]?.queueId} />
        </div>
    );
};

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
                     onClick={() => setIndex(i)} key={i} >
                    <img src={`${index === i ? `../../assets/images/icon-position-${tab.title}-wh.svg` : `../../assets/images/icon-position-${tab.title}.png`}`} alt={tab.title} />
                    <span className={`recommendation-tab-title ${index === i ? "recommendation-tab-title-active" : ""}`}>{t(`lane.${tab.link}`)}</span>
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
        icon: string;
        queueId: number;
    }[]
}

const TabsMode = ({ index, setIndex, content }: TabModeProps) => {
    const { t }= useTranslation();

    return (
        <div className="statistics-tabs mode-tabs">
            {content.map((tab, i) => (
                <div className={`recommendation-tab-mode ${index === i ? "recommendation-tab-mode-active" : ""}`}
                     onClick={() => setIndex(i)} key={i}>
                    <img src={`../../assets/images/${tab.icon}`} alt={tab.title} />
                    <span className={`recommendation-tab-mode-title ${index === i ? "recommendation-tab-mode-title-active" : ""}`}>{t(`queue.${tab.queueId}`)}</span>
                </div>
            ))}
        </div>
    );
};

interface TableProps {
    statistics: any,
    duoData: any,
    lane: string
    mode: number
}

const Table = ({ statistics, duoData, lane, mode }: TableProps) => {
    const { t }= useTranslation();

    let position = {
        "TOP": "T",
        "JUNGLE": "J",
        "MID": "M",
        "ADC": "A",
        "SUPPORT": "S"
    };

    let tier = ["D", "P", "G", "S", "B"];
    let duoMap = {
        "T": "top",
        "J": "jungle",
        "M": "mid",
        "A": "bottom",
        "S": "support"
    }

    let result = _.filter(statistics, {
        "position": position[lane],
        "subType": mode
    });

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

    return (
        <div className="recommendation-table">
            <div className="recommendation-table-row recommendation-table-header">
                <div className="recommendation-table-column1">
                    <img src={`../../assets/images/icon-position-${lane}-wh.svg`} alt={lane} />
                </div>
                <div className="recommendation-table-column2"><img className="tier-img" src={`../../assets/images/diamond.png`} />Diamond ↑</div>
                <div className="recommendation-table-column2"><img className="tier-img" src={`../../assets/images/platinum.png`} />Platinum</div>
                <div className="recommendation-table-column2"><img className="tier-img" src={`../../assets/images/gold.png`} />Gold</div>
                <div className="recommendation-table-column2"><img className="tier-img" src={`../../assets/images/silver.png`} />Silver</div>
                <div className="recommendation-table-column2"><img className="tier-img" src={`../../assets/images/bronze.png`} />Bronze ↓</div>
            </div>

            {tier.map((t1, i1) => {
                return (
                    <div className={`recommendation-table-row ${i1 % 2 === 1 ? "recommendation-table-row-black" : ""}`} key={i1}>
                        <div className="recommendation-table-column1">{ordinal_suffix_of(i1+1)}</div>
                        {tier.map((t2, i2) => {
                            let tmp = _.filter(result, ["tierRank", t2]);
                            let d = tmp[i1];
                            if (d) {
                                let duo =  _.filter(duoData, {
                                    championName: d.championName,
                                    subType: d.subType,
                                    position: d.position,
                                    tierRank: d.tierRank
                                });

                                let duoHtml = `<div class="duo"><div>${t(`duo.${d.position}`)}</div><div style="display: flex; margin-top: 12px;">`;
                                if (!_.isEmpty(duo)) {
                                    duo.map((d) => {
                                        duoHtml += `
                                            <div style="display: flex; flex-direction: column; align-items: center; margin: 0 8px">
                                                <div class="champion-img">
                                                    <img src="https://opgg-static.akamaized.net/images/lol/champion/${d.duochampionName}.png?image=c_scale,q_auto,w_46&v=1623201942" />
                                                </div>
                                                <div style="display: flex; align-items: center"><img width="12" height="12" src="../../assets/images/icon-winrate.svg" style="margin-right: 4px;" />${(d.duoWR*100).toFixed(2)}%</div>
                                            </div>
                                        `;
                                    });
                                    duoHtml += `</div></div>`;
                                } else {
                                    duoHtml = t("duo.no");
                                }

                                return (
                                    <div className="recommendation-table-column2" key={i2}>
                                        <div className="live-op-content">
                                           <Tippy content={
                                                <div dangerouslySetInnerHTML={{
                                                    __html: duoHtml
                                                }}/>
                                            }>
                                                <div className="champion-img" style={{marginBottom: 0}}>
                                                    <img
                                                        src={`https://opgg-static.akamaized.net/images/lol/champion/${d.championName}.png?image=c_scale,q_auto,w_46&v=1623201942`}/>
                                                </div>
                                            </Tippy>

                                            <div className="stats-wrapper">
                                                <Tippy content={t("live.feature.champion.pick-rate")}>
                                                    <div className="ratio-wrapper">
                                                        <img src={"../../assets/images/icon-pickrate.svg"} />
                                                        {(d.PR*100).toFixed(1)}%
                                                    </div>
                                                </Tippy>
                                                <Tippy content={t("live.feature.champion.win-rate")}>
                                                    <div className="ratio-wrapper">
                                                        <img src={"../../assets/images/icon-winrate.svg"} />
                                                        {(d.WR*100).toFixed(1)}%
                                                    </div>
                                                </Tippy>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        })}
                    </div>
                );
            })}
        </div>
    );
}

export default LiveOPChampions;