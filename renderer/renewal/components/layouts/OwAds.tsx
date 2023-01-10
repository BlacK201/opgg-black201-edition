import sendGA4Event from "../../../utils/ga4";
import React, {useEffect} from "react";

const OWAds = () => {

    useEffect(() => {
        sendGA4Event("view_side_ad", {
            "menu_name": "full",
            "region": "OVERWOLF"
        });
    }, []);

    return (
        <>
            <div className={"side-ads"}>
                <div id="ads-container" style={{"width": "400px", "height": "300px", "background": "transparent"}} >
                    <owadview></owadview>
                </div>
            </div>
        </>
    )
}

export default OWAds;