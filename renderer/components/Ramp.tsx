/* eslint-disable prettier/prettier */
// @typescript-eslint/ban-ts-comment
import React, {useEffect} from 'react';

/**
 * @component
 * @param props
 * @returns HTML
 */
// Instead of object type, use Record with string key and unknown values
function Ramp(props: Record<string, unknown>) {
    const {
        url, // {String} URL for webview to load html site with ad units
        referrer, // {String} URL Referrer expected from the app (your publisher website within Ramp)
        width, // {String} Width of webview for the ad unit
        height // {String} Width of webview for the ad unit
    } = props;

    useEffect(() => {
        let webview = document.querySelector('webview');
        let webviewInterval = setInterval(() => {
            webview?.reload();
        }, 60 * 1000);

        return () => {
            clearInterval(webviewInterval);
        }
    }, []);

    return (
        <section>
          <webview
              allowpopups={"true"}
              src={ url || 'https://cdn.intergi.com/pubscripts/opgg/video.html' }
              httpreferrer={ referrer || 'https://op.gg'}
              disablewebsecurity="false"
              style={{ width: width || '100vw', height: height || '100vh' }}
          />
        </section>
    );
}

export default Ramp;
