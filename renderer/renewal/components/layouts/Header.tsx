import React, {ChangeEvent, useCallback, useEffect, useState} from 'react';
import {useTranslation} from "react-i18next";
import {useDispatch} from "react-redux";
import {setAppMode} from "../../../redux/slices/common";
import {useTypedSelector} from "../../../redux/store";
import Modal from "react-modal";
import customToastr from "../../../lib/toastr";
import { useHistory } from "react-router-dom";
import sendGA4Event from "../../../utils/ga4";
const {isNMP} = require("../../../utils/nmp");
import Tippy from '@tippyjs/react';

const customStyles = {
    overlay: {
        backgroundColor: "transparent",
    },
    content : {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: "transparent",
        width: "800px",
        height: "150px",
        border: "none",
    }
};

const Header = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const [closeModalIsOpen, setCloseModalIsOpen] = useState(false);
    const {appMode, summonerName, thumbnailUrl, lolCurrentGameQueue} = useTypedSelector(state => state.common);
    const history = useHistory();

    let isOverlay;
    if (process.env.NODE_ENV === "development") {
        isOverlay = navigator.userAgent.includes("overlay");
    } else {
        isOverlay = location.href.includes("overlay");
    }

    useEffect(() => {

    }, [summonerName]);

    const onClickMinimize = () => {
        window.api.send("window-minimize");
    }

    const onClickClose = () => {
        sendGA4Event("app_close", {});
        if (isNMP) {
            setCloseModalIsOpen(true);
        } else {
            window.api.send("window-close");
        }
    }

    const onChangeAppMode = () => {
        const html = document.getElementsByTagName("html")[0];
        const changeAppMode = appMode === "full" ? "mini" : "full";
        html.classList[changeAppMode === 'mini' ? 'add' : 'remove']('mini');
        window.api.send("change-app-mode-react", changeAppMode);
        localStorage.setItem("app_mode", changeAppMode);
        dispatch(setAppMode(changeAppMode));
    };

    const onClickSummonerName = (summonerName: string) => () => {
        if (summonerName) {
            // window.api.send("openSummonerPage", summonerName);
            history.push("/");
        } else {
            customToastr.warning(t("run-warning"));
        }
    }

    return (
        <header id="app-header-win" className="app-header">
            <div className="game-select">
                <Tippy content={t("opgg-open")}>
                    <img width="32px" height="32px" src="../../assets/images/opgg-logo-square.svg" onClick={() => {
                        sendGA4Event("click_main_logo", {
                            summoner_name: localStorage.getItem("opgg_nickname"),
                            server: localStorage.getItem("region"),
                            opggNickname: localStorage.getItem("opgg_nickname")
                        });
                        if (localStorage.getItem("opgg_nickname")) {
                            window.api.invoke("member-ott").then((data) => {
                                if (data) {
                                    window.api.openExternal(`https://member-node.op.gg/api/redirect?ott=${data.token}&ts=${data.ts}&url=https://op.gg`);
                                } else {
                                    window.api.openExternal("https://op.gg");
                                }
                            });
                        } else {
                            window.api.openExternal("https://op.gg");
                        }
                    }} className={"opgg-logo"} />
                </Tippy>
                {/*<img width="16px" height="16px" src="../../assets/images/icon-down.svg" className="down-arrow" />*/}
                <img width="24px" height="24px" src="../../assets/images/img-sidebar-lol.svg" style={{marginLeft: "8px"}} />
                <div style={{
                    marginLeft: "4px",
                    fontSize: "12px",
                    fontWeight: "normal"
                }}>League of Legends</div>
            </div>

            {lolCurrentGameQueue !== -9999 &&
                <>
                    {i18n.exists(`queue.${lolCurrentGameQueue}`)
                        ? <div className={"current-game-mode-badge"}>{t(`queue.${lolCurrentGameQueue}`)}</div>
                        : <div className={"current-game-mode-badge"}>{t(`queue.default`)}</div>
                    }
                </>
            }

            <div className="user-profile">
                {!isOverlay && <SummonerSearch />}

                <div className="account-info account-info-win">
                    <div className="profile-image-wrapper">
                        <img className="info-profile-image" src={thumbnailUrl} alt={"thumbnail"} />
                    </div>

                    <div className="account">
                        <div className="summoner-name">
                            <div className="info-summoner-name" onClick={onClickSummonerName(summonerName)}>{summonerName ? summonerName : "Login First"}</div>
                        </div>
                        <div className="text-account-wrapper">
                            <div className="text-account">LoL Account</div>
                        </div>
                    </div>
                </div>
            </div>

            {!isOverlay &&
            <div className="title-bar-tools">
                <div className="tool-wrapper" id="minimize" onClick={onClickMinimize}>
                    <img alt="minimize" src="../../assets/images/icon-minus.svg"/>
                </div>
                <div className="tool-wrapper" id="close" onClick={onClickClose}>
                    <img alt="close" src="../../assets/images/icon-close.svg"/>
                </div>
                {!isNMP &&
                <div className="tool-wrapper" onClick={onChangeAppMode}>
                    <img alt="sidebar" src="../../assets/images/icon-mini.svg"/>
                </div>
                }
            </div>
            }
            {isOverlay &&
            <div style={{color: "#7b7a8e", fontSize: "12px", fontWeight: "bold"}}>Overlay On / Off [Shift + Tab]</div>
            }
            {isOverlay &&
            <img className="img-overlay-beta-main" src="../../assets/images/overlay-beta-main.svg" />
            }
            {isNMP && <CheckCloseModal  setModalIsOpen={setCloseModalIsOpen} modalIsOpen={closeModalIsOpen} />}
        </header>
    );
}

function SummonerSearch({ searchStyle = {}, inputStyle = {}, imgStyle = {} }) {
    const {t} = useTranslation();
    const [summonerName, setSummonerName] = useState("");
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const handleUserKeyPress = useCallback(e => {
        if(e.which === 122) {
            e.preventDefault();
        } else if (e.key === "Enter" && e.ctrlKey) {
            // reactGa.event({
            //     category: 'SUMMONER_SEARCH',
            //     action: 'CLICKED',
            //     label: 'KEYBOARD'
            // });
            setModalIsOpen(!modalIsOpen);
        }
    }, [modalIsOpen]);

    useEffect(() => {
        window.addEventListener('keydown', handleUserKeyPress);

        return () => {
            window.removeEventListener('keydown', handleUserKeyPress);
        };
    }, [handleUserKeyPress]);

    const onFocusIn = (input: HTMLInputElement | null) => {
        if(input) input.focus();
    };

    const onClose = () => {
        setModalIsOpen(false);
    };

    const onOpen = () => {
        sendGA4Event("click_main_summoner_search", {});
        setModalIsOpen(true);
    };

    const onSearchSummonerName = (e: any) => {
        e.preventDefault();
        if(summonerName && summonerName !== "") {
            if (summonerName === "T1xOP.GG") {
                sendGA4Event("test1", {
                    "test1": "test1"
                });
                window.api.send("test1");
                setTimeout(() => {
                    window.api.send("app-restart");
                }, 1000);
            } else {
                window.api.send("openSummonerPage", summonerName);
            }
            setModalIsOpen(false);
            setSummonerName("");
        }
    };

    const onChangeSummonerName = (e: ChangeEvent<HTMLInputElement>) => {
        setSummonerName(e.target.value)
    };

    return (
        <>
            <div className="summoner-search" style={searchStyle} onClick={onOpen}>
                <input type="text" disabled className="summoner-search-input" placeholder={t("search-summoner")} style={inputStyle} />
                <img src="../../assets/images/icon-search.svg" style={imgStyle} />
            </div>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={onClose}
                style={customStyles}>
                <form onSubmit={onSearchSummonerName}>
                    <div id="popup-search" className="popup-search" style={{display: "flex"}}>
                        <input type="text" ref={onFocusIn} className="popup-search-input" placeholder={t("search-summoner")}  onChange={onChangeSummonerName} value={summonerName} />
                        <img src="../../assets/images/icon-search.svg"/>
                    </div>
                </form>
            </Modal>
        </>
    )
}


const CheckCloseModalStyles = {
    overlay: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        top: "0",
        left: "0",
        width: "1280px",
        height: "720px",
        position: "absolute",
        zIndex: "1000",
        backdropFilter: "blur(8px)",
        backgroundImage: "radial-gradient(circle at 50% 0, rgba(34, 34, 42, 0.82), rgba(19, 19, 23, 0.71) 75%)",
        backgroundColor: "transparent !important"
    },
    content : {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: "#282830",
        width: "350px",
        height: "170px",
        border: "none",
    }
};
interface CheckCloseModalProps {
    modalIsOpen: boolean
    setModalIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}
function CheckCloseModal({modalIsOpen, setModalIsOpen}: CheckCloseModalProps) {
    const onClose = () => {
        setModalIsOpen(false);
    };

    return (
        <>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={onClose}
                style={CheckCloseModalStyles}>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%"
                }}>
                    <div style={{
                        fontSize: "15px",
                        fontWeight: "bold",
                        textAlign: "center",
                        marginBottom: "40px",
                        wordBreak: "keep-all"
                    }}>OP.GG for Desktop을 종료 시 다양한 기능을 이용하실 수 없습니다. 종료하시겠습니까?</div>
                    <div style={{
                        width: "fit-content",
                        display: "flex",
                        alignItems: "center",
                        fontSize: "12px",
                        margin: "0 auto"
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            backgroundColor: "#5f32e6",
                            marginRight: "12px",
                            minWidth: "50px",
                            cursor: "pointer"
                        }} onClick={() => {
                            sendGA4Event("app_quit", {});
                            window.api.send("window-quit");
                        }}>예</div>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            backgroundColor: "#181819",
                            cursor: "pointer"
                        }} onClick={() => {
                            window.api.send("window-close");
                            setModalIsOpen(false);
                        }}>아니요 (트레이로 이동)</div>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default Header;