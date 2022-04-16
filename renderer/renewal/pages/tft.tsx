import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import axios from "axios";
import _ from "lodash";
import {useDispatch} from "react-redux";
import {useTypedSelector} from "../../redux/store";
import Dropdown from "../components/common/Dropdown";
import Error from "../components/common/Error";
import sendGA4Event from "../../utils/ga4";

// const { ipcRenderer } = globalThis.require('electron');
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
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const Tft = () => {
    const { t } = useTranslation();
    const [data, setData] = useState<any>(false);
    const [openedIndex, setOpenedIndex] = useState<any>(-1);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [guideInfo, setGuideInfo] = useState<any>();
    const [tftSet, setTftSet] = useState("6.5");
    const [filter, setFilter] = useState<string>("all");
    const [dropboxContent, setDropboxContent] = useState([{
        value: "all",
        label: "계열 시너지",
        icon: "../../assets/images/tft/tft-synergy-any.svg"
    }]);
    const [dropboxContent2, setDropboxContent2] = useState([{
        value: "all",
        label: "직업 시너지",
        icon: "../../assets/images/tft/tft-synergy-any.svg"
    }]);
    const [selectedSynergy, setSelectedSynergy] = useState<DropdownOptionType>(dropboxContent[0]);
    const [selectedSynergy2, setSelectedSynergy2] = useState<DropdownOptionType>(dropboxContent2[0]);

    useEffect(() => {
        // window.api.send("tft-join");
        if (!data) {
            axios.get(`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/meta.json?timestamp=${new Date().getTime()}`).then((res) => {
                setTftSet(res.data.set);
                res.data?.traits.map((trait: any) => {
                    if (trait.isClass) {
                        setDropboxContent(dropboxContent => [...dropboxContent, {
                            value: trait.id,
                            label : trait.name,
                            icon: `https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/traits-wh/${trait.id}.svg`
                        }]);
                    } else if (trait.isOrigin) {
                        setDropboxContent2(dropboxContent2 => [...dropboxContent2, {
                            value: trait.id,
                            label : trait.name,
                            icon: `https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/traits-wh/${trait.id}.svg`
                        }]);
                    }
                });
            }).catch(() => {
            });
            axios.get(`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/recommend.json?timestamp=${new Date().getTime()}`).then((res) => {
                setData(res.data);
            }).catch(() => {
            });
        }

        sendGA4Event("view_tft_page", {
            "menu_name": "full"
        });

        return () => {
            // window.api.send("tft-quit");
        };
    }, []);

    if (data) {
        const filterData = [
            {
                title: "전체",
                id: "all",
                d: "M16.293 17.03a1.313 1.313 0 0 1-2.274 1.314l-2.144-3.717-2.144 3.717a1.313 1.313 0 1 1-2.274-1.313l2.145-3.718h-4.29a1.313 1.313 0 0 1 0-2.626h4.29L7.457 6.969a1.313 1.313 0 0 1 2.274-1.313l2.144 3.717 2.144-3.717a1.313 1.313 0 1 1 2.274 1.313l-2.145 3.718h4.29a1.313 1.313 0 1 1 0 2.626h-4.29l2.145 3.718z"
            },
            {
                title: "S 티어",
                id: "s",
                d: "M4.805 13.987c.125.11.384.289.777.54v1.503l5.013 2.917 1.405.724c1.105-.207 1.244-.233 1.809-.236h.272L12 20.666l-7.195-4.198v-2.482zM12.072 8c1.864 0 3.182 1.043 3.235 2.549h-1.664c-.082-.668-.704-1.113-1.559-1.113-.885 0-1.47.41-1.47 1.054 0 .522.404.82 1.394 1.031l1.02.217c1.699.358 2.431 1.09 2.431 2.403 0 1.705-1.307 2.748-3.428 2.748-2.015 0-3.322-.99-3.386-2.567h1.71c.082.686.774 1.125 1.77 1.125.92 0 1.57-.445 1.57-1.084 0-.539-.422-.85-1.459-1.072l-1.101-.234c-1.541-.323-2.297-1.125-2.297-2.414C8.838 9.049 10.12 8 12.072 8zM12 4l7.195 4.148v6.328A7.108 7.108 0 0 1 21 16.368c-.125-.058-.38-.162-.765-.313.477 1.053.54 2.607-1.165 3.008-4.079.96-9.414-1.692-11.432-3.058 1.025.417 3.115 1.088 4.045 1.387l-.631-.267c-.938-.318-3.1-1.69-4.918-2.912-1.649-1.11-2.941-2.504-3.134-2.744.276.075.51.12.702.138-.627-1.14.038-2.319 1.103-2.795v-.664L12 4zm0 .89L5.582 8.599v3.02c-.276-.263-.69-.94-.777-1.378-.276.2-.322.64-.15 1.077.745 1.898 4.183 4.388 5.525 5.28.636.37 1.115.607 1.436.713.321.106.947.286 1.876.54.92.185 1.78.297 2.582.334 3.472.163 3.71-.84 3.121-1.679l-2.006 1.166a6.367 6.367 0 0 1-1.504-.025l2.733-1.567V8.6L12 4.889z"
            },
            {
                title: "A 티어",
                id: "a",
                d: "M4.805 13.987c.125.11.384.289.777.54v1.503l5.013 2.917 1.405.724c1.105-.207 1.244-.233 1.809-.236h.272L12 20.666l-7.195-4.198v-2.482zM13.015 8l2.936 8.455h-1.916l-.639-2.016h-2.97l-.65 2.016H8L10.936 8h2.08zm-1.042 1.758h-.106l-1.06 3.316h2.214l-1.048-3.316zM12 4l7.195 4.148v6.328A7.108 7.108 0 0 1 21 16.368c-.125-.058-.38-.162-.765-.313.477 1.053.54 2.607-1.165 3.008-4.079.96-9.414-1.692-11.432-3.058 1.025.417 3.115 1.088 4.045 1.387l-.631-.267c-.938-.318-3.1-1.69-4.918-2.912-1.649-1.11-2.941-2.504-3.134-2.744.276.075.51.12.702.138-.627-1.14.038-2.319 1.103-2.795v-.664L12 4zm0 .89L5.582 8.599v3.02c-.276-.263-.69-.94-.777-1.378-.276.2-.322.64-.15 1.077.745 1.898 4.183 4.388 5.525 5.28.636.37 1.115.607 1.436.713.321.106.947.286 1.876.54.92.185 1.78.297 2.582.334 3.472.163 3.71-.84 3.121-1.679l-2.006 1.166a6.367 6.367 0 0 1-1.504-.025l2.733-1.567V8.6L12 4.889z"
            },
            {
                title: "B 티어",
                id: "b",
                d: "M4.805 13.987c.125.11.384.289.777.54v1.503l5.013 2.917 1.405.724c1.105-.207 1.244-.233 1.809-.236h.272L12 20.666l-7.195-4.198v-2.482zM12.697 8c1.64 0 2.62.803 2.62 2.11 0 .896-.663 1.675-1.53 1.804v.106c1.12.082 1.934.925 1.934 2.015 0 1.483-1.12 2.42-2.924 2.42H9V8zm-.392 4.7H10.77v2.402h1.576c1.02 0 1.57-.428 1.57-1.22 0-.773-.568-1.183-1.611-1.183zm-.059-3.346H10.77v2.15h1.33c.955 0 1.476-.393 1.476-1.072 0-.674-.486-1.078-1.33-1.078zM12 4l7.195 4.148v6.328A7.108 7.108 0 0 1 21 16.368c-.125-.058-.38-.162-.765-.313.477 1.053.54 2.607-1.165 3.008-4.079.96-9.414-1.692-11.432-3.058 1.025.417 3.115 1.088 4.045 1.387l-.631-.267c-.938-.318-3.1-1.69-4.918-2.912-1.649-1.11-2.941-2.504-3.134-2.744.276.075.51.12.702.138-.627-1.14.038-2.319 1.103-2.795v-.664L12 4zm0 .89L5.582 8.599v3.02c-.276-.263-.69-.94-.777-1.378-.276.2-.322.64-.15 1.077.745 1.898 4.183 4.388 5.525 5.28.636.37 1.115.607 1.436.713.321.106.947.286 1.876.54.92.185 1.78.297 2.582.334 3.472.163 3.71-.84 3.121-1.679l-2.006 1.166a6.367 6.367 0 0 1-1.504-.025l2.733-1.567V8.6L12 4.889z"
            }
        ];

        const onChampionHover = (e, chess) =>  {
            const { x, y, width, height } = e.target;
            const championBounds = {
                x,
                y,
                width,
                height
            }
            // ipcRenderer.send("tft-championHover", {
            //     championBounds,
            //     chess
            // });
        };

        const onChampionMouseLeave = () => {
            // ipcRenderer.send("tft-championMouseleave");
        };

        const onItemHover = (e, item) => {
            const { x, y, width, height } = e.target;
            const itemBounds = {
                x,
                y,
                width,
                height
            }
            // ipcRenderer.send("tft-itemHover", {
            //     itemBounds,
            //     item
            // });
        };

        const onItemMouseLeave = () => {
            // ipcRenderer.send("tft-itemMouseleave");
        };

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

        return (
            <>
                <div className={"tft-filter"}>
                    <div className={"tft-filter-tier"}>
                        {filterData.map(({title, id, d}) => (
                            <div className={`tft-filter-tier-item${filter === id ? " tft-filter-tier-item__active" : ""}`}
                                 onClick={() => {
                                     setOpenedIndex(-1);
                                     setFilter(id);
                                 }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d={d} fill={filter === id ? "#FFF" : "#7B7A8E"} fillRule="nonzero"/>
                                </svg>
                                <span>{title}</span>
                            </div>
                        ))}
                    </div>
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
                    {/*<div className={"tft-filter-synergy"}>*/}
                    {/*    <div className={"tft-filter-synergy-info"}>*/}
                    {/*        <img src={"../../assets/images/tft/tft-synergy-any.svg"} />*/}
                    {/*        <span>Any Synergy</span>*/}
                    {/*    </div>*/}
                    {/*    <img src={"../../assets/images/tft/tft-synergy-dropdown.svg"} />*/}
                    {/*</div>*/}
                </div>
                <div className={"tft-container"}>
                    {data.map((d:any, i:any) => {
                        // console.log(d);
                        let synergyCount = d.synergies.length;
                        if (synergyCount >= 9) {
                            synergyCount = 9;
                        }
                        let currentHexagon = 0;
                        let sortedSynergies =  _.sortBy(d.synergies, (e) => {
                            return e.id.split("-")[1];
                        }).reverse();
                        d.chess = _.sortBy(d.chess, "cost");
                        let coreChampions = _.filter(d.chess, {isCore: true});
                        let items: any = [];
                        for (let a = 1; a <=3; a++) {
                            _.filter(d.chess, (e) => {
                                return e[`item${a}`].id !== 0 && e[`item${a}`].id !== null;
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
                                title: d.title,
                                tier: d.tier,
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
                        }  else if (selectedSynergy2.value !== "all") {
                            let has = _.find(d.synergies, (e) => {
                                return e.id.split("-")[0] === selectedSynergy2.value;
                            });

                            if (has) {
                                hasSynergy = true;
                            }
                        } else {
                            hasSynergy = true;
                        }

                        return (
                            <>
                                <div className={`tft-row ${filter !== "all" ? d.tier.toLowerCase() === filter ? "" : "tft-row-hidden" : ""} ${hasSynergy ? "" : "tft-row-hidden"}`} key={i} onClick={() => {
                                    if (openedIndex === i) {
                                        setOpenedIndex(-1);
                                    } else {
                                        sendGA4Event("click_tft_row", {
                                            title: d.title,
                                            tier: d.tier,
                                            youtube_channel: d.youtubeChannel,
                                            youtube_channel_name: d.youtubeChannelName,
                                            twitch_channel: d.twitchChannel,
                                            twitch_channel_name: d.twitchChannelName,
                                        });
                                        setOpenedIndex(i);
                                    }
                                }}>
                                    <div className={"tier-column"}>
                                        <img src={`../../assets/images/tft/tft-rank-${d.tier.toLowerCase()}.svg`}/>
                                    </div>
                                    <div className={"title-column"}>
                                        <div>{d.title}</div>
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            marginTop: "8px"
                                        }}>
                                            <div className={`tft-difficulty tft-difficulty-${d.difficulty}`}>{Capitalize(d.difficulty)}</div>
                                            {d.youtube && <img src={"../../assets/images/icon-youtube-wh.svg"} style={{marginLeft: "8px"}} />}
                                        </div>
                                    </div>
                                    <div className={"hexagons"}>
                                        {Array.from(Array(synergyCount).keys()).map((i) => {
                                            currentHexagon += 1;
                                            let synergy = sortedSynergies[i].id.split("-");
                                            let style = synergy[1];
                                            synergy = synergy[0];
                                            return (
                                                <div className={`hexagon hexagon-${currentHexagon} hexagon-style-${style}`}>
                                                    <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/traits/${synergy}.svg`} />
                                                </div>
                                            )
                                        })}
                                        {Array.from(Array(9-synergyCount).keys()).map(() => {
                                            currentHexagon += 1;
                                            return (
                                                <div className={`hexagon hexagon-${currentHexagon} hexagon-style-0`}></div>
                                            )
                                        })}
                                    </div>
                                    <div className={"tft-champions"}>
                                        {d.chess.map((c: any, i: any) => {
                                            return (
                                                <div className={"tft-champion"}>
                                                    <div className={`tft-cost tft-cost-${c.cost}`}>
                                                        <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/champions/${c.champion}.png`} />
                                                    </div>
                                                    <div className={"tft-items"}>
                                                        {(c.item1.id !== 0 && c.item1.id !== null) &&
                                                        <div className={"tft-item"}>
                                                            <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item1.id}.png`} />
                                                        </div>
                                                        }
                                                        {(c.item2.id !== 0 && c.item2.id !== null) &&
                                                        <div className={"tft-item"}>
                                                            <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item2.id}.png`} />
                                                        </div>
                                                        }
                                                        {(c.item3.id !== 0 && c.item3.id !== null) &&
                                                        <div className={"tft-item"}>
                                                            <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item3.id}.png`} />
                                                        </div>
                                                        }
                                                    </div>
                                                    <div className={"tft-champion-name"}>{c.name}</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className={"show-more"}>
                                        {openedIndex === i
                                            ? <img src={"../../assets/images/tft/tft-arrow-up.svg"} />
                                            : <img src={"../../assets/images/tft/tft-arrow-down.svg"} />
                                        }

                                    </div>
                                </div>
                                <div className={"tft-row-expand"} style={{display: `${openedIndex === i ? "block": "none"}`}}>
                                    {!_.isEmpty(coreChampions)
                                        ?  <div>
                                            <div style={{fontSize: "12px", color: "#fff", fontWeight: "bold"}}>코어 챔피언</div>
                                            <div className={"tft-core-champions"}>
                                                {coreChampions.map((c) => {
                                                    // c["championName"] = t(`champions.${_.find(championsMetaData.data, (l) => {
                                                    //     return l.key.toLowerCase() === c.champion;
                                                    // })?.id}`);

                                                    return (
                                                        <>
                                                            <div className={`tft-core-champion tft-core-champion-${c.cost}`}>
                                                                <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/champions/${c.champion}.png`}
                                                                     // onMouseEnter={e => onChampionHover(e, c)} onMouseLeave={onChampionMouseLeave}
                                                                />
                                                            </div>
                                                            <div className={"tft-core-champion-items"}>
                                                                {(c.item1.id !== 0 && c.item1.id !== null) &&
                                                                <div className={"tft-item"}>
                                                                    <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item1.id}.png`}
                                                                         // onMouseEnter={e => onItemHover(e, {main: c.item1.id, from: c.item1.from})} onMouseLeave={onItemMouseLeave}
                                                                    />
                                                                </div>
                                                                }
                                                                {(c.item2.id !== 0 && c.item2.id !== null) &&
                                                                <div className={"tft-item"}>
                                                                    <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item2.id}.png`}
                                                                         // onMouseEnter={e => onItemHover(e, {main: c.item2.id, from: c.item2.from})} onMouseLeave={onItemMouseLeave}
                                                                    />
                                                                </div>
                                                                }
                                                                {(c.item3.id !== 0 && c.item3.id !== null) &&
                                                                <div className={"tft-item"}>
                                                                    <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${c.item3.id}.png`}
                                                                         // onMouseEnter={e => onItemHover(e, {main: c.item3.id, from: c.item3.from})} onMouseLeave={onItemMouseLeave}
                                                                    />
                                                                </div>
                                                                }
                                                            </div>
                                                        </>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        : <div style={{width: "100px", height: "66px"}}></div>
                                    }

                                    <div style={{display: "flex", marginTop: "32px"}}>
                                        <div className={"tft-item-combination-container"}>
                                            <div style={{fontSize: "12px", color: "#7b7a8e"}}>추천 아이템</div>
                                            <div className={`tft-item-combination`}>
                                                {Object.entries(newItems.duplicate).map(([k, items], d) => {
                                                    return (
                                                        <div className={"tft-item-combination-duplicate"}>
                                                            <div className={`tft-item-combination-0`}>
                                                                <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${k}.png`} />
                                                            </div>
                                                            <div>
                                                                <img src={"../../assets/images/tft/tft-item-plus.svg"} style={{width: "16px", height: "16px", margin: "4px 0", marginBottom: "0"}} />
                                                            </div>
                                                            <div>
                                                                {items.from.map((item) => {
                                                                    return (
                                                                        <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${item}.png`} style={{margin: "0 4px"}} />
                                                                    )
                                                                })}
                                                            </div>
                                                            <div>
                                                                <img src={"../../assets/images/tft/tft-item-equal.svg"} style={{width: "16px", height: "16px"}} />
                                                            </div>
                                                            <div>
                                                                {items.core.map((item, i) => {
                                                                    return (
                                                                        <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${item}.png`} style={{margin: "0 4px"}}
                                                                             // onMouseEnter={e => onItemHover(e, {main: item, from: [k, items.from[i]]})} onMouseLeave={onItemMouseLeave}
                                                                        />
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
                                                                <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${item.from[0]}.png`} />
                                                            </div>
                                                            <div>
                                                                <img src={"../../assets/images/tft/tft-item-plus.svg"} style={{width: "16px", height: "16px", margin: "4px 0", marginBottom: "0"}} />
                                                            </div>
                                                            <div>
                                                                <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${item.from[1]}.png`} />
                                                            </div>
                                                            <div>
                                                                <img src={"../../assets/images/tft/tft-item-equal.svg"} style={{width: "16px", height: "16px"}} />
                                                            </div>
                                                            <div>
                                                                <img src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/items/${item.id}.png`}
                                                                     // onMouseEnter={e => onItemHover(e, {main: item.id, from: item.from})} onMouseLeave={onItemMouseLeave}
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        <div className={"chess-container"}>
                                            {Array.from(Array(4).keys()).map((i) => {
                                                return (
                                                    <>
                                                        <div className={"chess-row"}>
                                                            {Array.from(Array(7).keys()).map((k) => {
                                                                let c = _.find(d.chess, {xy: `${i+1}-${k+1}`});
                                                                return (
                                                                    <div className={`hex ${c && `hex-${c.cost}`}`} style={{
                                                                        left: `${(k*42) + (i%2===1 ? 21 : 0)}px`,
                                                                        top: `${(i*36)}px`
                                                                    }}>
                                                                        <div className="hex-background">
                                                                            {c &&
                                                                            <img
                                                                                src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/champions/${c.champion}.png`}
                                                                                // onMouseEnter={e => onChampionHover(e, c)} onMouseLeave={onChampionMouseLeave}
                                                                            />
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
                                        {/* <div className={"tft-youtube"}>
                                        <div style={{marginBottom: "8px", display: "flex", alignItems: "center"}}><img src={`../../assets/images/tft/tft-icon-youtube.svg`} style={{marginRight: "4px"}} /> Youtube Video</div>
                                        <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                            <div style={{marginRight: "8px", cursor: "pointer"}}>
                                                <img src={`../../assets/images/tft/tft-icon-left.svg`} />
                                            </div>
                                            <a href={d.youtube} target={"_blank"}>
                                                <div className={"youtube-thumbnail"}>
                                                    <img src={`https://img.youtube.com/vi/${d.youtube.split("?v=")[1]}/hqdefault.jpg`} />
                                                </div>
                                            </a>
                                            <div style={{marginLeft: "8px", cursor: "pointer"}}>
                                                <img src={`../../assets/images/tft/tft-icon-right.svg`} />
                                            </div>
                                        </div>
                                    </div> */}
                                    </div>
                                    <div className={"tft-guide-btn"} onClick={onClickGuideButton}>
                                        <img src={`../../assets/images/tft/tft-icon-link.svg`} style={{marginRight: "4px"}} /> 공략 가이드
                                    </div>
                                    <div className="tft-guide-modal-layer-info-youtube-channel" style={{
                                        position: "absolute",
                                        right: "16px",
                                        top: "66px"
                                    }}>
                                        {d.youtubeChannel &&
                                        <a href={d.youtubeChannel} target={"_blank"} onClick={() => {
                                            sendGA4Event("click_tft_youtube_channel", {
                                                title: d.title,
                                                tier: d.tier,
                                                channel: d.youtubeChannel,
                                                channel_name: d.youtubeChannelName
                                            });
                                        }}>
                                            <div
                                                className="tft-guide-modal-layer-info-youtube-channel-info btn-channel-youtube"
                                                style={{
                                                    marginRight: "8px",
                                                    padding: "0 4px",
                                                    borderRadius: "4px"
                                                }}>
                                                <div><img style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    borderRadius: "50%"
                                                }} src={d.youtubeChannelThumbnail}/></div>
                                                <span>{d.youtubeChannelName}</span>
                                            </div>
                                        </a>
                                        }
                                        {d.twitchChannel &&
                                        <a href={d.twitchChannel} target={"_blank"} onClick={() => {
                                            sendGA4Event("click_tft_twitch_channel", {
                                                title: d.title,
                                                tier: d.tier,
                                                channel: d.twitchChannel,
                                                channel_name: d.twitchChannelName
                                            });
                                        }}>
                                            <div
                                                className="tft-guide-modal-layer-info-youtube-channel-twitch btn-channel-twitch">
                                                <img src={"../../assets/images/icon-twitch.svg"}/>
                                                <span>{d.twitchChannelName}</span>
                                            </div>
                                        </a>
                                        }
                                    </div>

                                </div>
                            </>
                        );
                    })}
                </div>
                <GuideModal isGuideOpen={isGuideOpen} setIsGuideOpen={setIsGuideOpen} guideInfo={guideInfo} tftSet={tftSet} />
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
    tftSet: string
}

const GuideModal = ({isGuideOpen, setIsGuideOpen, guideInfo, tftSet}: GuideModalProps) => {
    const dispatch = useDispatch();
    const {t} = useTranslation();

    const onRequestClose = () => {
        setIsGuideOpen(false);
    }

    if (guideInfo) {
        return (
            <div className={`tft-guide-modal${isGuideOpen ? " tft-guide-modal__active" : ""}`} onClick={onRequestClose}>
                <div className="tft-guide-modal-layer" onClick={(e) => {
                    e.stopPropagation();
                }}>
                    <div className="tft-guide-modal-layer-title">
                        <h1>{guideInfo.title}</h1>
                        <div
                            className={`tft-guide-modal-layer-title-difficulty tft-guide-modal-layer-title-difficulty__${guideInfo.difficulty}`}>{Capitalize(guideInfo.difficulty)}</div>
                    </div>
                    {guideInfo.text &&
                    <div className="tft-guide-modal-layer-text">
                        <h1>운영법</h1>
                        <div>{guideInfo.text}</div>
                    </div>
                    }
                    <div className="tft-guide-modal-layer-info">
                        {(guideInfo.hexcores[0].id !== 0 || guideInfo.hexcores[1].id !== 0 || guideInfo.hexcores[2].id !== 0) &&
                        <div className="tft-guide-modal-layer-info-hextech">
                            <h1>추천 증강체</h1>
                            <div>
                                {guideInfo.hexcores.map((hexcore: any) => {
                                    if (hexcore.id !== 0) {
                                        return (
                                            <div className={"tft-guide-modal-layer-info-hextech-container"}>
                                                <div className={"tft-guide-modal-layer-info-hextech-img"}>
                                                    <img
                                                        src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/tft/${tftSet}/hexcores/${hexcore.id}.png`}/>
                                                </div>
                                                <div className={"tft-guide-modal-layer-info-hextech-info"}>
                                                    <div>{hexcore.name}</div>
                                                </div>
                                            </div>
                                        )
                                    }
                                })}
                            </div>
                        </div>
                        }
                        {guideInfo.youtube &&
                        <div className="tft-guide-modal-layer-info-youtube">
                            <div className="tft-guide-modal-layer-info-youtube-title">
                                <img src={"../../assets/images/icon-youtube.svg"}/>
                                <span>Youtube</span>
                            </div>
                            <a href={guideInfo.youtube} target={"_blank"} onClick={() => {
                                sendGA4Event("click_tft_youtube_video", {
                                    title: guideInfo.title,
                                    tier: guideInfo.tier,
                                    channel: guideInfo.youtubeChannel,
                                    channel_name: guideInfo.youtubeChannelName,
                                    video_url: guideInfo.youtube
                                });
                            }}>
                                <div className="tft-guide-modal-layer-info-youtube-video">
                                    <div className={"youtube-thumbnail"}>
                                        <img
                                            src={`https://img.youtube.com/vi/${guideInfo.youtube.split("?v=")[1]}/hqdefault.jpg`}/>
                                    </div>
                                    <img src={"../../assets/images/icon-video.svg"} style={{
                                        position: "absolute"
                                    }}/>
                                </div>
                            </a>
                            <div>
                                <div className="tft-guide-modal-layer-info-youtube-desc">
                                    <h1>{guideInfo.youtubeTitle}</h1>
                                    <div>{guideInfo.youtubeDesc}</div>
                                </div>
                                <div className="tft-guide-modal-layer-info-youtube-channel">
                                    <a href={guideInfo.youtubeChannel} target={"_blank"} onClick={() => {
                                        sendGA4Event("click_tft_youtube_channel", {
                                            title: guideInfo.title,
                                            tier: guideInfo.tier,
                                            channel: guideInfo.youtubeChannel,
                                            channel_name: guideInfo.youtubeChannelName
                                        });
                                    }}>
                                        <div className="tft-guide-modal-layer-info-youtube-channel-info">
                                            <div><img style={{
                                                width: "24px",
                                                height: "24px",
                                                borderRadius: "50%"
                                            }} src={guideInfo.youtubeChannelThumbnail}/></div>
                                            <span>{guideInfo.youtubeChannelName}</span>
                                        </div>
                                    </a>
                                    <a href={guideInfo.twitchChannel} target={"_blank"} onClick={() => {
                                        sendGA4Event("click_tft_twitch_channel", {
                                            title: guideInfo.title,
                                            tier: guideInfo.tier,
                                            channel: guideInfo.twitchChannel,
                                            channel_name: guideInfo.twitchChannelName
                                        });
                                    }}>
                                        <div className="tft-guide-modal-layer-info-youtube-channel-twitch">
                                            <img src={"../../assets/images/icon-twitch.svg"}/>
                                            <span>{guideInfo.twitchChannelName}</span>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                        }
                    </div>
                    <div className="tft-guide-modal-layer-close" onClick={onRequestClose}>
                        <img src={"../../assets/images/icon-close-wh.svg"}/>
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