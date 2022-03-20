import React from 'react';
import {useTranslation} from "react-i18next";

const NotSupported = () => {
    const {t} = useTranslation();

    // Edited By BlacK201
    return (
        <>
            <div style={{
                position: "relative",
                top: "50%",
                transform: "translate(0, -50%)",
                textAlign: "center"
            }} dangerouslySetInnerHTML={{__html: t("not-supported-region")}}>
            </div>
        </>
    )
}

export default NotSupported;
