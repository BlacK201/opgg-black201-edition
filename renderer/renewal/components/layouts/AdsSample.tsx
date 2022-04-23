import sendGA4Event from "../../../utils/ga4";
import React, {useEffect} from "react";
import Adsense from "../../../components/Adsense";

const AdsSample = () => {
    useEffect(() => {
        sendGA4Event("view_side_ad_other", {
            "menu_name": "full"
        });

        window.api.send("ad-attach", "https://dtapp-player.op.gg/kr_side_ad_new.html");
        let webviewInterval = setInterval(() => {
            window.api.send("ad-reload");
        }, 50 * 1000);

        return () => {
            clearInterval(webviewInterval);
        }
    }, []);

    return (<></>)

    return (
        <>
            <div className={"side-ads"}>
                <div className={"side-ads-through"}
                     onMouseEnter={() => {
                         // console.log("enter");
                         window.api.send("ignore-mouse", true);
                     }}
                     onMouseLeave={() => {
                         // console.log("leave");
                         window.api.send("ignore-mouse", false);
                     }}
                ></div>
                <div className={"side-ads-content"}>
                    <div className={"ads-title"}>Advertisement</div>

                    <div className={"two-side-ads"}>
                        {/*<Adsense*/}
                        {/*    url="https://dtapp-player.op.gg/kr_side_ad.html"*/}
                        {/*    referrer="https://op.gg"*/}
                        {/*    height="508px"*/}
                        {/*    width="300px"*/}
                        {/*/>*/}
                    </div>
                </div>
            </div>
        </>
    )
}

export default AdsSample;