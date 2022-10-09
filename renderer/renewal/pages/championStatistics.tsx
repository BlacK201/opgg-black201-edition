import React, {useEffect, useState, ChangeEvent, useCallback, useRef} from "react";
import { NavLink } from "react-router-dom";
import {useTranslation} from "react-i18next";
import _ from "lodash";
import axios from "axios";
import Error from "../components/common/Error";
const championsMetaData = require("../../../assets/data/meta/champions.json");
import Tippy from "@tippyjs/react";
import sendGA4Event from "../../utils/ga4";
import Dropdown from "../components/common/Dropdown";

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

interface DropdownOptionType {
    value: string | number;
    label?: string;
    icon?: string;
    display?: string;
}

const ChampionStatistics = () => {
    const { t } = useTranslation();
    const mounted = useRef(false);
    const [tabIndex, setTabIndex] = useState<number>(0);
    const [data, setData] = useState<any>();
    const [tableData, setTableData] = useState<any>();
    const [searchChampion, setSearchChampion] = useState("");
    const [showError, setShowError] = useState<boolean>(false);
    const [region, setRegion] = useState<string>(localStorage.getItem("selected-region")?.toUpperCase() ?? localStorage.getItem("region")?.toUpperCase() ?? "KR");
    const [tierFilter, setTierFilter] = useState<string>(localStorage.getItem("tier-filter") ?? "platinum_plus");
    const [versionFilter, setVersionFilter] = useState<string>(localStorage.getItem("version-filter") ?? "");
    const [selectedRegion, setSelectedRegion] = useState<DropdownOptionType>(_.filter(dropboxRegionContent, {value: localStorage.getItem("region")?.toUpperCase() ?? "KR"})[0] ?? {
        value: region.toLowerCase(),
        label: region,
        icon: `../../assets/images/01-icon-icon-${region.toLowerCase()}.svg`
    });
    const [selectedTierFilter, setSelectedTierFilter] = useState<DropdownOptionType>(_.filter(dropboxTierFilterContent, {value: localStorage.getItem("tier-filter") ?? "platinum_plus"})[0] ?? {
        value: "platinum_plus",
        label: "Platinum+",
    });
    const [versionDropboxContent, setVersionDropboxContent] = useState([{
        value: "",
        label: "Latest"
    }]);
    const [selectedVersionFilter, setSelectedVersionFilter] = useState<DropdownOptionType>(versionDropboxContent[0]);
    let champions = _.sortBy(_.filter(championsMetaData.data, (o) => {
        return o.name.indexOf(searchChampion.toLowerCase()) >= 0 || o.key.toLowerCase().indexOf(searchChampion.toLowerCase()) >= 0 || t(`champions.${o.id}`).toLowerCase().indexOf(searchChampion.toLowerCase()) >= 0;
    }), (o) => {
        if (localStorage.getItem("i18n") !== "kr") {
            return o.key;
        } else {
            return o.name;
        }
    });

    const onChangeSearchChampion = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchChampion(e.target.value.toLowerCase());
    }

    const loadData = useCallback(async () => {
        let response = await axios.get(`https://lol-api-champion.bk201.icu/api/${region}/champions/ranked?tier=${tierFilter}&version=${versionFilter}`)
            .catch((_) => {return null;});
        if (!response) return null;
        if (mounted.current) {
            setData(response.data.data);
            setTableData(_.sortBy(_.filter(response.data.data, (o) => {
                return _.find(o.positions, {
                    name: tabContent[tabIndex].title
                })
            }), (o) => {
                return _.find(o.positions, {
                    name: tabContent[tabIndex].title
                })?.stats.tier_data.rank
            }));
        }
    }, [region, tierFilter, versionFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        mounted.current = true;

        if (mounted.current) {
            sendGA4Event("view_champion_statistics_page", {
                menu_name: "full",
                server: region,
                tier: tierFilter
            });

            axios.get(`https://lol-api-champion.bk201.icu/api/${region}/champions/ranked/versions`).then((res) => {
                if (mounted.current) {
                    setVersionDropboxContent([]);
                    let hasVersion = false;
                    let versionUpdated = false;
                    let latest = "";
                    res.data.data.map((v: any, i: number) => {
                        if (i === 0) {
                            latest = v;
                            if (localStorage.getItem("latest-version") !== v) {
                                versionUpdated = true;
                            }
                            localStorage.setItem("latest-version", v);
                        }
                        if (v === versionFilter) {
                            hasVersion = true;
                        }
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
                    if (!hasVersion || versionUpdated) {
                        localStorage.setItem("version-filter", latest);
                        setVersionFilter(latest);
                        setSelectedVersionFilter({
                            value: latest,
                            label: latest
                        })
                    }
                }
            });
        }

        let tmpTimout = setTimeout(() => {
            setShowError(true);
        }, 9000);

        return () => {
            mounted.current = false;
            clearTimeout(tmpTimout);
        }
    }, []);

    if (!data && !tableData) {
        return (
            <>
                {showError
                    ? <Error error={503} msgType={"503"} isMini={false}/>
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


    const onTabClicked = (i: number) => () => {
        sendGA4Event("click_champion_statistics_lane", {
            menu_name: "full"
        });

        setTabIndex(i);
        setTableData(_.sortBy(_.filter(data, (o) => {
            return _.find(o.positions, {
                name: tabContent[i].title
            })
        }), (o) => {
            return _.find(o.positions, {
                name: tabContent[i].title
            }).stats.tier_data.rank
        }));
    }

    const handleSelectedPosition = (value: any) => {
        localStorage.setItem("selected-region", value.value);
        setRegion(value.label);
        setSelectedRegion(value);

        sendGA4Event("view_champion_statistics_page", {
            menu_name: "full",
            server: value.value,
            tier: tierFilter
        });
    };

    const handleSelectedTierFilter = (value: any) => {
        localStorage.setItem("tier-filter", value.value);
        setTierFilter(value.value);
        setSelectedTierFilter(value);

        sendGA4Event("view_champion_statistics_page", {
            menu_name: "full",
            server: region,
            tier: value.value
        });
    }

    const handleSelectedVersionFilter = (value: any) => {
        localStorage.setItem("version-filter", value.value);
        setSelectedVersionFilter(value);
        setVersionFilter(value.value);

        sendGA4Event("view_champion_statistics_page", {
            menu_name: "full",
            server: region,
            tier: tierFilter,
            version: value.value
        });
    }

    const Tabs = () => {
        const { t }= useTranslation();

        return (
            <div className="statistics-tabs" style={{
                margin: "20px auto 0 auto"
            }}>
                <div style={{display: "flex"}}>
                {tabContent.map((tab, i) => (
                    <div className={`recommendation-tab ${tabIndex === i ? "recommendation-tab-active" : ""}`}
                         onClick={onTabClicked(i)} key={i}>
                        <img src={`${tabIndex === i ? `../../assets/images/icon-position-${tab.title}-wh.svg` : `../../assets/images/icon-position-${tab.title}.png`}`} alt={tab.title} />
                        <span className={`recommendation-tab-title ${tabIndex === i ? "recommendation-tab-title-active" : ""}`}>{t(`lane.${tab.link}`)}</span>
                    </div>
                ))}
                </div>
                <Dropdown
                    options={dropboxRegionContent}
                    value={selectedRegion}
                    onChange={handleSelectedPosition}/>
                <Dropdown
                    options={dropboxTierFilterContent}
                    value={selectedTierFilter}
                    onChange={handleSelectedTierFilter} />
                <Dropdown
                    options={versionDropboxContent}
                    value={selectedVersionFilter}
                    onChange={handleSelectedVersionFilter} />
            </div>
        );
    };

    return (
        <div className={"main-container champion-statistics"}>
            <Tabs />
            <div className={"champion-statistics-bottom"}>
                <div className={"champion-statistics-search"}>
                    <div className={"champion-statistics-search-top"}>
                        <input className={"champion-statistics-search-bar"} placeholder={t("live.feature.champion.search-champion")} onChange={onChangeSearchChampion} onClick={() => {
                            sendGA4Event("click_champion_statistics_search", {});
                        }} />
                        <img src={"../../assets/images/icon-search.svg"} />
                    </div>
                    <div className={"champion-statistics-search-bottom"}>
                        {champions.map((champion: any, i) => {
                            let champ =  _.find(data, {
                                id: champion.id
                            });
                            if (!champ?.is_rip && champ?.positions.length > 0) {
                                return (
                                    <NavLink to={{
                                        pathname: `/champions/${champion.key}`,
                                        state: {
                                            key: champion.key,
                                            id: champion.id,
                                            lane: _.find(data, {
                                                id: champion.id
                                            })?.positions[0]?.name
                                        }
                                    }} key={i} draggable={false}>
                                        <div className={"item-champion"}>
                                            <div className={"champion-statistics-champion-img-wrapper"}>
                                                <img
                                                    // loading="lazy"
                                                     src={`${champion.image_url}?image=c_scale,q_auto,w_46`}/>
                                            </div>
                                            <div className={"item-champion-name"}>{t(`champions.${champion.id}`)}</div>
                                        </div>
                                    </NavLink>
                                )
                            } else {
                                return (
                                    <Tippy content={t("rip")} key={i}>
                                        <div className={"item-champion"} key={i}>
                                            <div className={"champion-statistics-champion-img-wrapper"}>
                                                <img
                                                    // loading="lazy"
                                                     src={`${champion.image_url}?image=c_scale,q_auto,w_46`} style={{filter: "grayscale(1)", opacity: "0.5"}}/>
                                            </div>
                                            <div className={"item-champion-name"}>{t(`champions.${champion.id}`)}</div>
                                        </div>
                                    </Tippy>
                                )
                            }
                        })}
                    </div>
                </div>
                <div className={"champion-statistics-table"}>
                    <div className={"champion-statistics-table-header"}>
                        <div className={"champion-statistics-table-column champion-statistics-table-column__1"}>#</div>
                        <div className={"champion-statistics-table-column champion-statistics-table-column__2"}></div>
                        <div className={"champion-statistics-table-column champion-statistics-table-column__3"}>Champion</div>
                        <div className={"champion-statistics-table-column champion-statistics-table-column__4"}>Tier</div>
                        <div className={"champion-statistics-table-column champion-statistics-table-column__5"}>Win Rate</div>
                        <div className={"champion-statistics-table-column champion-statistics-table-column__5"}>Pick Rate</div>
                        <div className={"champion-statistics-table-column champion-statistics-table-column__5"}>Ban Rate</div>
                    </div>
                    <div className={"champion-statistics-table-body"}>
                        {tableData &&  tableData.map((champion: any, i: number) => {
                            let position = _.find(champion.positions, {
                                name: tabContent[tabIndex].title
                            })?.stats;

                            let metaData = _.find(championsMetaData.data, {
                                id: champion.id
                            });

                            let rank_diff = 0;
                            if (position) {
                                rank_diff =  position.tier_data.rank_prev - position.tier_data.rank;
                            }

                            return (
                                <NavLink to={{
                                    pathname:  `/champions/${metaData?.key}`,
                                    state: {
                                        key: metaData?.key,
                                        id: metaData?.id,
                                        lane: tabContent[tabIndex].title.toLowerCase()
                                    }
                                }} key={i} draggable={false}>
                                    <div className={"champion-statistics-table-row"}>
                                        <div
                                            className={"champion-statistics-table-column champion-statistics-table-column__1"}>{i + 1}</div>
                                        <div
                                            className={"champion-statistics-table-column champion-statistics-table-column__2"}>
                                            {rank_diff !== 0 &&
                                                <>
                                                    <img
                                                        src={`../../assets/images/icon-rank-${rank_diff < 0 ? "down" : "up"}.svg`}/>
                                                    <div
                                                        className={`${rank_diff < 0 ? "rank-down" : "rank-up"}`}>{Math.abs(rank_diff)}</div>
                                                </>
                                            }
                                        </div>
                                        <div
                                            className={"champion-statistics-table-column champion-statistics-table-column__3"}>
                                            <div className={"champion-img-32"}>
                                                <img
                                                    // loading="lazy"
                                                    src={`${metaData?.image_url}?image=c_scale,q_auto,w_46`}/>
                                            </div>
                                            <div>{t(`champions.${champion.id}`)}</div>
                                        </div>
                                        <div
                                            className={"champion-statistics-table-column champion-statistics-table-column__4"}>
                                            <img src={`../../assets/images/optier-${position.tier_data.tier}.svg`}/>
                                        </div>
                                        <div
                                            className={"champion-statistics-table-column champion-statistics-table-column__5"}>
                                            {(position.win_rate * 100).toFixed(2)}%
                                        </div>
                                        <div
                                            className={"champion-statistics-table-column champion-statistics-table-column__5"}>
                                            {(position.pick_rate * 100).toFixed(2)}%
                                        </div>
                                        <div
                                            className={"champion-statistics-table-column champion-statistics-table-column__5"}>
                                            {(position.ban_rate * 100).toFixed(2)}%
                                        </div>
                                    </div>
                                </NavLink>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChampionStatistics;