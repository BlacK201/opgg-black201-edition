import React, {ChangeEvent, FC, FormEvent, useCallback, useEffect, useState} from 'react';
import {useTypedSelector} from "../../redux/store";
import Modal from "react-modal";
import {useDispatch} from "react-redux";
import {useTranslation} from "react-i18next";
import {setIsErrorOpen} from "../../redux/slices/common";
// const { ipcRenderer } = globalThis.require('electron');

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
        width: "360px",
        height: "272px",
        borderRadius: "8px",
        boxShadow: " 0 12px 11px -8px rgba(0, 0, 0, 0.67)",
        backdropFilter: "blur(8px)",
        backgroundImage: "radial-gradient(circle at 50% 0, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1) 83%)",
        border: "none",
        background: "none"
    }
};

const ErrorModal = () => {
    const dispatch = useDispatch();
    const {t} = useTranslation();

    const { isErrorOpen } = useTypedSelector(state => state.common);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(isErrorOpen);
    }, [isErrorOpen])

    const onRequestClose = () => {
        setIsOpen(false);
        dispatch(setIsErrorOpen(false));
    }

    return (
        <Modal isOpen={isOpen}
               style={customStyles}>
            <div className="feedback-modal">
                <div className="feedback-modal__title" style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    textAlign: "center"
                }}>
                    {t("rip")}
                </div>

                <div className="feedback-modal__textarea"></div>
            </div>
            <img src={"../../assets/images/icon-close-wh.svg"} onClick={onRequestClose} style={{
                position: "absolute",
                top: "16px",
                right: "16px"
            }} />
        </Modal>
    );
};

export default ErrorModal;
