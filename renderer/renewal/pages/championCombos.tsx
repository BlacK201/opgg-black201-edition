import React, {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";

// const {ipcRenderer} = globalThis.require('electron');
import {useHistory, useLocation} from "react-router-dom";
import {useTypedSelector} from "../../redux/store";
import {setCombos} from "../../redux/slices/common";
import {useDispatch} from "react-redux";
import * as reactGa from "react-ga";
import VideoModal from "../../components/Modal/VideoModal";
import _ from "lodash";
import Tippy from "@tippyjs/react";
import sendGA4Event from "../../utils/ga4";

const ChampionCombos = () => {
    const {t} = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const [combos, setCombos] = useState(null);

    const [data, setData] = useState<any>();
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState("");
    const [videoTooltipHoverId, setIsVideoTooltipHover] = useState<string>();

    let metaData: any = null;

    if (location.state) {
        metaData = location.state.metaData;
    }

    useEffect(() => {
        sendGA4Event("view_champion_combo_page", {
            "menu_name": "full"
        });
        if (metaData) {
            window.api.invoke("get-combos").then((tmp) => {
                setCombos(tmp);
                if (tmp[metaData.id] !== undefined) {
                    setData(tmp[metaData.id].combos);
                } else {
                    setData(null);
                }
            });
        }
    }, []);

    const onClickVideo = (video: any, id: string) => () => {
        // reactGa.event({
        //     category: "Combo",
        //     action: "Clicked",
        //     label: video,
        // });
        sendGA4Event("click_combo_video", {
            champion_id: id,
            video_id: video.videoId,
            video_name: video.videoName,
            difficulty: video.comboLevel,
        });
        setModalIsOpen(true);
        setSelectedVideoId(video.videoId);
    };

    const onCloseVideo = () => {
        setModalIsOpen(false);
    };

    const levelList = ["all", "Basic", "Medium", "Hard", "Impossible"];
    const [level, setLevel] = useState<string>(levelList[0]);
    const [levelDrop, setLevelDrop] = useState(false);

    const onLevelItemClick = (level: string) => () => {
        if (combos) {
            setLevel(level);
            setLevelDrop(false);

            if (level === "all") {
                setData(combos[metaData.id].combos);
            } else {
                setData(_.filter(combos[metaData.id].combos, {
                    comboLevel: level
                }));
            }
        }
    };

    const onLevelClick = () => {
        setLevelDrop(!levelDrop);
    };

    if (metaData && combos) {
        return (
            <div className={"champion-overview-combos"}>
                <div className="title-banner" style={{zIndex: 100}}>
                    <div className="champion-go-back" onClick={() => history.goBack()} style={{
                        left: "0", top: "20px"
                    }}>
                        <div className={"champion-go-back-button"}>
                            <img src={"../../assets/images/icon-arrow-prev.svg"}/>
                        </div>
                        <div style={{marginLeft: "12px"}}>{t("sidebar.tier")} / {t(`champions.${metaData.id}`)}</div>
                    </div>
                    <div className={"champion-overview-combos-champion-info"}>
                        <div style={{display: "flex"}}>
                            <div className={"champion-overview-combos-champion-info-image"}>
                                <img src={`${metaData.image_url}?image=w_102`} />
                            </div>
                            <div>
                                <div style={{marginTop: "8px", display: "flex", alignItems: "center"}}>
                                    <span style={{fontSize: "14px", fontWeight: "bold", marginRight: "8px"}}>{t(`champions.${metaData.id}`)} {t("live.feature.champion.combo-video")}</span>
                                    <span style={{display: "inline-flex", alignItems: "center"}}>
                                           <img
                                               width={16}
                                               height={16}
                                               src={"../../assets/images/icon-video.svg"}
                                               style={{marginRight: "4px"}}
                                           />
                                        {combos[metaData.id] ? combos[metaData.id].combos.length : 0}
                                    </span>
                                </div>
                                <div style={{marginTop: "4px", marginBottom: "12px", color: "#5d5a73"}}>Skills</div>
                                <div style={{display: "flex"}}>
                                    {["P", "Q", "W", "E", "R"].map((skill) => (
                                        <Tippy placement="bottom" content={<VideoTooltip isHover={videoTooltipHoverId === skill}
                                                                      championId={metaData.id}
                                                                      skillId={skill}/>}>
                                            <div className={`skills skills-bordered skills__${skill} skills__${skill}__tooltip`}
                                                 onMouseEnter={() => setIsVideoTooltipHover(skill)}
                                                 onMouseLeave={() => setIsVideoTooltipHover("")}
                                                style={{marginRight: "12px"}}
                                            >
                                                <img
                                                    src={`${t(`skills.${metaData.id}.${skill}.image_url`)}?image=c_scale,q_auto,w_28`}/>
                                                <div></div>
                                            </div>
                                        </Tippy>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="combos-level" style={{margin: "0 auto", marginTop: "24px"}}>
                            <div className="combos-level-wrapper" onClick={onLevelClick}>
                                <span>{level}</span>
                                <img src={"../../assets/images/icon-down2.svg"}/>
                            </div>
                            {levelDrop && (
                                <div className="combos-dropbox">
                                    {levelList
                                        .filter((levelItem) => levelItem !== level)
                                        .map((l) => (
                                            <div
                                                key={l}
                                                onClick={onLevelItemClick(l)}
                                                className="combos-dropbox-item"
                                            >
                                                {l}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="champion-overview-combos-videos">
                    {data
                        ? data.map((video: any, j: number) => (
                            <div key={j} className="champion-overview-combos-videos-video">
                                <div
                                    className="combos-video-image-wrapper"
                                    onClick={onClickVideo(video, metaData?.id)}
                                >
                                    <div style={{position: "absolute", width: "100%", height: "100%", boxShadow: "0px 0px 12px 22px rgba(0,0,0,0.5) inset, 0px 0px 0px 1000px rgba(0,0,0,0.5)", borderRadius: "50%"}}>

                                    </div>
                                    <img
                                        className="combos-video-image"
                                        src={`http://ddragon.leagueoflegends.com/cdn/img/champion/splash/${metaData.key}_0.jpg`}
                                    />
                                    <img
                                        className="combos-video-icon"
                                        src={"../../assets/images/icon-video.svg"}
                                    />
                                </div>
                                <div className="combos-video-body">
                                    <div className="combos-video-name">
                                        {video.videoName}
                                    </div>
                                    <div
                                        className={`combos-video-level combos-video-level__${video.comboLevel.toLowerCase()}`}
                                    >
                                        {video.comboLevel}
                                    </div>
                                    {/*<div className="combos-video-save">Save</div>*/}
                                </div>
                            </div>
                        ))
                        : <div>
                            No combo videos yet.
                        </div>
                    }
                </div>
                <VideoModal
                    isOpen={modalIsOpen}
                    onRequestClose={onCloseVideo}
                    videoId={selectedVideoId}
                />
            </div>
        )
    } else {
        return (
            <div></div>
        )
    }
}

function VideoTooltip({isHover, championId, skillId}: { isHover: boolean; championId: number; skillId: string }) {
    const {t} = useTranslation();
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (ref.current) ref.current[isHover ? 'play' : 'pause']();
    }, [isHover])

    return (<div>
        <div className='tooltip-title'>{t(`skills.${championId}.${skillId}.name`)} ({skillId})</div>
        <div
            dangerouslySetInnerHTML={{__html: t(`skills.${championId}.${skillId}.tooltip`).replace(/\\"/gi, "'").replace(/"/gi, "'")}}></div>
        <video ref={ref} className='champion-skill-video vjs-tech' loop preload='none'
               src={t(`skills.${championId}.${skillId}.video_url`)}>
            <source src={t(`skills.${championId}.${skillId}.video_url`)} type='video/mp4'/>
        </video>
    </div>);
}

export default ChampionCombos;