/* eslint-disable prettier/prettier */
// @typescript-eslint/ban-ts-comment
import React, {useEffect} from 'react';

/**
 * @component
 * @param props
 * @returns HTML
 */
// Instead of object type, use Record with string key and unknown values
function Adsense(props: Record<string, unknown>) {
    const {
        url, // {String} URL for webview to load html site with ad units
        referrer, // {String} URL Referrer expected from the app (your publisher website within Ramp)
        width, // {String} Width of webview for the ad unit
        height, // {String} Width of webview for the ad unit
        timeout
    } = props;

    useEffect(() => {
        let webview = document.querySelectorAll('webview')[1];

        const loadPage = () => {
            webview.removeEventListener("dom-ready", loadPage);
            if (Math.random() < 0.5) {
                webview?.loadURL("https://dtapp-player.op.gg/adsense_wv_small.html");
            } else {
                if (Math.random() < 0.5) {
                    webview?.loadURL("https://dtapp-player.op.gg/smart_web_wv_small.html");
                } else {
                    webview?.loadURL("https://dtapp-player.op.gg/smart_web_wv_small.html");
                }
            }
        };
        webview.addEventListener("dom-ready", loadPage);

        let webviewInterval = setInterval(() => {
            webview?.reload();
        }, parseInt(timeout) * 1000);

        return () => {
            clearInterval(webviewInterval);
        }
    }, []);

    return (
        <section>
            <webview
                allowpopups={"true"}
                src={ "about:blank" }
                httpreferrer={ referrer || 'https://www.op.gg'}
                disablewebsecurity="false"
                style={{ width: width || '100vw', height: height || '100vh' }}
            />
        </section>
    );
}

export default Adsense;
