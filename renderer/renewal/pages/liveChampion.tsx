import React from "react";
import {useTranslation} from "react-i18next";
import Champions from "./champions";
import {useTypedSelector} from "../../redux/store";

const LiveChampion = () => {
    const { t } = useTranslation();
    const {champion} = useTypedSelector(state => state.common);

    if (champion) {
        return (
            <Champions champion={champion} />
        );
    }

    return (
        <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100%", flexDirection: "column", fontSize: "16px", color: "#ddd"}}>
            <video autoPlay muted loop width="600" height="337" style={{borderRadius: "12px", marginBottom: "48px"}}>
                <source  src={"../../assets/images/video-champion.mp4"}
                         type="video/mp4" />
            </video>
            <div>{t("usage.champion")}  <span style={{color: "#ff8e05", fontWeight: "bold"}}>{t("live.tab.champion")}</span> {t("usage.move")}</div>
        </div>
    )
}

export default LiveChampion;