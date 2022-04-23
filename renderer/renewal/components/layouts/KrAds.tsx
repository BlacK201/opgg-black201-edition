import sendGA4Event from "../../../utils/ga4";
import React, {useEffect} from "react";
import Adsense from "../../../components/Adsense";

const KrAds = () => {
    useEffect(() => {
        sendGA4Event("view_side_ad_nitropay", {
            "menu_name": "full",
            "region": "KR"
        });
    }, []);

    return (<></>)

    return (
        <>
            <div className={"side-ads"}>
                <div className={"side-ads-through"}
                     onMouseEnter={() => {
                         window.api.send("ignore-mouse", true);
                     }}
                     onMouseLeave={() => {
                         window.api.send("ignore-mouse", false);
                     }}
                ></div>
                <div className={"side-ads-content"}>
                    <div className={"ads-title"}>Advertisement</div>

                    <div className={"two-side-ads"}>
                        <Adsense
                            url="https://dtapp-player.op.gg/adsense_wv.html"
                            referrer="https://www.op.gg"
                            height="508px"
                            width="300px"
                            timeout="600"
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default KrAds;