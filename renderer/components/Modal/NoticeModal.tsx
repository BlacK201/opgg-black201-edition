import React, {useState} from 'react';
import Modal from "react-modal";
import {useTranslation} from "react-i18next";

const customStyles = {
    overlay: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        top: "0",
        left: "0",
        width: "1280px",
        height: "720px",
        backdropFilter: "blur(8px)",
        backgroundImage: "radial-gradient(circle at 50% 0, rgba(34, 34, 42, 0.82), rgba(19, 19, 23, 0.71) 75%)",
        backgroundColor: "transparent !important",
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
        width: "360px",
        borderRadius: "8px",
        boxShadow: " 0 12px 11px -8px rgba(0, 0, 0, 0.67)",
        backgroundImage: "radial-gradient(circle at 50% 0, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1) 83%)",
        border: "none",
        background: "none"
    }
};

const ErrorModal = () => {
    const {t} = useTranslation();

    const [isOpen, setIsOpen] = useState(localStorage.getItem("new-notice2") === null);

    if (localStorage.getItem("new-notice")) {
        localStorage.removeItem("new-notice");
    }

    const onRequestClose = () => {
        localStorage.setItem("new-notice2", "read");
        setIsOpen(false);
    }

    return (
        <Modal isOpen={isOpen}
               style={customStyles}>
            <div className="feedback-modal">
                <div className="feedback-modal__title" style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    textAlign: "center"
                }}>
                    {t("new-overlay-notice-title")}
                </div>

                <div className="feedback-modal__textarea" style={{
                    marginTop: 20,
                    fontSize: 12,
                    display: "flex",
                    flexDirection: "column",
                    wordBreak: "keep-all"
                }}>
                    <div dangerouslySetInnerHTML={{__html: t("new-overlay-notice")}} />
                    <div style={{
                        margin: "0 auto",
                        fontWeight: "bold",
                    }}>
                        <div style={{
                            marginTop: 20,
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            padding: "6px 8px",
                            backgroundColor: "#5866ef",
                            borderRadius: "4px",
                            fontSize: 11
                        }} onClick={() => window.api.openExternal("https://discord.gg/hsSC7vDWU8")}>
                            <img src={"../../assets/images/icon-discord.svg"} style={{marginRight: 4}} /> {t("join-discord")}
                        </div>
                        <div style={{
                            marginTop: 12,
                            height: 36,
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            padding: "6px 8px",
                            backgroundColor: "#23272a",
                            borderRadius: "4px",
                            fontSize: 11,
                            justifyContent: "center"
                        }} onClick={onRequestClose}>
                            {t("overlay-setting.button")}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ErrorModal;
