import React, {useEffect, useState} from 'react';
import Modal from "react-modal";
import {useTranslation} from "react-i18next";
import sendGA4Event from "../../utils/ga4";

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
        width: "602px",
        height: "502px",
        borderRadius: "12px",
        boxShadow: "0 18px 18px -15px rgba(0, 0, 0, 0.5), 0 9px 6px 0 rgba(0, 0, 0, 0.23)",
        border: "solid 1px #424254",
        background: "#31313c",
        padding: "0"
    }
};

const ErrorModal = () => {
    const {t} = useTranslation();

    const [page, setPage] = useState(1);
    const [isOpen, setIsOpen] = useState(localStorage.getItem("new-notice2") === null);
    // const [isOpen, setIsOpen] = useState(true);

    // notice page size
    const totalPage = 5;

    useEffect(() => {
        const hotkey = (e) => {
            if (e.key === "Escape") {
                sendGA4Event("close_notice_modal", {
                    method: "hotkey"
                });
                onRequestClose();
            }
        }
        document.addEventListener("keyup", hotkey);
        return () => {
            document.removeEventListener("keyup", hotkey);
        };
    }, []);

    if (localStorage.getItem("new-notice")) {
        localStorage.removeItem("new-notice");
    }

    const onRequestClose = () => {
        localStorage.setItem("new-notice2", "read");
        setIsOpen(false);
    }

    const nextPage = () => {
        if (page < totalPage) setPage(page + 1);
        sendGA4Event("click_notice_modal_pagination", {
            direction: "next"
        });
    }

    const prevPage = () => {
        if (page !== 1) setPage(page - 1);
        sendGA4Event("click_notice_modal_pagination", {
            direction: "prev"
        });
    }

    let i18n = localStorage.getItem("i18n") ?? "en";

    return (
        <Modal isOpen={isOpen}
               style={customStyles}>
            <div className={"modal-notice"}>
                <div className={"modal-notice__header"}>
                    <div>{t("notice-header")}</div>
                    <div className={"close"} onClick={() => {
                        sendGA4Event("close_notice_modal", {
                            method: "click"
                        });
                        onRequestClose();
                    }}>
                        <div className={"esc"}>ESC</div>
                        <img src={"../../assets/images/icon-close-notice-modal.svg"} />
                    </div>
                </div>
                <div className={"modal-notice__content"}>
                    <div className={"title"} dangerouslySetInnerHTML={{__html: t(`notice${page}-title`)}}></div>
                    {/*<div style={{*/}
                    {/*    position: "relative",*/}
                    {/*    cursor: "pointer"*/}
                    {/*}} onClick={() => {*/}
                    {/*    if (i18n === "kr") {*/}
                    {/*        window.api.openExternal("https://www.youtube.com/watch?v=2hp4bS8aMGE");*/}
                    {/*    } else {*/}
                    {/*        window.api.openExternal("https://www.youtube.com/watch?v=8Uvkf8Z_frw");*/}
                    {/*    }*/}
                    {/*}}>*/}
                    {/*    <img style={{*/}
                    {/*        filter: "brightness(0.5)"*/}
                    {/*    }} className={"img-notice"} src={`../../assets/images/notice${page}${i18n !== "kr" ? "_en" : ""}.png`} />*/}
                    {/*    <img*/}
                    {/*        src={"../../assets/images/icon-youtube-red.svg"}*/}
                    {/*        width={96}*/}
                    {/*        height={96}*/}
                    {/*        style={{*/}
                    {/*            position: "absolute",*/}
                    {/*            top: 102-24,*/}
                    {/*            left: 230-24*/}
                    {/*        }}/>*/}
                    {/*</div>*/}
                    <img style={{
                        // filter: "brightness(0.5)"
                    }} className={"img-notice"} src={`../../assets/images/notice${page}${i18n !== "kr" ? "_en" : ""}.png`} />
                    <div className={"notice-content"} dangerouslySetInnerHTML={{__html: t(`notice${page}`)}} style={{
                        lineHeight: 1.6
                    }}></div>
                    {/*<div style={{*/}
                    {/*    position: "absolute",*/}
                    {/*    bottom: 16,*/}
                    {/*    backgroundColor: "#5f32e6",*/}
                    {/*    fontSize: 12,*/}
                    {/*    padding: "6px 8px",*/}
                    {/*    borderRadius: 4,*/}
                    {/*    display: "flex",*/}
                    {/*    alignItems: "center",*/}
                    {/*    fontWeight: "bold",*/}
                    {/*    cursor: "pointer"*/}
                    {/*}} onClick={() => {*/}
                    {/*    window.api.openExternal("https://discord.gg/DpEtHzRKPC");*/}
                    {/*}}><img width={16} style={{marginRight: 4}} src={"../../assets/images/icon-discord.svg"}/>{t("join-discord")}</div>*/}
                </div>
                {totalPage !== 1 &&
                    <div className={"modal-notice__pagination"}>
                        {[...Array(totalPage)].map((_, i) => {
                            return (
                                <div
                                    className={`notice-pager-dot ${page === i + 1 ? "notice-pager-dot-active" : ""}`}></div>
                            )
                        })}
                    </div>
                }
                {page !== 1 &&
                    <div className={"modal-notice__page-left"} onClick={prevPage}>
                        <img src={"../../assets/images/icon-page-prev.svg"}/>
                    </div>
                }
                {page !== totalPage &&
                    <div className={"modal-notice__page-right"} onClick={nextPage}>
                        <img src={"../../assets/images/icon-page-next.svg"}/>
                    </div>
                }
            </div>
        </Modal>
    );
};

export default ErrorModal;
