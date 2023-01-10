import React, {ChangeEvent, useState} from "react";
import {useTranslation} from "react-i18next";
import sendGA4Event from "../../../utils/ga4";
import {useTypedSelector} from "../../../redux/store";

const RsoInput = ({memo, gameId}: any) => {
    const {t} = useTranslation();
    const [content, setContent] = useState<string>(memo);
    const [saveClicked, setSaveClicked] = useState(!!memo);
    const [saveClickedAfter, setSaveClickedAfter] = useState(!!memo);
    const [deleteClicked, setDeleteClicked] = useState(false);
    const [isFocus, setIsFocus] = useState(false);
    const {gpm} = useTypedSelector((state) => state.common);
    const limit = 50;

    const onChangeContent = (e: ChangeEvent<HTMLInputElement>) => {
        setSaveClicked(false);
        if (e.target.value.getBytes() <= limit) {
            setContent(e.target.value);
        } else {
            setContent(e.target.value.splitBytes(50));
        }
    }

    const onClickRemove = () => {
        setContent("");
        setDeleteClicked(false);
    }

    const onAdd = (enter=false) => {
        if (!saveClicked) {
            if (!enter) {
                sendGA4Event("click", {
                    screen_category: "mypage",
                    screen_name: "main",
                    screen_detail: JSON.stringify({
                        rso_mark: !!gpm?.is_auth ? "1" : "0",
                        rso_comment: !!gpm?.word ? "1" : "0",
                        rso_fan: !!gpm?.favorite_esport_team ? "1" : "0"
                    }),
                    event_result: "apply_edit",
                    label_category: "match_history",
                    label_name: "rso_memo_button",
                    op_gid: gameId
                });
            } else {
                sendGA4Event("enter", {
                    screen_category: "mypage",
                    screen_name: "main",
                    screen_detail: JSON.stringify({
                        rso_mark: !!gpm?.is_auth ? "1" : "0",
                        rso_comment: !!gpm?.word ? "1" : "0",
                        rso_fan: !!gpm?.favorite_esport_team ? "1" : "0"
                    }),
                    event_result: "apply_edit",
                    label_category: "match_history",
                    label_name: "rso_memo_bar",
                    op_gid: gameId
                });
            }

            window.api.invoke("rso-profile-put", {
                type: "memo",
                gameId: gameId,
                data: {
                    content: content
                }
            });
            setSaveClicked(true);
            setSaveClickedAfter(true);
            setDeleteClicked(false);
        }
    }

    return (
        <div style={{position: "relative", display: "flex", width: "100%"}}>
            <div style={{position: "relative", width: "100%"}}>
                <input className={"memo"} type={"text"} placeholder={t("rso.memo-placeholder")}
                       onChange={onChangeContent} value={content}
                       onFocus={(e) => {
                           setIsFocus(true);
                       }}

                       onBlur={() => {
                           setIsFocus(false);
                       }}

                       onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                               onAdd(true);
                               e.target.blur();
                           }
                       }}

                       onClick={() => {
                           sendGA4Event("click", {
                               screen_category: "mypage",
                               screen_name: "main",
                               screen_detail: JSON.stringify({
                                   rso_mark: !!gpm?.is_auth ? "1" : "0",
                                   rso_comment: !!gpm?.word ? "1" : "0",
                                   rso_fan: !!gpm?.favorite_esport_team ? "1" : "0"
                               }),
                               event_result: "activate_area",
                               label_category: "match_history",
                               label_name: "rso_memo_bar",
                               op_gid: gameId
                           });
                       }}

                       style={{
                           paddingRight: isFocus ? 80 : 32
                        }}
                />
                <img src={`../../assets/images/01-icon-icon-memo${content ? "-on": ""}.svg`} width={20}
                     style={{
                         position: "absolute",
                         left: 8,
                         top: 6
                     }}
                />
                {isFocus &&
                    <div
                        style={{
                            position: "absolute",
                            right: `${content !== "" ? "28px" : "12px"}`,
                            top: 10,
                            fontSize: 12,
                            color: "#5d5a73"
                        }}
                    >{content.getBytes()}/{limit}</div>
                }
                {content !== "" &&
                    <img src={"../../assets/images/icon-delete.svg"} width={16}
                         style={{
                             position: "absolute",
                             right: 8,
                             top: 9,
                             cursor: "pointer"
                         }}
                         onClick={onClickRemove}
                    />
                }
            </div>
            {(memo && !deleteClicked || saveClickedAfter) &&
                <div className={`memo-delete`}
                     onClick={() => {
                         sendGA4Event("click", {
                             screen_category: "mypage",
                             screen_name: "main",
                             screen_detail: JSON.stringify({
                                 rso_mark: !!gpm?.is_auth ? "1" : "0",
                                 rso_comment: !!gpm?.word ? "1" : "0",
                                 rso_fan: !!gpm?.favorite_esport_team ? "1" : "0"
                             }),
                             event_result: "apply_edit",
                             label_category: "match_history",
                             label_name: "rso_memo_delete_button",
                             op_gid: gameId
                         });
                         setContent("");
                         setDeleteClicked(true);
                         setSaveClicked(false);
                         setSaveClickedAfter(false);
                         window.api.invoke("rso-profile-delete", {
                             type: "memo",
                             gameId: gameId
                         });
                     }}
                >
                    {t("rso.delete")}
                </div>
            }
            <div className={`memo-save ${content ? "memo-save-active" : ""} ${saveClicked ? "memo-save-disabled" : ""} `}
                 onClick={() => {
                     onAdd();
                 }}
            >
                {t("rso.add")}
            </div>
        </div>
    )
}

export default RsoInput;