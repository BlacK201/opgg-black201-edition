import React, {useEffect, useState} from "react";
// import Ramp from "../../../components/Ramp";
import sendGA4Event from "../../../utils/ga4";

const Ads = () => {
    const [isClickable, setIsClickable] = useState(true);
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36";

    useEffect(() => {
        sendGA4Event("view_side_ad_playwire", {
            "menu_name": "full",
            "region": "NA"
        });
        window.api.send("ignore-mouse", false);

        let webview = document.querySelector('webview');
        let allowClick = () => {
            setIsClickable(false);
            window.api.send("ignore-mouse", false);
        };
        let disallowClick = () => {
            webview?.loadURL("about:blank");
            window.api.send("ignore-mouse", false);
            setIsClickable(true);
        }
        webview?.addEventListener("media-started-playing", allowClick);
        webview?.addEventListener("media-paused", disallowClick);

        window.api.send("ad-attach", "https://dtapp-player.op.gg/two_med_recs_new.html");
        let adInterval = setInterval(() => {
            window.api.send("ad-reload");
        }, 60 * 15 * 1000);

        let webviewInterval = setInterval(() => {
            webview?.loadURL("https://dtapp-player.op.gg/video_ads_only.html");
            // webview?.loadURL("https://dtapp-player.op.gg/video_ads_only.html#zeusdebug;spotxchannelid=227363");
            setIsClickable(false);
        }, 60 * 1000);

        return () => {
            webview?.removeEventListener("media-started-playing", allowClick);
            webview?.removeEventListener("media-paused", disallowClick);
            clearInterval(adInterval);
            clearInterval(webviewInterval);
        }
    }, []);

    return (
        <>
            <div className={"side-ads"}>
                <div className={"side-ads-through"}
                     onMouseEnter={() => {
                         // console.log("enter");
                         if (isClickable) {
                             window.api.send("ignore-mouse", true);
                         }
                     }}
                     onMouseLeave={() => {
                         // console.log("leave");
                         if (isClickable) {
                             window.api.send("ignore-mouse", false);
                         }
                     }}>
                    <section>
                        <webview
                            allowpopups={"true"}
                            src="https://dtapp-player.op.gg/video_ads_only.html"
                            // src="https://dtapp-player.op.gg/video_ads_only.html#zeusdebug;spotxchannelid=227363"
                            useragent={userAgent}
                            httpreferrer={'https://op.gg'}
                            disablewebsecurity="false"
                            style={{ width: "316px" || '100vw', height: "173px" || '100vh' }}
                        />
                    </section>
                    {/*<Ramp*/}
                    {/*    // url="https://dtapp-player.op.gg/video_ads_only.html"*/}
                    {/*    url="https://dtapp-player.op.gg/video_ads_only.html#zeusdebug;spotxchannelid=227363"*/}
                    {/*    referrer="https://op.gg"*/}
                    {/*    height="173px"*/}
                    {/*    width="316px"*/}
                    {/*/>*/}
                </div>
                {/*<div className={"side-ads-content"}>*/}
                {/*    <div className={"ads-title"}>Advertisement</div>*/}
                {/*    <div className={"two-side-ads"}>*/}
                {/*        <Ramp*/}
                {/*            url="https://dtapp-player.op.gg/two_med_recs.html"*/}
                {/*            referrer="https://op.gg"*/}
                {/*            height="508px"*/}
                {/*            width="300px"*/}
                {/*        />*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>
        </>
    )
}

export default Ads;