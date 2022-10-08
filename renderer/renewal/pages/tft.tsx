import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import axios from "axios";
import _ from "lodash";
import {useDispatch} from "react-redux";
import Tippy from '@tippyjs/react';
import tippy from 'tippy.js';
import {useTypedSelector} from "../../redux/store";
import Dropdown from "../components/common/Dropdown";
import sendGA4Event from "../../utils/ga4";

const championsMetaData = require("../../../assets/data/meta/champions.json");

// const tftSet = "6.5";
interface GuideInfoType {
    text: any,
    title: any,
    youtube: any,
    difficulty: any
}

interface DropdownOptionType {
    value: string | number;
    label?: string;
    icon?: string;
    display?: string;
}

const Capitalize = (str) => {
    if (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    } else {
        return "Hard";
    }
}

const Tft = ({mode}) => {
    const { t } = useTranslation();
    const [data, setData] = useState<any>(null);
    const [meta, setMeta] = useState(null);
    const [openedIndex, setOpenedIndex] = useState<any>(-1);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [guideInfo, setGuideInfo] = useState<any>();
    const [tftSet, setTftSet] = useState("7.5");
    const [filter, setFilter] = useState<string>("all");
    const [dropboxContent, setDropboxContent] = useState([{
        value: "all",
        label: `${t("origin")} ${t("synergy")}`,
        icon: "../../assets/images/tft/tft-synergy-any.svg"
    }]);
    const [dropboxContent2, setDropboxContent2] = useState([{
        value: "all",
        label: `${t("class")} ${t("synergy")}`,
        icon: "../../assets/images/tft/tft-synergy-any.svg"
    }]);
    const [selectedSynergy, setSelectedSynergy] = useState<DropdownOptionType>(dropboxContent[0]);
    const [selectedSynergy2, setSelectedSynergy2] = useState<DropdownOptionType>(dropboxContent2[0]);
    const [championTooltipDisabled, setChampionTooltipDisabled] = useState(false);

    useEffect(() => {
        // window.api.send("tft-join");
        if (!data) {
            axios.get(`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/recommend_test.json?timestamp=${new Date().getTime()}`).then((res) => {
                setData(res.data);
            }).catch(() => {
            });
        }

        sendGA4Event("view_tft_page", {
            "menu_name": "full"
        });

        const getSelectedRow = (event, data) => {
            setOpenedIndex(data);
        }

        if (mode === "overlay") window.api.on("tft-team-comps-selected-row", getSelectedRow);
        return () => {
            if (mode === "overlay") window.api.removeListener("tft-team-comps-selected-row", getSelectedRow);
            // window.api.send("tft-quit");
        };
    }, []);

    useEffect(() => {
        let tmpDropboxContent = [
            {
                value: "all",
                label: `${t("origin")} ${t("synergy")}`,
                icon: "../../assets/images/tft/tft-synergy-any.svg"
            }
        ];
        let tmpDropboxContent2 = [
            {
                value: "all",
                label: `${t("class")} ${t("synergy")}`,
                icon: "../../assets/images/tft/tft-synergy-any.svg"
            }
        ];
        setSelectedSynergy({
            value: "all",
            label: `${t("origin")} ${t("synergy")}`,
            icon: "../../assets/images/tft/tft-synergy-any.svg"
        })
        setSelectedSynergy2({
            value: "all",
            label: `${t("class")} ${t("synergy")}`,
            icon: "../../assets/images/tft/tft-synergy-any.svg"
        });
        axios.get(`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/meta_kr.json?timestamp=${new Date().getTime()}`).then((res) => {
            // setTftSet(res.data.set);
            setMeta(res.data);
            res.data?.traits.map((trait: any) => {
                if (trait.isClass) {
                    tmpDropboxContent.push({
                        value: trait.id,
                        label : localStorage.getItem("i18n") === "kr" ? trait.name : trait.nameEN,
                        icon: `https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/traits-wh/${trait.id}.svg`
                    });
                } else if (trait.isOrigin) {
                    tmpDropboxContent2.push({
                        value: trait.id,
                        label : localStorage.getItem("i18n") === "kr" ? trait.name : trait.nameEN,
                        icon: `https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/traits-wh/${trait.id}.svg`
                    });
                }
            });

            setDropboxContent(tmpDropboxContent);
            setDropboxContent2(tmpDropboxContent2);
        }).catch(() => {
        });
    }, [localStorage.getItem("i18n")]);

    if (data && meta) {
        data.recommend = _.sortBy(data.recommend, [(o) => {return o.index;}]);
        const filterData = [
            {
                title: t("all"),
                id: "all",
                d: "M16.293 17.03a1.313 1.313 0 0 1-2.274 1.314l-2.144-3.717-2.144 3.717a1.313 1.313 0 1 1-2.274-1.313l2.145-3.718h-4.29a1.313 1.313 0 0 1 0-2.626h4.29L7.457 6.969a1.313 1.313 0 0 1 2.274-1.313l2.144 3.717 2.144-3.717a1.313 1.313 0 1 1 2.274 1.313l-2.145 3.718h4.29a1.313 1.313 0 1 1 0 2.626h-4.29l2.145 3.718z"
            },
            {
                title: `S ${t("tier")}`,
                id: "s",
                d: "M4.805 13.987c.125.11.384.289.777.54v1.503l5.013 2.917 1.405.724c1.105-.207 1.244-.233 1.809-.236h.272L12 20.666l-7.195-4.198v-2.482zM12.072 8c1.864 0 3.182 1.043 3.235 2.549h-1.664c-.082-.668-.704-1.113-1.559-1.113-.885 0-1.47.41-1.47 1.054 0 .522.404.82 1.394 1.031l1.02.217c1.699.358 2.431 1.09 2.431 2.403 0 1.705-1.307 2.748-3.428 2.748-2.015 0-3.322-.99-3.386-2.567h1.71c.082.686.774 1.125 1.77 1.125.92 0 1.57-.445 1.57-1.084 0-.539-.422-.85-1.459-1.072l-1.101-.234c-1.541-.323-2.297-1.125-2.297-2.414C8.838 9.049 10.12 8 12.072 8zM12 4l7.195 4.148v6.328A7.108 7.108 0 0 1 21 16.368c-.125-.058-.38-.162-.765-.313.477 1.053.54 2.607-1.165 3.008-4.079.96-9.414-1.692-11.432-3.058 1.025.417 3.115 1.088 4.045 1.387l-.631-.267c-.938-.318-3.1-1.69-4.918-2.912-1.649-1.11-2.941-2.504-3.134-2.744.276.075.51.12.702.138-.627-1.14.038-2.319 1.103-2.795v-.664L12 4zm0 .89L5.582 8.599v3.02c-.276-.263-.69-.94-.777-1.378-.276.2-.322.64-.15 1.077.745 1.898 4.183 4.388 5.525 5.28.636.37 1.115.607 1.436.713.321.106.947.286 1.876.54.92.185 1.78.297 2.582.334 3.472.163 3.71-.84 3.121-1.679l-2.006 1.166a6.367 6.367 0 0 1-1.504-.025l2.733-1.567V8.6L12 4.889z"
            },
            {
                title: `A ${t("tier")}`,
                id: "a",
                d: "M4.805 13.987c.125.11.384.289.777.54v1.503l5.013 2.917 1.405.724c1.105-.207 1.244-.233 1.809-.236h.272L12 20.666l-7.195-4.198v-2.482zM13.015 8l2.936 8.455h-1.916l-.639-2.016h-2.97l-.65 2.016H8L10.936 8h2.08zm-1.042 1.758h-.106l-1.06 3.316h2.214l-1.048-3.316zM12 4l7.195 4.148v6.328A7.108 7.108 0 0 1 21 16.368c-.125-.058-.38-.162-.765-.313.477 1.053.54 2.607-1.165 3.008-4.079.96-9.414-1.692-11.432-3.058 1.025.417 3.115 1.088 4.045 1.387l-.631-.267c-.938-.318-3.1-1.69-4.918-2.912-1.649-1.11-2.941-2.504-3.134-2.744.276.075.51.12.702.138-.627-1.14.038-2.319 1.103-2.795v-.664L12 4zm0 .89L5.582 8.599v3.02c-.276-.263-.69-.94-.777-1.378-.276.2-.322.64-.15 1.077.745 1.898 4.183 4.388 5.525 5.28.636.37 1.115.607 1.436.713.321.106.947.286 1.876.54.92.185 1.78.297 2.582.334 3.472.163 3.71-.84 3.121-1.679l-2.006 1.166a6.367 6.367 0 0 1-1.504-.025l2.733-1.567V8.6L12 4.889z"
            },
            {
                title: `B ${t("tier")}`,
                id: "b",
                d: "M4.805 13.987c.125.11.384.289.777.54v1.503l5.013 2.917 1.405.724c1.105-.207 1.244-.233 1.809-.236h.272L12 20.666l-7.195-4.198v-2.482zM12.697 8c1.64 0 2.62.803 2.62 2.11 0 .896-.663 1.675-1.53 1.804v.106c1.12.082 1.934.925 1.934 2.015 0 1.483-1.12 2.42-2.924 2.42H9V8zm-.392 4.7H10.77v2.402h1.576c1.02 0 1.57-.428 1.57-1.22 0-.773-.568-1.183-1.611-1.183zm-.059-3.346H10.77v2.15h1.33c.955 0 1.476-.393 1.476-1.072 0-.674-.486-1.078-1.33-1.078zM12 4l7.195 4.148v6.328A7.108 7.108 0 0 1 21 16.368c-.125-.058-.38-.162-.765-.313.477 1.053.54 2.607-1.165 3.008-4.079.96-9.414-1.692-11.432-3.058 1.025.417 3.115 1.088 4.045 1.387l-.631-.267c-.938-.318-3.1-1.69-4.918-2.912-1.649-1.11-2.941-2.504-3.134-2.744.276.075.51.12.702.138-.627-1.14.038-2.319 1.103-2.795v-.664L12 4zm0 .89L5.582 8.599v3.02c-.276-.263-.69-.94-.777-1.378-.276.2-.322.64-.15 1.077.745 1.898 4.183 4.388 5.525 5.28.636.37 1.115.607 1.436.713.321.106.947.286 1.876.54.92.185 1.78.297 2.582.334 3.472.163 3.71-.84 3.121-1.679l-2.006 1.166a6.367 6.367 0 0 1-1.504-.025l2.733-1.567V8.6L12 4.889z"
            }
        ];

        const handleSelectedSynergy = (value: any) => {
            setOpenedIndex(-1);
            setSelectedSynergy(value)
            setSelectedSynergy2(dropboxContent2[0]);
        }

        const handleSelectedSynergy2 = (value: any) => {
            setOpenedIndex(-1);
            setSelectedSynergy2(value)
            setSelectedSynergy(dropboxContent[0]);
        }

        const synergyToolTip = (s) => {
            let i18n = localStorage.getItem("i18n");
            let synergy = _.find(meta.traits, {id: s});
            return (
                <div>
                    <div>{i18n === "kr" ? synergy.name : synergy.nameEN}</div>
                    {synergy.name !== "신기루" &&
                        <div style={{
                            marginTop: 16,
                            marginBottom: 8,
                            whiteSpace: "pre-line"
                        }}>{i18n === "kr" ? synergy.meta[2] : synergy.meta[3]}</div>
                    }
                    <div style={{
                        whiteSpace: "pre-line",
                        color: "#676678",
                        lineHeight: 1.5
                    }}>{i18n === "kr" ? synergy.meta[4] : synergy.meta[5]}</div>
                </div>
            )
        }

        const itemToolTip = (i) => {
            let id = typeof(i) === "number" ? i : i.id;
            let i18n = localStorage.getItem("i18n");
            let item = _.find(meta.items, {id: id});
            if (item) {
                return (
                    <div>
                        <div style={{
                            color: "#ff9f4a",
                            fontWeight: "bold",
                            marginBottom: 16
                        }}>{i18n === "kr" ? item.name : item.nameEN}</div>
                        {item.meta && item.metaEN &&
                            <>
                                <div style={{
                                    marginBottom: 8
                                }}>{i18n === "kr" ? item.meta[1] : item.metaEN[1]}</div>
                                <div style={{
                                    whiteSpace: "pre-line",
                                    color: "#676678",
                                    lineHeight: 1.5,
                                    marginBottom: 8
                                }}>{i18n === "kr" ? item.meta[2] : item.metaEN[2]}</div>
                            </>
                        }
                        {item.from &&
                            <div style={{
                                display: "flex",
                                alignItems: "center"
                            }}>
                                {item.from.map((id, i) => {
                                    if (i === 0) {
                                        return (
                                            <>
                                                <img width={32} height={32}
                                                     src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${id}.png`}
                                                     style={{borderRadius: 4}}/>
                                                <img
                                                    src={"../../assets/images/tft/tft-item-plus.svg"}
                                                    style={{
                                                        width: "16px",
                                                        height: "16px",
                                                        margin: "0 4px",
                                                    }}/>
                                            </>
                                        )
                                    } else {
                                        return (
                                            <img width={32} height={32}
                                                 src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${id}.png`}/>
                                        )
                                    }
                                })}
                            </div>
                        }
                    </div>
                )
            }
        }

        const championToolTip = (c) => {
            let i18n = localStorage.getItem("i18n");
            let champion = _.find(meta.champions, {id: c.champion});
            let trait = _.chain(meta.traits)
                .keyBy('id')
                .at(champion.traits)
                .value();
            return (
                <div className={"tft-tooltip"}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 16
                    }}>
                        <div className={"tft-tooltip-name"}>{i18n === "kr" ? c.name : c.nameEN}</div>
                        <div className={"tft-tooltip-cost"}>
                            <img src={"https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/assets/images/icon-gold.svg"} style={{marginLeft: 8, marginRight: 2}} /> {c.championCost}
                        </div>
                    </div>
                    <div style={{
                        marginBottom: 10
                    }}>
                        {trait.map((d, i) => {
                            return (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                }}>
                                    <img width={15} height={15} src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/traits-wh/${d.id}.svg`} style={{marginRight: 4}} />
                                    {i18n === "kr" ? d.name : d.nameEN}
                                </div>
                            )
                        })}
                    </div>
                    {champion.meta && champion.metaEN &&
                        <>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: 22
                            }}>
                                <div>{t("tft-attack-range")}</div>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginLeft: 4
                                }}>
                                    {Array.from(Array(champion.meta[6] * 1).keys()).map((i) => {
                                        return(
                                            <div style={{
                                                width: 12,
                                                height: 12,
                                                backgroundColor: "#a072ff",
                                                borderRadius: "50%",
                                                marginRight: 2
                                            }}></div>
                                        )
                                    })}
                                    {Array.from(Array(5 - champion.meta[6] * 1).keys()).map((i) => {
                                        return(
                                            <div style={{
                                                width: 12,
                                                height: 12,
                                                backgroundColor: "#31313c",
                                                borderRadius: "50%",
                                                marginRight: 2
                                            }}></div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div>
                                <div style={{
                                    display: "flex"
                                }}>
                                    <div style={{
                                        marginRight: 8
                                    }}>
                                        <img width={32} height={32} src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/skills/${champion.id}.png`} style={{borderRadius: 4}} />
                                    </div>
                                    <div>
                                        <div style={{
                                            color: "#ff9f4a"
                                        }}>{i18n === "kr" ? champion.meta[1] : champion.metaEN[1]}</div>
                                        <div>{i18n === "kr" ? champion.meta[2] : champion.metaEN[2]}</div>
                                    </div>
                                </div>
                                <div style={{color: "#676678", margin: "4px 0"}}>{i18n === "kr" ? champion.meta[3] : champion.metaEN[3]}</div>
                                <div style={{whiteSpace: "pre-line"}}>{i18n === "kr" ? champion.meta[4] : champion.metaEN[4]}</div>
                                <div style={{marginTop: 12, marginBottom: 4}}>{t("tft-item")}</div>
                                <div>
                                    {champion.meta[5].split(",").map((d) => {
                                        let item = _.find(meta.items, {name: d})
                                        if (item) {
                                            return (
                                                <>
                                                    <img width={32} height={32}
                                                         src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${item.id}.png`}
                                                         style={{
                                                             borderRadius: 4,
                                                             marginRight: 4
                                                         }}/>
                                                </>
                                            )
                                        }
                                    })}
                                </div>
                            </div>
                        </>
                    }
                </div>
            )
        }

        return (
            <>
                {mode !== "overlay" &&
                    <div className={"tft-filter"} style={{
                        position: "relative"
                    }}>
                        <div style={{
                            position: "absolute",
                            top: 10,
                            left: 20,
                            fontSize: 14,
                            fontWeight: "bold"
                        }}>{data.patch_version}</div>
                        {/*<div className={"tft-filter-tier"}>*/}
                        {/*    {filterData.map(({title, id, d}) => (*/}
                        {/*        <div*/}
                        {/*            className={`tft-filter-tier-item${filter === id ? " tft-filter-tier-item__active" : ""}`}*/}
                        {/*            onClick={() => {*/}
                        {/*                setOpenedIndex(-1);*/}
                        {/*                setFilter(id);*/}
                        {/*            }}>*/}
                        {/*            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">*/}
                        {/*                <path d={d} fill={filter === id ? "#FFF" : "#7B7A8E"} fillRule="nonzero"/>*/}
                        {/*            </svg>*/}
                        {/*            <span>{title}</span>*/}
                        {/*        </div>*/}
                        {/*    ))}*/}
                        {/*</div>*/}
                        <Dropdown
                            options={dropboxContent}
                            value={selectedSynergy}
                            onChange={handleSelectedSynergy}
                            type={"tft"}
                        />
                        <div style={{margin: "0 8px"}}></div>
                        <Dropdown
                            options={dropboxContent2}
                            value={selectedSynergy2}
                            onChange={handleSelectedSynergy2}
                            type={"tft"}
                        />
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            position: "absolute",
                            top: 10,
                            right: 20,
                            fontSize: 12,
                        }}><img src={"../../assets/images/icon-info-purple.svg"} style={{
                        marginRight: 4
                        }} /> {t("tft-overlay")}</div>
                        {/*<div className={"tft-filter-synergy"}>*/}
                        {/*    <div className={"tft-filter-synergy-info"}>*/}
                        {/*        <img src={"../../assets/images/tft/tft-synergy-any.svg"} />*/}
                        {/*        <span>Any Synergy</span>*/}
                        {/*    </div>*/}
                        {/*    <img src={"../../assets/images/tft/tft-synergy-dropdown.svg"} />*/}
                        {/*</div>*/}
                    </div>
                }
                <div className={"tft-container"} style={{
                    backgroundColor: `${mode === "overlay" ? "rgba(28, 28, 31, 0.0)" : "transparent"}`,
                }}>
                    {data.recommend.map((d:any, i:any) => {
                        // console.log(d, i, "test");
                        if ((mode === "overlay" && i === openedIndex) || mode !== "overlay") {
                            // console.log(d);
                            let synergyCount = d.synergies.length;
                            if (synergyCount >= 9) {
                                synergyCount = 9;
                            }
                            let currentHexagon = 0;
                            let sortedSynergies = _.sortBy(d.synergies, (e) => {
                                return e.id.split("-")[1];
                            }).reverse();
                            d.buildboards.final = _.sortBy(d.buildboards.final, "championCost");
                            let coreChampions = _.filter(d.buildboards.final, {core: true});
                            let items: any = [];
                            for (let a = 1; a <= 3; a++) {
                                _.filter(d.buildboards.final, (e) => {
                                    let tmpItem = _.find(meta.items, {id: e[`item${a}`].id});
                                    return e[`item${a}`].id !== 0 && e[`item${a}`].id !== null && tmpItem.isCombItem;
                                }).forEach((i) => {
                                    items.push(i[`item${a}`]);
                                });
                            }
                            items = _.uniqBy(items, (e) => {
                                return e.id;
                            });

                            let newItems = {
                                unique: [],
                                duplicate: {}
                            };
                            let duplicated: any = [];
                            items.forEach((item: any) => {
                                if (!duplicated.includes(item.id)) {
                                    let duplicate = _.filter(items, (e) => {
                                        return e.from[0] === item.from[0] && e.id !== item.id;
                                    });

                                    if (_.isEmpty(duplicate)) {
                                        newItems["unique"].push(item);
                                    } else {
                                        duplicated.push(item.id);
                                        try {
                                            newItems["duplicate"][item.from[0]].push(item);
                                        } catch (e) {
                                            newItems["duplicate"][item.from[0]] = {
                                                from: [],
                                                core: []
                                            };
                                            newItems["duplicate"][item.from[0]]["from"].push(item.from[1]);
                                            newItems["duplicate"][item.from[0]]["core"].push(item.id);
                                        }

                                        duplicate.forEach((t) => {
                                            duplicated.push(t.id);
                                            newItems["duplicate"][item.from[0]]["from"].push(t.from[1]);
                                            newItems["duplicate"][item.from[0]]["core"].push(t.id);
                                        });

                                    }
                                }
                            });

                            const onClickGuideButton = () => {
                                // const { text, title, youtube, difficulty } = d;
                                sendGA4Event("click_tft_guide", {
                                    title: d.title.kr,
                                    // tier: d.tier,
                                    youtube_channel: d.youtubeChannel,
                                    youtube_channel_name: d.youtubeChannelName,
                                    twitch_channel: d.twitchChannel,
                                    twitch_channel_name: d.twitchChannelName,
                                });
                                setGuideInfo(d);
                                setIsGuideOpen(true);
                            }

                            let hasSynergy = false;
                            if (selectedSynergy.value !== "all") {
                                let has = _.find(d.synergies, (e) => {
                                    return e.id.split("-")[0] === selectedSynergy.value;
                                });

                                if (has) {
                                    hasSynergy = true;
                                }
                            } else if (selectedSynergy2.value !== "all") {
                                let has = _.find(d.synergies, (e) => {
                                    return e.id.split("-")[0] === selectedSynergy2.value;
                                });

                                if (has) {
                                    hasSynergy = true;
                                }
                            } else {
                                hasSynergy = true;
                            }

                            let youtube = _.find(d.streamer, {"platform": "youtube"});
                            let twitch = _.find(d.streamer, {"platform": "twitch"});
                            let tag = null;
                            if (d.tag && d.tag.split("|").length > 1) {
                                tag = localStorage.getItem("i18n") === "kr" ? d.tag.split("|")[0] : d.tag.split("|")[1];
                            }

                            if (mode !== "overlay") {
                                return (
                                    <>
                                        <div
                                            className={`tft-row ${hasSynergy ? "" : "tft-row-hidden"}`}
                                            key={i} onClick={() => {
                                            if (openedIndex === i) {
                                                setOpenedIndex(-1);
                                                window.api.send("tft-team-comps-selected-row", -1);
                                            } else {
                                                sendGA4Event("click_tft_row", {
                                                    title: d.title.kr,
                                                    // tier: d.tier,
                                                    youtube_channel: d.youtubeChannel,
                                                    youtube_channel_name: d.youtubeChannelName,
                                                    twitch_channel: d.twitchChannel,
                                                    twitch_channel_name: d.twitchChannelName,
                                                });
                                                setOpenedIndex(i);
                                                window.api.send("tft-team-comps-selected-row", i);
                                            }
                                        }}>
                                            {/*<div className={"tier-column"}>*/}
                                            {/*    <img src={`https://opgg-desktop-data.akamaized.net/assets/images/tft/tft-rank-${d.tier.toLowerCase()}.svg`}/>*/}
                                            {/*</div>*/}
                                            <div className={"title-column"}>
                                                <div>{localStorage.getItem("i18n") === "kr" ? d.title.kr : d.title.en}</div>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    marginTop: "8px"
                                                }}>
                                                    {/*<div*/}
                                                    {/*    className={`tft-difficulty tft-difficulty-${d?.difficulty?.toLowerCase()}`}>{Capitalize(d?.difficulty)}</div>*/}
                                                    <div style={{
                                                        display: "flex"
                                                    }}>
                                                        {tag != null && tag.split(",").map((t, i) => {
                                                            return(
                                                                <div style={{
                                                                    display: "flex",
                                                                    justifyContent: "center",
                                                                    alignItems: "center",
                                                                    color: "#6e4fff",
                                                                    backgroundColor: "#2a2353",
                                                                    borderRadius: 4,
                                                                    padding: "2px 6px",
                                                                    fontSize: 11,
                                                                    marginRight: "4px"
                                                                }}>{t}</div>
                                                            )
                                                        })}
                                                        {/*{d.youtube.link && <img src={"https://opgg-desktop-data.akamaized.net/assets/images/icon-youtube-wh.svg"}*/}
                                                        {/*                        style={{marginLeft: "8px"}}/>}*/}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={"hexagons"}>
                                                {Array.from(Array(synergyCount).keys()).map((i) => {
                                                    currentHexagon += 1;
                                                    let synergy = sortedSynergies[i].id.split("-");
                                                    let style = synergy[1];
                                                    synergy = synergy[0];
                                                    return (
                                                        <div
                                                            className={`hexagon hexagon-${currentHexagon} hexagon-style-${style}`}>
                                                            <Tippy content={synergyToolTip(synergy)} placement={"bottom"}>
                                                                <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/traits/${synergy}.svg`}/>
                                                            </Tippy>
                                                        </div>
                                                    )
                                                })}
                                                {Array.from(Array(9 - synergyCount).keys()).map(() => {
                                                    currentHexagon += 1;
                                                    return (
                                                        <div
                                                            className={`hexagon hexagon-${currentHexagon} hexagon-style-0`}></div>
                                                    )
                                                })}
                                            </div>
                                            <div className={"tft-champions"}>
                                                {d.buildboards.final.map((c: any, i: any) => {
                                                    if (c.name !== "비취 조각상") {
                                                        return (
                                                            <div className={"tft-champion"}>
                                                                {c?.three &&
                                                                    <div style={{
                                                                        position: "absolute",
                                                                        top: "-16px"
                                                                    }}>
                                                                        <img
                                                                            src={`../../assets/images/star${c.championCost}.svg`}/>
                                                                    </div>
                                                                }
                                                                <Tippy content={championToolTip(c)}
                                                                       disabled={championTooltipDisabled}
                                                                       placement={"bottom"}>
                                                                    <div className={`tft-cost tft-cost-${c.championCost}`}>
                                                                        <img
                                                                            src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/champions/${c.champion}.png`}/>
                                                                        <div
                                                                            className={`tft-cost-area tft-cost-area-${c.championCost} `}>${c.championCost}</div>
                                                                    </div>
                                                                </Tippy>
                                                                <div className={"tft-items"}>
                                                                    {(c.item1.id !== 0 && c.item1.id !== null) &&
                                                                        <Tippy content={itemToolTip(c.item1)}
                                                                               placement={"bottom"}>
                                                                            <div className={"tft-item"}
                                                                                 onMouseEnter={() => {
                                                                                     setChampionTooltipDisabled(true);
                                                                                 }} onMouseLeave={() => {
                                                                                setChampionTooltipDisabled(false);
                                                                            }}>
                                                                                <img
                                                                                    src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item1.id}.png`}/>
                                                                            </div>
                                                                        </Tippy>
                                                                    }
                                                                    {(c.item2.id !== 0 && c.item2.id !== null) &&
                                                                        <Tippy content={itemToolTip(c.item2)}
                                                                               placement={"bottom"}>
                                                                            <div className={"tft-item"}
                                                                                 onMouseEnter={() => {
                                                                                     setChampionTooltipDisabled(true);
                                                                                 }} onMouseLeave={() => {
                                                                                setChampionTooltipDisabled(false);
                                                                            }}>
                                                                                <img
                                                                                    src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item2.id}.png`}/>
                                                                            </div>
                                                                        </Tippy>
                                                                    }
                                                                    {(c.item3.id !== 0 && c.item3.id !== null) &&
                                                                        <Tippy content={itemToolTip(c.item3)}
                                                                               placement={"bottom"}>
                                                                            <div className={"tft-item"}
                                                                                 onMouseEnter={() => {
                                                                                     setChampionTooltipDisabled(true);
                                                                                 }} onMouseLeave={() => {
                                                                                setChampionTooltipDisabled(false);
                                                                            }}>
                                                                                <img
                                                                                    src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item3.id}.png`}/>
                                                                            </div>
                                                                        </Tippy>
                                                                    }
                                                                </div>
                                                                <div
                                                                    className={"tft-champion-name"}>{localStorage.getItem("i18n") === "kr" ? c.name : c.nameEN}</div>
                                                            </div>
                                                        )
                                                    }
                                                })}
                                            </div>
                                            <div className={"show-more"}>
                                                {openedIndex === i
                                                    ? <img width={32} height={32} src={"https://opgg-desktop-data.akamaized.net/assets/images/tft/tft-arrow-up.svg"}/>
                                                    : <img width={32} height={32} src={"https://opgg-desktop-data.akamaized.net/assets/images/icon-arrow-down-btn.svg"}/>
                                                }

                                            </div>
                                        </div>
                                        <div className={"tft-row-expand"}
                                             style={{display: `${openedIndex === i ? "block" : "none"}`}}>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center"
                                            }}>
                                                {!_.isEmpty(coreChampions)
                                                    ? <div>
                                                        <div style={{fontSize: "12px", color: "#fff", fontWeight: "bold"}}>{t("tft-champion")}</div>
                                                        <div className={"tft-core-champions"}>
                                                            {coreChampions.map((c) => {
                                                                // c["championName"] = t(`champions.${_.find(championsMetaData.data, (l) => {
                                                                //     return l.key.toLowerCase() === c.champion;
                                                                // })?.id}`);

                                                                return (
                                                                    <>
                                                                        <div
                                                                            className={`tft-core-champion tft-core-champion-${c.championCost}`}>
                                                                            <Tippy content={championToolTip(c)}>
                                                                                <img
                                                                                    src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/champions/${c.champion}.png`}
                                                                                    // onMouseEnter={e => onChampionHover(e, c)} onMouseLeave={onChampionMouseLeave}
                                                                                />
                                                                            </Tippy>
                                                                        </div>
                                                                        <div className={"tft-core-champion-items"}>
                                                                            {(c.item1.id !== 0 && c.item1.id !== null) &&
                                                                                <Tippy content={itemToolTip(c.item1)} placement={"bottom"}>
                                                                                    <div className={"tft-item"}>
                                                                                        <img
                                                                                            src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item1.id}.png`}
                                                                                            // onMouseEnter={e => onItemHover(e, {main: c.item1.id, from: c.item1.from})} onMouseLeave={onItemMouseLeave}
                                                                                        />
                                                                                    </div>
                                                                                </Tippy>
                                                                            }
                                                                            {(c.item2.id !== 0 && c.item2.id !== null) &&
                                                                                <Tippy content={itemToolTip(c.item2)} placement={"bottom"}>
                                                                                    <div className={"tft-item"}>
                                                                                        <img
                                                                                            src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item2.id}.png`}
                                                                                            // onMouseEnter={e => onItemHover(e, {main: c.item2.id, from: c.item2.from})} onMouseLeave={onItemMouseLeave}
                                                                                        />
                                                                                    </div>
                                                                                </Tippy>
                                                                            }
                                                                            {(c.item3.id !== 0 && c.item3.id !== null) &&
                                                                                <Tippy content={itemToolTip(c.item3)} placement={"bottom"}>
                                                                                    <div className={"tft-item"}>
                                                                                        <img
                                                                                            src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item3.id}.png`}
                                                                                            // onMouseEnter={e => onItemHover(e, {main: c.item3.id, from: c.item3.from})} onMouseLeave={onItemMouseLeave}
                                                                                        />
                                                                                    </div>
                                                                                </Tippy>
                                                                            }
                                                                        </div>
                                                                    </>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                    : <div style={{width: "100px", height: "66px"}}></div>
                                                }

                                                <div style={{
                                                    width: 1,
                                                    height: 66,
                                                    backgroundColor: "#282830",
                                                    margin: "0 12px"
                                                }}></div>

                                                {d?.levels &&
                                                    <div style={{
                                                        fontSize: 12,
                                                        height: 68
                                                    }}>
                                                        <div style={{fontWeight: "bold"}}>{t("tft-levelup")}</div>
                                                        <div style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            marginTop: 18
                                                        }}>
                                                            {Object.keys(d.levels).map((level, i) => {
                                                                if (d.levels[level] !== "") {
                                                                    return (
                                                                        <>
                                                                            <div style={{
                                                                                display: "flex",
                                                                                flexDirection: "column",
                                                                                alignItems: "center"
                                                                            }}>
                                                                                <div style={{
                                                                                    marginBottom: 2
                                                                                }}>{level}
                                                                                </div>
                                                                                <div>{d.levels[level]}</div>
                                                                            </div>
                                                                            {Object.keys(d.levels).length - 1 !== i &&
                                                                                <div>
                                                                                    <img
                                                                                        src={"../../assets/images/icon-arrow-right.svg"} style={{
                                                                                        margin: "0 2px"
                                                                                    }} />
                                                                                </div>
                                                                            }
                                                                        </>
                                                                    )
                                                                }
                                                            })}
                                                        </div>
                                                    </div>
                                                }
                                            </div>

                                            <div style={{display: "flex", marginTop: "24px"}}>
                                                <div className={"tft-item-combination-container"}>
                                                    <div style={{fontSize: "12px", color: "#7b7a8e"}}>{t("tft-item")}</div>
                                                    <div className={`tft-item-combination`}>
                                                        {Object.entries(newItems.duplicate).map(([k, items], d) => {
                                                            return (
                                                                <div className={"tft-item-combination-duplicate"}>
                                                                    <div className={`tft-item-combination-0`}>
                                                                        <img
                                                                            src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${k}.png`}/>
                                                                    </div>
                                                                    <div>
                                                                        <img
                                                                            src={"../../assets/images/tft/tft-item-plus.svg"}
                                                                            style={{
                                                                                width: "16px",
                                                                                height: "16px",
                                                                                margin: "4px 0",
                                                                                marginBottom: "0"
                                                                            }}/>
                                                                    </div>
                                                                    <div>
                                                                        {items.from.map((item) => {
                                                                            return (
                                                                                <img
                                                                                    src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${item}.png`}
                                                                                    style={{margin: "0 4px"}}/>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                    <div>
                                                                        <img
                                                                            src={"../../assets/images/tft/tft-item-equal.svg"}
                                                                            style={{width: "16px", height: "16px"}}/>
                                                                    </div>
                                                                    <div>
                                                                        {items.core.map((item, i) => {
                                                                            return (
                                                                                <Tippy content={itemToolTip(item)}>
                                                                                    <img
                                                                                        src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${item}.png`}
                                                                                        style={{margin: "0 4px"}}
                                                                                        // onMouseEnter={e => onItemHover(e, {main: item, from: [k, items.from[i]]})} onMouseLeave={onItemMouseLeave}
                                                                                    />
                                                                                </Tippy>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                        {newItems.unique.map((item: any) => {
                                                            return (
                                                                <div className={"tft-item-combination-row"}>
                                                                    <div className={`tft-item-combination-0`}>
                                                                        <img
                                                                            src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${item.from[0]}.png`}/>
                                                                    </div>
                                                                    <div>
                                                                        <img
                                                                            src={"../../assets/images/tft/tft-item-plus.svg"}
                                                                            style={{
                                                                                width: "16px",
                                                                                height: "16px",
                                                                                margin: "4px 0",
                                                                                marginBottom: "0"
                                                                            }}/>
                                                                    </div>
                                                                    <div>
                                                                        <img
                                                                            src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${item.from[1]}.png`}/>
                                                                    </div>
                                                                    <div>
                                                                        <img
                                                                            src={"../../assets/images/tft/tft-item-equal.svg"}
                                                                            style={{width: "16px", height: "16px"}}/>
                                                                    </div>
                                                                    <div>
                                                                        <Tippy content={itemToolTip(item)}>
                                                                            <img
                                                                                src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${item.id}.png`}
                                                                                // onMouseEnter={e => onItemHover(e, {main: item.id, from: item.from})} onMouseLeave={onItemMouseLeave}
                                                                            />
                                                                        </Tippy>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginTop: 8
                                            }}>
                                                {["early", "middle", "final"].map((time) => {
                                                    return (
                                                        <div className={"chess-container2"}>
                                                            <div style={{
                                                                position: "absolute",
                                                                marginTop: 8,
                                                                marginLeft: 8,
                                                                fontSize: 12,
                                                                color: "#5d5a73"
                                                            }}>{t(`tft-${time}-build`)}</div>
                                                            {Array.from(Array(4).keys()).map((i) => {
                                                                return (
                                                                    <>
                                                                        <div className={"chess-row"}>
                                                                            {Array.from(Array(7).keys()).map((k) => {
                                                                                let c = _.find(d.buildboards[time], {xy: `${i}-${k}`});
                                                                                return (
                                                                                    <div className={`hex ${c && `hex-${c.championCost}`}`}
                                                                                         style={{
                                                                                             left: `${(k * 42) + (i % 2 === 1 ? 21 : 0) + 2}px`,
                                                                                             top: `${(i * 36) + 38}px`
                                                                                         }}>
                                                                                        <div className="hex-background">
                                                                                            {c &&
                                                                                                <Tippy content={championToolTip(c)} placement={"bottom"}>
                                                                                                    <img
                                                                                                        src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/champions/${c.champion}.png`}
                                                                                                        // onMouseEnter={e => onChampionHover(e, c)} onMouseLeave={onChampionMouseLeave}
                                                                                                    />
                                                                                                </Tippy>
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    </>
                                                                )
                                                            })}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            {mode !== "overlay" &&
                                                <div className={"tft-guides"}>
                                                    <div className={"tft-guide-btn"} onClick={onClickGuideButton}>
                                                        <img src={`https://opgg-desktop-data.akamaized.net/assets/images/tft/tft-icon-link.svg`}
                                                             style={{marginRight: "4px"}}/> {t("tft-guide-btn")}
                                                    </div>
                                                </div>
                                            }
                                            <div className="tft-guide-modal-layer-info-youtube-channel" style={{
                                                position: "absolute",
                                                right: "16px",
                                                top: "66px"
                                            }}>
                                                {youtube &&
                                                    <a href={youtube.channelUrl} target={"_blank"} onClick={() => {
                                                        sendGA4Event("click_tft_youtube_channel", {
                                                            title: d.title,
                                                            // tier: d.tier,
                                                            channel: youtube.channelUrl,
                                                            channel_name: youtube.channelName
                                                        });
                                                    }}>
                                                        {/*<div*/}
                                                        {/*    className="tft-guide-modal-layer-info-youtube-channel-info btn-channel-youtube"*/}
                                                        {/*    style={{*/}
                                                        {/*        marginRight: "8px",*/}
                                                        {/*        padding: "0 4px",*/}
                                                        {/*        borderRadius: "4px"*/}
                                                        {/*    }}>*/}
                                                        {/*<div>*/}
                                                        {/*<img style={{*/}
                                                        {/*    width: "24px",*/}
                                                        {/*    height: "24px",*/}
                                                        {/*    borderRadius: "50%"*/}
                                                        {/*}} src={youtube?.channelThumbnail}/></div>*/}
                                                        {/*</div>*/}
                                                        <div
                                                            className="tft-guide-modal-layer-info-youtube-channel-twitch btn-channel-youtube">
                                                            <img src={"https://opgg-desktop-data.akamaized.net/assets/images/icon-youtube-wh.svg"}/>
                                                            <span>{youtube.channelName}</span>
                                                        </div>
                                                    </a>
                                                }
                                                {twitch &&
                                                    <a href={twitch.channelUrl} target={"_blank"} onClick={() => {
                                                        sendGA4Event("click_tft_twitch_channel", {
                                                            title: d.title,
                                                            // tier: d.tier,
                                                            channel: twitch.channelUrl,
                                                            channel_name: twitch.channelName
                                                        });
                                                    }}>
                                                        <div
                                                            className="tft-guide-modal-layer-info-youtube-channel-twitch btn-channel-twitch">
                                                            <img src={"https://opgg-desktop-data.akamaized.net/assets/images/icon-twitch.svg"}/>
                                                            <span>{twitch.channelName}</span>
                                                        </div>
                                                    </a>
                                                }
                                            </div>

                                        </div>
                                    </>
                                );
                            } else {
                                return (
                                    <div className={"tft-row tft-row-overlay"}>
                                        <div style={{
                                            display: "flex",
                                            flexDirection: "column"
                                        }}>
                                            <div style={{
                                                fontSize: 12,
                                                marginBottom: 16,
                                                fontWeight: "bold"
                                            }}>{localStorage.getItem("i18n") === "kr" ? d.title.kr : d.title.en}</div>
                                            <div className={"tft-champions tft-champions-overlay"}>
                                                {d.buildboards.final.map((c: any, i: any) => {
                                                    if (c.name !== "비취 조각상") {
                                                        return (
                                                            <div className={"tft-champion"}>
                                                                {c?.three &&
                                                                    <div style={{
                                                                        position: "absolute",
                                                                        top: "-18px"
                                                                    }}>
                                                                        <img
                                                                            src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/assets/images/star${c.championCost}.svg`}/>
                                                                    </div>
                                                                }
                                                                <Tippy content={championToolTip(c)}
                                                                       disabled={championTooltipDisabled}
                                                                       placement={"bottom"}>
                                                                    <div className={`tft-cost tft-cost-${c.championCost}`}>
                                                                        <img
                                                                            src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/champions/${c.champion}.png`}/>
                                                                        <div
                                                                            className={`tft-cost-area tft-cost-area-${c.championCost} `}>${c.championCost}</div>
                                                                    </div>
                                                                </Tippy>
                                                                <div className={"tft-items"}>
                                                                    {(c.item1.id !== 0 && c.item1.id !== null) &&
                                                                        <Tippy content={itemToolTip(c.item1)}
                                                                               placement={"bottom"}>
                                                                            <div className={"tft-item"}
                                                                                 onMouseEnter={() => {
                                                                                     setChampionTooltipDisabled(true);
                                                                                 }} onMouseLeave={() => {
                                                                                setChampionTooltipDisabled(false);
                                                                            }}>
                                                                                <img
                                                                                    src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item1.id}.png`}/>
                                                                            </div>
                                                                        </Tippy>
                                                                    }
                                                                    {(c.item2.id !== 0 && c.item2.id !== null) &&
                                                                        <Tippy content={itemToolTip(c.item2)}
                                                                               placement={"bottom"}>
                                                                            <div className={"tft-item"}
                                                                                 onMouseEnter={() => {
                                                                                     setChampionTooltipDisabled(true);
                                                                                 }} onMouseLeave={() => {
                                                                                setChampionTooltipDisabled(false);
                                                                            }}>
                                                                                <img
                                                                                    src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item2.id}.png`}/>
                                                                            </div>
                                                                        </Tippy>
                                                                    }
                                                                    {(c.item3.id !== 0 && c.item3.id !== null) &&
                                                                        <Tippy content={itemToolTip(c.item3)}
                                                                               placement={"bottom"}>
                                                                            <div className={"tft-item"}
                                                                                 onMouseEnter={() => {
                                                                                     setChampionTooltipDisabled(true);
                                                                                 }} onMouseLeave={() => {
                                                                                setChampionTooltipDisabled(false);
                                                                            }}>
                                                                                <img
                                                                                    src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item3.id}.png`}/>
                                                                            </div>
                                                                        </Tippy>
                                                                    }
                                                                </div>
                                                                <div
                                                                    className={"tft-champion-name"}>{localStorage.getItem("i18n") === "kr" ? c.name : c.nameEN}</div>
                                                            </div>
                                                        )
                                                    }
                                                })}
                                            </div>
                                            <div style={{
                                                fontSize: 12,
                                                marginBottom: 20,
                                                marginTop: 36,
                                                fontWeight: "bold"
                                            }}>{t("tft-build")}</div>
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginTop: -22
                                            }}>
                                                {["early", "middle", "final"].map((time) => {
                                                    return (
                                                        <div style={{
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            justifyContent: "space-between",
                                                        }}>
                                                            <div style={{
                                                                // position: "absolute",
                                                                marginTop: 8,
                                                                // marginLeft: 8,
                                                                marginBottom: 4,
                                                                fontSize: 10,
                                                                color: "#7b7a8e"
                                                            }}>{t(`tft-${time}-build`)}</div>
                                                            <div className={"chess-container2"}>
                                                                {Array.from(Array(4).keys()).map((i) => {
                                                                    return (
                                                                        <>
                                                                            <div className={"chess-row"}>
                                                                                {Array.from(Array(7).keys()).map((k) => {
                                                                                    let c = _.find(d.buildboards[time], {xy: `${i}-${k}`});
                                                                                    return (
                                                                                        <div className={`hex ${c && `hex-${c.championCost}`}`}
                                                                                             style={{
                                                                                                 left: `${(k * 22) + (i % 2 === 1 ? 11 : 0) + 5}px`,
                                                                                                 top: `${(i * 19) + 9}px`
                                                                                             }}>
                                                                                            <div className="hex-background">
                                                                                                {c &&
                                                                                                    <Tippy content={championToolTip(c)} placement={"bottom"}>
                                                                                                        <img
                                                                                                            src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/champions/${c.champion}.png`}
                                                                                                            // onMouseEnter={e => onChampionHover(e, c)} onMouseLeave={onChampionMouseLeave}
                                                                                                        />
                                                                                                    </Tippy>
                                                                                                }
                                                                                            </div>
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        } else {
                            return (
                                <></>
                            )
                        }
                    })}
                </div>
                <GuideModal isGuideOpen={isGuideOpen} setIsGuideOpen={setIsGuideOpen} guideInfo={guideInfo} tftSet={tftSet} meta={meta} />
            </>
        )
    }

    return (
       <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%"
            }}><img src={"../../assets/images/contents_loading.gif"}/></div>
    )
}

interface GuideModalProps {
    isGuideOpen: boolean,
    setIsGuideOpen: React.Dispatch<React.SetStateAction<boolean>>,
    guideInfo: any,
    tftSet: string,
    meta: any
}

const GuideModal = ({isGuideOpen, setIsGuideOpen, guideInfo, tftSet, meta}: GuideModalProps) => {
    const {t} = useTranslation();

    useEffect(() => {
        document.getElementById("guide-text")?.scrollTop = 0;
        document.getElementById("tft-hexcore")?.scrollTop = 0;
    }, [guideInfo]);

    const onRequestClose = () => {
        setIsGuideOpen(false);
    }

    if (guideInfo) {
        let youtube = _.find(guideInfo.streamer, {"platform": "youtube"});

        return (
            <div className={`tft-guide-modal${isGuideOpen ? " tft-guide-modal__active" : ""}`} onClick={onRequestClose}>
                <div className="tft-guide-modal-layer" onClick={(e) => {
                    e.stopPropagation();
                }}>
                    <div className="tft-guide-modal-layer-title">
                        <h1>{localStorage.getItem("i18n") === "kr" ? guideInfo.title.kr : guideInfo.title.en}</h1>
                        {/*<div*/}
                        {/*    className={`tft-guide-modal-layer-title-difficulty tft-guide-modal-layer-title-difficulty__${guideInfo.difficulty.toLowerCase()}`}>{Capitalize(guideInfo.difficulty)}</div>*/}
                    </div>
                    {(localStorage.getItem("i18n") === "kr" ? guideInfo.text.kr : guideInfo.text.en) &&
                    <div className="tft-guide-modal-layer-text">
                        <h1>{t("tft-guide")}</h1>
                        <div id={"guide-text"}>{localStorage.getItem("i18n") === "kr" ? guideInfo.text.kr : guideInfo.text.en}</div>
                    </div>
                    }
                    <div className="tft-guide-modal-layer-info">
                        {(guideInfo.hexcore[0]?.id !== 0 || guideInfo.hexcore[1]?.id !== 0 || guideInfo.hexcore[2]?.id !== 0) &&
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                            }}>
                                <div
                                    style={{
                                        fontSize: 14,
                                        marginBottom: 8
                                    }}
                                >{t("tft-hexcore")}</div>
                                <div className="tft-guide-modal-layer-info-hextech" id={"tft-hexcore"}>
                                    <div>
                                        {guideInfo.hexcore.map((hexcore: any) => {
                                            if (hexcore.id !== 0) {
                                                let hx = _.find(meta.hexcores, {id: hexcore.id});

                                                return (
                                                    <div className={"tft-guide-modal-layer-info-hextech-container"}>
                                                        <div className={"tft-guide-modal-layer-info-hextech-img"}>
                                                            <img
                                                                src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/hexcores/${hexcore.id}.png`}/>
                                                        </div>
                                                        <div className={"tft-guide-modal-layer-info-hextech-info"}>
                                                            <div>{localStorage.getItem("i18n") === "kr" ? hexcore.name : hx.nameEN}</div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        })}
                                    </div>
                                </div>
                            </div>
                        }
                        {(guideInfo.youtube && youtube) &&
                        <div className="tft-guide-modal-layer-info-youtube">
                            <div className="tft-guide-modal-layer-info-youtube-title">
                                <img src={"https://opgg-desktop-data.akamaized.net/assets/images/icon-youtube.svg"}/>
                                <span>Youtube</span>
                            </div>
                            <a href={guideInfo.youtube.link} target={"_blank"} onClick={() => {
                                sendGA4Event("click_tft_youtube_video", {
                                    title: guideInfo.title,
                                    // tier: guideInfo.tier,
                                    channel: youtube?.channelUrl,
                                    channel_name: youtube?.channelName,
                                    video_url: guideInfo.youtube.link
                                });
                            }}>
                                <div className="tft-guide-modal-layer-info-youtube-video">
                                    <div className={"youtube-thumbnail"}>
                                        <img
                                            src={`https://img.youtube.com/vi/${guideInfo.youtube.link.split("?v=")[1]}/hqdefault.jpg`}/>
                                    </div>
                                    <img src={"https://opgg-desktop-data.akamaized.net/assets/images/icon-video.svg"} style={{
                                        position: "absolute"
                                    }}/>
                                </div>
                            </a>
                            <div>
                                <div className="tft-guide-modal-layer-info-youtube-desc">
                                    <h1>{guideInfo.youtube.title}</h1>
                                    <div>{guideInfo.youtube.desc}</div>
                                </div>
                                <div className="tft-guide-modal-layer-info-youtube-channel">
                                    <a href={guideInfo.youtubeChannel} target={"_blank"} onClick={() => {
                                        sendGA4Event("click_tft_youtube_channel", {
                                            title: guideInfo.title,
                                            // tier: guideInfo.tier,
                                            channel: youtube?.channelUrl,
                                            channel_name: youtube?.channelName,
                                        });
                                    }}>
                                        <div className="tft-guide-modal-layer-info-youtube-channel-info">
                                            <div><img style={{
                                                width: "24px",
                                                height: "24px",
                                                borderRadius: "50%"
                                            }} src={guideInfo.youtube?.thumbnailUrl}/></div>
                                            <span>{youtube.channelName}</span>
                                        </div>
                                    </a>
                                    {/*<a href={guideInfo.twitchChannel} target={"_blank"} onClick={() => {*/}
                                    {/*    sendGA4Event("click_tft_twitch_channel", {*/}
                                    {/*        title: guideInfo.title,*/}
                                    {/*        tier: guideInfo.tier,*/}
                                    {/*        channel: guideInfo.twitchChannel,*/}
                                    {/*        channel_name: guideInfo.twitchChannelName*/}
                                    {/*    });*/}
                                    {/*}}>*/}
                                    {/*    <div className="tft-guide-modal-layer-info-youtube-channel-twitch">*/}
                                    {/*        <img src={"https://opgg-desktop-data.akamaized.net/assets/images/icon-twitch.svg"}/>*/}
                                    {/*        <span>{guideInfo.twitchChannelName}</span>*/}
                                    {/*    </div>*/}
                                    {/*</a>*/}
                                </div>
                            </div>
                        </div>
                        }
                    </div>
                    <div className="tft-guide-modal-layer-close" onClick={onRequestClose}>
                        <img src={"https://opgg-desktop-data.akamaized.net/assets/images/icon-close-wh.svg"}/>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
        </>
    )
}

export default Tft;