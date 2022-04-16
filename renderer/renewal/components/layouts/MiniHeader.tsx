import React from 'react';
import { useTypedSelector } from '../../../redux/store';
import {useTranslation} from "react-i18next";
import _ from 'lodash';
import {NavLink} from "react-router-dom";
import customToastr from "./../../../lib/toastr";
import {useDispatch} from "react-redux";
import { setAppMode } from '../../../redux/slices/common';
import * as reactGa from "react-ga";
// const { ipcRenderer } = globalThis.require('electron');

const MiniHeader = () => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const { appMode, summonerName, thumbnailUrl, lolCurrentGameQueue } = useTypedSelector(state => state.common);

    const onChangeAppMode = () => {
        const html = document.getElementsByTagName("html")[0];
        const changeAppMode = appMode === "full" ? "mini" : "full";
        html.classList[changeAppMode === 'mini' ? 'add' : 'remove']('mini');
        window.api.send("change-app-mode-react", changeAppMode);
        localStorage.setItem("app_mode", changeAppMode);
        dispatch(setAppMode(changeAppMode));
    };

    return (
        <>
            <header  id="app-header-win" className="app-header">
                <div className="game-select">
                    <img width="32px" height="32px" src="../../assets/images/opgg-logo-square.svg" />
                    {/*<img width="16px" height="16px" src="../../assets/images/icon-down.svg" className="down-arrow" />*/}
                    <img width="24px" height="24px" src="../../assets/images/img-sidebar-lol.svg" style={{marginLeft: "8px"}} />
                    <div style={{
                        marginLeft: "4px",
                        fontSize: "12px",
                        fontWeight: "normal"
                    }}>League of Legends</div>
                </div>

                {lolCurrentGameQueue !== -9999 &&
                <div className={"current-game-mode-badge"} style={{marginRight: "auto"}}>{t(`queue.${lolCurrentGameQueue}`)}</div>
                }

                <div className="title-bar-tools">
                    <div className="sidebar-toggle sidebar-toggle-win tool-wrapper" onClick={onChangeAppMode}>
                        <img alt="sidebar" src="../../assets/images/icon-group.svg"/>
                    </div>
                </div>
            </header>
        </>
    )
}

export default MiniHeader;
