import Modal from "react-modal";
import React, {useEffect, useState} from "react";
import Ramp from "../Ramp";
import {useDispatch} from "react-redux";
import {useTranslation} from "react-i18next";
import {useTypedSelector} from "../../redux/store";
import {setPlaywireAdsIsOpen} from "../../redux/slices/common";
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

const PlaywireADs = () => {
    const dispatch = useDispatch();
    const {t} = useTranslation();

    const { playwireAdsIsOpen } = useTypedSelector(state => state.common);
    const [isOpen, setIsOpen] = useState(false);
    const [showCloseButton, setShowCloseButton] = useState(false);

    let counterInterval: any = null;
    let counter = 0;
    let adTimeout = 6;

    useEffect(() => {
        setIsOpen(playwireAdsIsOpen);
        if (playwireAdsIsOpen) {
            sendGA4Event("view_popup_ad", {
                "menu_name": "full"
            });
            counter = adTimeout;
            setTimeout(() => {
                setShowCloseButton(true);
            }, adTimeout * 1000);
            counterInterval = setInterval(() => {
                if (counter <= 0) {
                    clearInterval(counterInterval);
                }
                counter -= 1;
                document.getElementById("counter")?.innerText = counter;
            }, 1000);
        }
    }, [playwireAdsIsOpen])

    const onRequestClose = () => {
        setIsOpen(false);
        dispatch(setPlaywireAdsIsOpen(false));
        setShowCloseButton(false);
    }

    /*
      <Ramp
            url="https://developers.playwire.com/demos/pubs/opgg/leaderboard.html"
            referrer="https://op.gg"
            height="300px"
            width="728px"
        />
     */

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            style={customStyles}
            contentLabel="Advertisement"
            shouldCloseOnOverlayClick={false}
        >
            <div className="ads-popup-playwire-layer">
                <div style={{
                    position: "absolute",
                    left: "2px",
                    top: "52px",
                    fontSize: "12px",
                    color: "#777"
                }}>Advertisement</div>
                {showCloseButton
                    ? <div className="ads-popup-playwire-close" onClick={onRequestClose}>Close</div>
                    : <div className="ads-popup-playwire-close" id="counter">{adTimeout}</div>
                }
                <Ramp
                    // url="https://dtapp-player.op.gg/video.html"
                    url="https://dtapp-player.op.gg/video_ads_only.html"
                    // url="https://cdn.intergi.com/pubscripts/opgg/video.html"
                    // url="https://cdn.intergi.com/pubscripts/opgg/video.html#zeusdebug;spotxchannelid=227363"
                    referrer="https://op.gg"
                    height="360px"
                    width="640px"
                />
            </div>
        </Modal>
    )
}

export default PlaywireADs;

