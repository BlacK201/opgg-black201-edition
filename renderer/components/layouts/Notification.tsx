import React from 'react';
import {useTranslation} from "react-i18next";
import {useTypedSelector} from "../../redux/store";

const Notification = () => {
    const {t} = useTranslation();
    const { isAdminWarning } = useTypedSelector(state => state.common);

    if(!isAdminWarning) return null;

    return (
        <div className="top-banner" style={{ display: "flex"}}>
            {t("admin-warning")}
        </div>
    )
}

export default Notification;
