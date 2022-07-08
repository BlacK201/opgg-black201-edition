import sendGA4Event from "../../../utils/ga4";
import React, {useEffect, useState} from "react";
import Adsense from "../../../components/Adsense";

const KrAds = () => {
  const videoAdURL = "https://dtapp-player.op.gg/aniview_instream.html";

  const [isClickable, setIsClickable] = useState(true);

  useEffect(() => {
    sendGA4Event("view_side_ad", {
      "menu_name": "full",
      "region": "KR"
    });

    // let tmpTimeout = null;
    // window.api.send("ignore-mouse", false);
    // let webview = document.querySelectorAll('webview')[0];
    // let allowClick = () => {
    //   setIsClickable(false);
    //   window.api.send("ignore-mouse", false);
    // };
    // let disallowClick = () => {
    //   webview?.loadURL("about:blank");
    //   window.api.send("ignore-mouse", false);
    //   setIsClickable(true);
    //   tmpTimeout = setTimeout(() => {
    //     webview?.loadURL(videoAdURL);
    //     setIsClickable(false);
    //   }, 60 * 1000);
    // }
    // webview?.addEventListener("media-started-playing", allowClick);
    // webview?.addEventListener("media-paused", disallowClick);
    //
    // return () => {
    //   webview?.removeEventListener("media-started-playing", allowClick);
    //   webview?.removeEventListener("media-paused", disallowClick);
    //   clearTimeout(tmpTimeout);
    // }

    let tmpTimeout = setInterval(() => {
      let webview = document.querySelectorAll('webview')[0];
      webview.reload();
    }, 60 * 10 * 1000);

    return () => {
      clearTimeout(tmpTimeout);
    }
  }, []);

  return (
    <>
      <div className={"side-ads"}>
        <div className={"side-ads-through"}
             onMouseEnter={() => {
               if (isClickable) {
                 // window.api.send("ignore-mouse", true);
               }
             }}
             onMouseLeave={() => {
               if (isClickable) {
                 // window.api.send("ignore-mouse", false);
               }
             }}
        >
          <section>
            <webview
              allowpopups={"true"}
              src={videoAdURL}
              httpreferrer={'https://op.gg'}
              disablewebsecurity="false"
              style={{width: "400px" || '100vw', height: "225px" || '100vh'}}
            />
          </section>
        </div>
        <div className={"side-ads-content"}>
          {/*<div className={"ads-title"}>Advertisement</div>*/}

          <div className={"two-side-ads"} style={{
            display: "flex"
          }}>
           <Adsense
              url={""}
              referrer="https://www.op.gg"
              height="501px"
              width="300px"
              timeout="300"
            />
            <div style={{
              width: "100%",
              height: "100%"
            }}
                 onMouseEnter={() => {
                     window.api.send("ignore-mouse", true);
                 }}
                 onMouseLeave={() => {
                     window.api.send("ignore-mouse", false);
                 }}
            >
              <div style={{
                width: 92,
                height: 501
              }}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default KrAds;