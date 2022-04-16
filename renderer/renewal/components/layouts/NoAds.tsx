import React, {useEffect, useState} from "react";

const NoAds = () => {
    useEffect(() => {
        window.api.send("ad-detach");
    }, []);

    return (
        <>
            <div className={"side-ads"}
                 onMouseEnter={() => {
                     // console.log("enter");
                     window.api.send("ignore-mouse", true);
                 }}
                 onMouseLeave={() => {
                     // console.log("leave");
                     window.api.send("ignore-mouse", false);
                 }}
            >
            </div>
        </>
    )
}

export default NoAds;