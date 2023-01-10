import React, {useEffect, useState} from 'react';
import Modal from "react-modal";
import sendGA4Event from "../../utils/ga4";
import {useTranslation} from "react-i18next";
import _ from "lodash";
import Tippy from "@tippyjs/react";
import {useTypedSelector} from "../../redux/store";

const runesMetaData = require("../../../assets/data/meta/runes.json");

const customStyles = {
    overlay: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        top: "0",
        left: "0",
        width: "1280px",
        height: "720px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        position: "absolute",
        zIndex: "1000",
    },
    content : {
        display: "flex",
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: "500px",
        height: "380px",
        borderRadius: "12px",
        boxShadow: "0 18px 18px -15px rgba(0, 0, 0, 0.5), 0 9px 6px 0 rgba(0, 0, 0, 0.23)",
        border: "solid 1px #424254",
        background: "#31313c",
        padding: "0"
    }
};

const RuneImportModal = () => {
    const {t} = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState(null);
    const { summonerName } = useTypedSelector(state => state.common);

    useEffect(() => {
        const onIpcEvent = (event, data) => {
            sendGA4Event("view_rune_build_modal", {
                page_category: data?.type
            });
            setData(data);
            setIsOpen(true);
        };
        window.api.on("rune-imported", onIpcEvent);

        const hotkey = (e) => {
            if (e.key === "Escape") {
                onRequestClose();
            }
        }
        document.addEventListener("keyup", hotkey);

        return () => {
            window.api.removeListener("rune-imported", onIpcEvent);
            document.removeEventListener("keyup", hotkey);
        }
    }, []);

    useEffect(() => {
        console.log(summonerName);
    }, [summonerName]);

    const onRequestClose = () => {
        sendGA4Event("close_rune_build_modal", {

        });
        setIsOpen(false);
    }

    const applyBuild = () => {
        sendGA4Event("click_rune_build_modal_apply_button", {

        });
        window.api.send("setRuneFromDeeplink", data);
        onRequestClose();
    }

    if (data) {
        return (
            <Modal isOpen={isOpen}
                   style={customStyles}>
                <div className={"modal-notice champion-contents"} style={{
                    height: 0,
                    position: "relative"
                }}>
                    <div className={"modal-notice__header"}>
                        <div>{t("build-import")}</div>
                        <div className={"close"} onClick={() => {
                            onRequestClose();
                        }}  style={{top: 0}}>
                            <div className={"esc"}>ESC</div>
                            <img src={"../../assets/images/icon-close-notice-modal.svg"} />
                        </div>
                    </div>
                    <div className={"modal-notice__content champion-perk-container"} style={{
                        backgroundImage: "none",
                        backdropFilter: "none",
                        marginTop: 0
                    }}>
                        <div className={"title"}>[ {t(`perks.${data.selectedPerkIds[0]}.name`)} + {t(`perkStyles.${data.subStyleId}.name`)} ]<br />{t("build-import-title")}</div>
                        <div className="champion-perk-page" style={{
                            width: 300,
                            marginTop: 28
                        }}>
                            <div className="champion-perk-page-left">
                                <div className="champion-perk-page-left-top">
                                    {
                                        _.sortBy(_.filter(runesMetaData.data, {
                                            page_id: data.primaryStyleId,
                                            slot_sequence: 0
                                        }), [(o) => {
                                            return o.rune_sequence;
                                        }])?.map((rune) => {
                                            return (
                                                <Tippy content={<div
                                                    dangerouslySetInnerHTML={{__html: t(`perks.${rune.id}.tooltip`)}}/>}>
                                                    <div
                                                        className={`perk-image-wrapper ${data.selectedPerkIds[0] === rune.id ? "" : "img-gray"}`}>
                                                        <img
                                                            src={`${rune.image_url}?image=c_scale,q_auto,w_20`}/>
                                                    </div>
                                                </Tippy>
                                            )
                                        })
                                    }
                                </div>
                                <div className="champion-perk-page-left-bottom">
                                    {[1, 2, 3].map((i) => {
                                        return (
                                            <>
                                                <div
                                                    className={"champion-perk-page-row"}>
                                                    {
                                                        _.sortBy(_.filter(runesMetaData.data, {
                                                            page_id: data.primaryStyleId,
                                                            slot_sequence: i
                                                        }), [(o) => {
                                                            return o.rune_sequence;
                                                        }])?.map((rune) => {
                                                            return (
                                                                <Tippy content={
                                                                    <div
                                                                        dangerouslySetInnerHTML={{__html: t(`perks.${rune.id}.tooltip`)}}/>}>
                                                                    <img
                                                                        className={`${data.selectedPerkIds.includes(rune.id) ? "" : "img-gray"}`}
                                                                        src={`${rune.image_url}?image=c_scale,q_auto,w_24`}/>
                                                                </Tippy>
                                                            )
                                                        })
                                                    }
                                                </div>
                                            </>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="champion-perk-page-right">
                                {[1, 2, 3].map((i, index) => {
                                    return (
                                        <>
                                            <div
                                                className={"champion-perk-page-row"}>
                                                {
                                                    _.sortBy(_.filter(runesMetaData.data, {
                                                        page_id: data.subStyleId,
                                                        slot_sequence: i
                                                    }), [(o) => {
                                                        return o.rune_sequence;
                                                    }])?.map((rune) => {
                                                        return (
                                                            <Tippy content={<div
                                                                dangerouslySetInnerHTML={{__html: t(`perks.${rune.id}.tooltip`)}}/>}>
                                                                <img
                                                                    className={`${data.selectedPerkIds.includes(rune.id) ? "" : "img-gray"}`}
                                                                    src={`${rune.image_url}?image=c_scale,q_auto,w_20`}/>
                                                            </Tippy>
                                                        )
                                                    })
                                                }
                                            </div>
                                        </>
                                    )
                                })}
                                {
                                    [[5008, 5005, 5007], [5008, 5002, 5003], [5001, 5002, 5003]].map((shards, index) => {
                                        return (
                                            <>
                                                <div
                                                    className={"champion-perk-page-row champion-perk-page-row-shard"}>
                                                    {shards.map((shard) => {
                                                        return (
                                                            <Tippy content={<div
                                                                dangerouslySetInnerHTML={{__html: t(`perks.${shard}.tooltip`)}}/>}>
                                                                <img
                                                                    className={`${data.selectedPerkIds[index+6] === shard ? "" : "img-gray"}`}
                                                                    src={`https://opgg-static.akamaized.net/images/lol/perkShard/${shard}.png?image=c_scale,q_auto,w_16`}/>
                                                            </Tippy>
                                                        )
                                                    })}
                                                </div>
                                            </>
                                        )
                                    })
                                }
                            </div>
                        </div>
                        <div style={{
                            display: "flex",
                            marginTop: 32
                        }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                width: 80,
                                height: 32,
                                backgroundColor: "#7b7a8e",
                                borderRadius: 4,
                                marginRight: 8,
                                fontSize: 12,
                                cursor: "pointer"
                            }} onClick={() => {
                                onRequestClose();
                            }}>{t("btn-no")}</div>
                            <Tippy
                                showOnCreate={true}
                                disabled={summonerName !== null}
                                content={t("build-import-after-login")}
                            >
                                <div style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    width: 80,
                                    height: 32,
                                    backgroundColor: `${summonerName !== null ? "#5f32e6" : "#000"}`,
                                    borderRadius: 4,
                                    fontSize: 12,
                                    cursor: `${summonerName !== null ? "pointer" : "default"}`
                                }} onClick={() => {
                                    if (summonerName !== null) {
                                        applyBuild();
                                    }
                                }}>{t("btn-yes")}</div>
                            </Tippy>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    } else {
        return (
            <></>
        );
    }
}

export default RuneImportModal;