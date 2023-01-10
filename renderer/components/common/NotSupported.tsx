import React from 'react';
import {useTranslation} from "react-i18next";

const NotSupported = () => {
    const {t} = useTranslation();

    return (
        <>
            <div style={{
                position: "relative",
                top: "50%",
                transform: "translate(0, -50%)",
                textAlign: "center"
            }}>{t("not-supported-region")}</div>
        </>
    )
}

export default NotSupported;
