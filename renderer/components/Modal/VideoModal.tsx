import Modal from "react-modal";
import React from "react";

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
        top                   : '50%',
        left                  : '50%',
        right                 : 'auto',
        bottom                : 'auto',
        marginRight           : '-50%',
        transform             : 'translate(-50%, -50%)',
        backgroundColor       : "transparent",
        border                : "none",
        padding               : "50px 0",
    }
};

const VideoModal = ({ isOpen, onRequestClose, videoId }: {isOpen: boolean; onRequestClose: () => void; videoId: string;}) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            style={customStyles}
            contentLabel="Example Modal"
        >
            <div className="popup-layer">
                <div className="popup-close" onClick={onRequestClose}>Close</div>
                <div className="popup-video">
                    <iframe width="960" height="540"
                            src={`https://www.youtube.com/embed/${videoId}?hl=${localStorage.getItem("i18n") || "en"}`} frameBorder="0"
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen />
                </div>
            </div>
        </Modal>
    )
}

export default VideoModal;

