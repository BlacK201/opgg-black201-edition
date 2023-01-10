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
        width: "500px",
        height: "320px",
        borderRadius: "12px",
        boxShadow: "0 18px 18px -15px rgba(0, 0, 0, 0.5), 0 9px 6px 0 rgba(0, 0, 0, 0.23)",
        border: "solid 1px #424254",
        background: "#31313c",
        padding: "0"
    }
};

const OWConsentModal = () => {
    const {t} = useTranslation();

    const [isOpen, setIsOpen] = useState(localStorage.getItem("ow-consent") === null);
    // const [isOpen, setIsOpen] = useState(true);


    useEffect(() => {
        const hotkey = (e) => {
            if (e.key === "Escape") {
                // sendGA4Event("close_notice_modal", {
                //     method: "hotkey"
                // });
                onRequestClose();
            }
        }
        document.addEventListener("keyup", hotkey);
        return () => {
            document.removeEventListener("keyup", hotkey);
        };
    }, []);

    // if (localStorage.getItem("new-notice")) {
    //     localStorage.removeItem("new-notice");
    // }

    const onRequestClose = () => {
        localStorage.setItem("ow-consent", "read");
        setIsOpen(false);
    }

    return (
        <Modal isOpen={isOpen}
               style={customStyles}>
            <div className={"modal-notice"}>
                <div className={"modal-notice__content"}>
                    <div className={"title"}>We value your privacy</div>
                    <div className={"notice-content"} style={{
                        marginTop: 24,
                        fontSize: 12,
                        letterSpacing: 1.1,
                        color: "#ddd"
                    }}>
                        OP.GG for Desktop may display in-app ads to help provide you with a free high-quality app. In order to deliver ads that are relevant for you, OP.GG for Desktop and trusted <span style={{textDecoration: "underline", cursor: "pointer"}} onClick={() => {window.api.invoke("ow-consent", {tab: "vendors"});}}>ad vendors</span> store and/or access information on your computer, and process personal data such as IP address and cookies. Click on the “Manage” button to control your consents, or to object to the processing of your data when done on the basis of legitimate interest. You can change your preferences at any time via the settings screen.
                        <br /><br />
                        Purposes we use: Store and/or access information on a device, personalised ads and content, ad and content measurement, audience insights and product development.
                    </div>
                    <div style={{
                        display: "flex",
                        position: "absolute",
                        right: 16,
                        bottom: 16
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
                            window.api.invoke("ow-consent", {});
                        }}>Manage</div>
                        <div style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: 130,
                            height: 32,
                            backgroundColor: "#5f32e6",
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: "pointer"
                        }} onClick={() => {
                            onRequestClose();
                        }}>Accept & Continue</div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default OWConsentModal;
