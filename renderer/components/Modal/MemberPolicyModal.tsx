import Modal from "react-modal";
import React from "react";
import {useTypedSelector} from "../../redux/store";
import {useDispatch} from "react-redux";
import {setMemberPolicyModalIsOpen} from "../../redux/slices/common";
import {useTranslation} from "react-i18next";

const customStyles = {
    overlay: {
        backgroundColor: "transparent",
        width: "1280px"
    },
    content : {
        top: '50%',
        left: '592px',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(0%, -50%)',
        width: "300px",
        height: "328px",
        borderRadius: "12px",
        boxShadow: "0 12px 24px 0 rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(8px)",
        background: "none",
        backgroundImage: "radial-gradient(circle at 50% 0, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1) 91%)",
        backgroundColor: "transparent !important",
        border: "none",
        padding: "0"
    }
};
const MemberPolicyModal = () => {
    const dispatch = useDispatch();
    const {t} = useTranslation();
    const { memberPolicyModalIsOpen } = useTypedSelector(state => state.common);

    return (
        <Modal
            isOpen={memberPolicyModalIsOpen}
            style={customStyles}
        >
            <div className="popup-content" style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "64px",
                    borderBottom: "1px solid #1c1c1f",
                    fontSize: "16px",
                    fontWeight: "bold"
                }}>{t("new-policy")}</div>
                <img src={"../../assets/images/opgg-logo.svg"} height={32} style={{margin: "36px 0"}} />
                <div style={{
                    fontSize: "14px",
                    padding: "0 16px",
                    lineHeight: 1.47,
                }}>{t("new-policy-desc")}</div>
                <div style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0 16px",
                    marginTop: "24px"
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "130px",
                        height: "32px",
                        backgroundColor: "#2b2b30",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: "#7b7a8e",
                        fontSize: "12px"
                    }} onClick={() => {
                        dispatch(setMemberPolicyModalIsOpen(false));
                        window.api.send("logout");
                    }}>{t("disagree")}</div>
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "130px",
                        height: "32px",
                        backgroundColor: "#5f32e6",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: "#fff",
                        fontSize: "12px"
                    }} onClick={() => {
                        dispatch(setMemberPolicyModalIsOpen(false));
                        window.api.send("memberPolicy");
                    }}>{t("accept")}</div>
                </div>
            </div>
        </Modal>
    )
}

export default MemberPolicyModal;

