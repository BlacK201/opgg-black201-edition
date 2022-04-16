import React, {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
// const { shell } = globalThis.require('electron');
// import mixpanel from "../../../utils/mixpanel";
import {useDispatch} from "react-redux";
import {setIsErrorOpen} from "../../../redux/slices/common";
import {useTypedSelector} from "../../../redux/store";
import _ from "lodash";
// const { ipcRenderer } = globalThis.require('electron');
const championsMetaData = require("../../../../assets/data/meta/champions.json");


const Error = ({error, msgType, isMini, champion}: any) => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const { currentChampion } = useTypedSelector(state => state.common);

    useEffect(() => {
        // mixpanel.track("view_error_page", {
        //     "menu_name": isMini ? "mini": "full",
        //     "error": error,
        //     "msg_type": msgType
        // });

        return () => {

        }
    }, []);

    let msgTypes: any = {
        "isRip": t("rip"),
        "ingame": `${t("live.feature.ingame.reason3")}<br />(${t("live.feature.ingame.reason2")})`,
        "503": t("live.feature.ingame.reason3"),
        "ingameIssue": t("ingame-issue")
    }

    let imageSize: any = {
        "false": {
            "404": [400, 146],
            "403": [382, 146],
            "500": [367, 146],
            "503": [364, 146]

        },
        "true": {
            "404": [280, 102],
            "403": [266, 102],
            "500": [256, 102],
            "503": [254, 102]
        }
    }

    const onClickReport = () => {
        window.api.openExternal("https://discord.gg/eyZuBjKquN");
    }

    return (
        <div style={{width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontSize: "14px", textAlign: "center", padding: "0 20px"}}>
            {/*<div dangerouslySetInnerHTML={{__html: msgTypes[msgType]}} style={{fontSize: "15px"}}></div>*/}
            <img width={`${imageSize[isMini][error][0]*0.7}`} height={`${imageSize[isMini][error][1]*0.7}`} src={`../../assets/images/${error}.svg`} style={{marginTop: "40px", marginBottom: "44px"}} />
            <div style={{lineHeight: 1.71}} dangerouslySetInnerHTML={{__html: msgTypes[msgType]}}></div>
            {(msgType !== "a" && msgType !== "isRip") &&
            <div style={{marginTop: "12px"}}>{t("report1")} <span
                style={{fontWeight: "bold", color: "#42b8da", cursor: "pointer"}} onClick={onClickReport}>{t("report2")}</span>.
            </div>
            }
            {msgType === "isRip" &&
            <div className={"btn-more"} style={{marginTop: "12px"}}
                 onClick={() => {window.api.send("openChampionPage", {key: _.find(championsMetaData.data, {id: champion}).key});}}
            >Search {t(`champions.${champion}`)} on OP.GG <img src={"../../assets/images/icon-link.svg"} style={{marginLeft: "4px"}} /></div>
            }
            {(msgType === "ingame" || msgType === "ingameIssue") &&
            <div className={"btn-more"} style={{marginTop: "12px"}}
                 onClick={() => { window.api.send("openSummonerPage", true);}}
            >See "Live Game" data on OP.GG  <img src={"../../assets/images/icon-link.svg"} style={{marginLeft: "4px"}} /></div>
            }
        </div>
    )
}

export default Error;