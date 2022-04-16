import React, {ChangeEvent, FC, FormEvent, useCallback, useEffect, useState} from 'react';
import {useTypedSelector} from "../../redux/store";
import Modal from "react-modal";
import {setFeedbackIsOpen} from "../../redux/slices/common";
import {useDispatch} from "react-redux";
import {useTranslation} from "react-i18next";
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
        width: "450px",
        height: "238px",
        borderRadius: "8px",
        boxShadow: "0 12px 24px 0 rgba(0, 0, 0, 0.5)",
        border: "solid 1px #424254",
        backgroundColor: "#1c1c1f"
    }
};

const FeedbackModal = () => {
    const dispatch = useDispatch();
    const {t} = useTranslation();

    const { feedbackIsOpen } = useTypedSelector(state => state.common);
    const [isOpen, setIsOpen] = useState(false);
    const [grade, setGrade] = useState(0);
    const [hoverGrade, setHoverGrade] = useState(0);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        setIsOpen(feedbackIsOpen);
    }, [feedbackIsOpen])

    const onClickGrade = (grade: number) => () => {
        setGrade(grade);
    }

    const onSubmit = (e: FormEvent<HTMLElement>) => {
        e.preventDefault()
    }

    const onClickButton = () => {
        localStorage.setItem("isSentFeedback", "true");
        setGrade(0);
        setFeedback("");
        window.api.send("send-feedback", {
            stars: grade,
            content: feedback
        });
        setIsOpen(false);
        dispatch(setFeedbackIsOpen(false));
    };

    const onChangeFeedback = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setFeedback(e.target.value)
    }

    const onRequestClose = () => {
        localStorage.setItem("gameCount", "0");
        setIsOpen(false);
        dispatch(setFeedbackIsOpen(false));
    }

    const onHoverGrade = (point: number) => () => {
        setHoverGrade(point);
    }

    const onBlurGrade = () => {
        setHoverGrade(0);
    }

    const isDisabled = grade === 0 || feedback.length === 0

    return (
        <Modal isOpen={isOpen}
               style={customStyles}>
            <div className="feedback-modal">
                <div className="feedback-modal__title">{t("feedback.title")}</div>
                <div className="feedback-modal__grade">
                    {[1,2,3,4,5].map(point => (
                        <span key={point} className="feedback-modal__grade-item" onClick={onClickGrade(point)} onMouseEnter={onHoverGrade(point)} onMouseLeave={onBlurGrade}>
                            <StarIcon isHover={point <= hoverGrade} isActive={point <= grade} />
                        </span>
                    ))}
                </div>
                <div className="feedback-modal__textarea" onSubmit={onSubmit}>
                    <textarea name="" id="" cols={30} rows={3} placeholder={t("feedback.placeholder")}
                              onChange={onChangeFeedback} value={feedback} />
                    <div className="feedback-modal__textarea-div" />
                    <button type="button" disabled={isDisabled} className="feedback-modal__textarea-submit" onClick={onClickButton}>{t("feedback.button")}</button>
                </div>
            </div>
            <button className="feedback-modal__close-btn" onClick={onRequestClose}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <g fill="none" fillRule="evenodd">
                        <g fill="#9AA4AF" fillRule="nonzero">
                            <g>
                                <g>
                                    <path d="M18.545 4L20 5.455 13.454 12 20 18.545 18.545 20 12 13.454 5.455 20 4 18.545 10.545 12 4 5.455 5.455 4 12 10.545 18.545 4z" transform="translate(-985 -225) translate(579 205) translate(406 20)"/>
                                </g>
                            </g>
                        </g>
                    </g>
                </svg>
            </button>
        </Modal>
    );
};

function StarIcon({isActive, isHover}: any) {

    let fill = isActive ? "#FFB900" : "#515163";
    if(isHover) {
        fill = isActive ? fill : "#775b23";
    }

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
            <g fill="none" fillRule="evenodd">
                <g fill={fill} fillRule="nonzero">
                    <g>
                        <g>
                            <path d="M24 33L13.42 38.562 15.44 26.781 6.881 18.438 18.71 16.719 24 6 29.29 16.719 41.119 18.438 32.56 26.781 34.58 38.562z" transform="translate(-668 -266) translate(579 205) translate(89 61)"/>
                        </g>
                    </g>
                </g>
            </g>
        </svg>
    )
}

export default FeedbackModal;
