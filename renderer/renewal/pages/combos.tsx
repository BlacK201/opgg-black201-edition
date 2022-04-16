import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import VideoModal from "../../components/Modal/VideoModal";
import _ from "lodash";
import "../sass/combos.scss";
import sendGA4Event from "../../utils/ga4";
import axios from "axios";
const championsMetaData = require("../../../assets/data/meta/champions.json");

const Combos = () => {
  const { t } = useTranslation();
  const [combos, setCombos] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      sendGA4Event("view_combo_page", {
        "menu_name": "full"
      });

      axios.get(`https://opgg-desktop-data.akamaized.net/combo_test.json?timestamp=${new Date().getTime()}`).then((res) => {
        res.data = _.map(res.data, (combo, key) => ({key, combo}));
        setCombos(res.data);
      });
    }

    return () => {
      isMounted = false;
    }
  }, []);

  const [searchChampion, setSearchChampion] = useState("");
  const onSearchChampionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLevel("all");
    setSearchChampion(e.target.value.toLowerCase());
    _setCombos(_.filter(combos, ({ key }) => {
      return t(`champions.${key}`).toLowerCase().indexOf(e.target.value.toLowerCase()) >= 0 || _.find(combos, {key: key})?.combo.championName.toLowerCase().indexOf(searchChampion) >= 0;
    }));
  };

  const _combos = _.filter(combos, ({ key }) => {
    return t(`champions.${key}`).toLowerCase().indexOf(searchChampion) >= 0 || _.find(combos, {key: key})?.combo.championName.toLowerCase().indexOf(searchChampion) >= 0;
  });

  const [__combos, _setCombos] = useState(_combos);

  // const tabItem = ["Official", "User", "Save"];
  // const [selectedTab, setSelectedTab] = useState("Official");

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState("");

  const onClickVideo = (video: any, id: string) => () => {
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

  const levelList = ["all", "basic", "medium", "hard", "expert", "impossible"];
  const [level, setLevel] = useState<string>();
  const [levelDrop, setLevelDrop] = useState(false);

  const onLevelItemClick = (level: string) => () => {
    setLevel(level);
    setLevelDrop(false);
  };

  const onLevelClick = () => {
    setLevelDrop(!levelDrop);
  };

  useEffect(() => {
    if (!level && combos) {
      setLevel("all");
    }
  }, [combos]);

  useEffect(() => {
    _setCombos(
      level === "all"
        ? _combos
        : _combos.map((c) => {
            return {
              ...c,
              ["combo"]: {
                ...c.combo,
                ["combos"]: c.combo.combos.filter(
                  (f) => level === f.comboLevel.toLowerCase()
                ),
              },
            };
          })
    );
  }, [level]);

  if (combos) {
    return (
        <div className="main-container combos">
          <div className="combos-header">
            <div>
              <div className="combos-searchbar">
                <input
                    type="text"
                    id="search"
                    value={searchChampion}
                    onChange={onSearchChampionChange}
                />
                <label htmlFor="search">
                  {searchChampion.trim() ? "" : t("live.feature.champion.search-champion")}
                </label>
                <img
                    src={require("../../../assets/images/icon_search.svg")}
                    alt="search"
                />
              </div>
              <div className="combos-options" style={{
                marginLeft: "0"
              }}>
                {/*<div className="combos-tab">*/}
                {/*  {tabItem.map((item) => (*/}
                {/*    <div*/}
                {/*      className="combos-tab-item"*/}
                {/*      key={item}*/}
                {/*      onClick={() => setSelectedTab(item)}*/}
                {/*      style={item === selectedTab ? { background: "#5f32e6" } : {}}*/}
                {/*    >*/}
                {/*      {item}*/}
                {/*    </div>*/}
                {/*  ))}*/}
                {/*</div>*/}
                <div className="combos-level">
                  <div className="combos-level-wrapper" onClick={onLevelClick}>
                    <span>{level}</span>
                    <img src={require("../../../assets/images/icon-down2.svg")}/>
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
          </div>
          <div className="combos-main">
            <div className="combos-champions">
              {__combos.map(({key, combo}, i: number) => {
                let metaData = _.find(championsMetaData.data, {id: key*1});
                if (combo.combos.length === 0) {
                  return null;
                }
                return (
                    <div key={i} className="combos-champion">
                      <div className="combos-champion-header">
                        <h1>{`${t(`champions.${key}`)}`}</h1>
                        <span>{`${combo.combos.length} Videos`}</span>
                      </div>
                      <div className="combos-videos">
                        {combo.combos.map((video, j: number) => (
                            <div key={j*1000} className="combos-video">
                              <div
                                  className="combos-video-image-wrapper"
                                  onClick={onClickVideo(video, metaData?.id)}
                              >
                                <div style={{position: "absolute", width: "100%", height: "100%", boxShadow: "0px 0px 12px 22px rgba(0,0,0,0.5) inset, 0px 0px 0px 1000px rgba(0,0,0,0.5)", borderRadius: "50%"}}>

                                </div>
                                <img
                                    // loading="lazy"
                                    className="combos-video-image"
                                    src={`http://ddragon.leagueoflegends.com/cdn/img/champion/splash/${metaData?.key}_0.jpg`}
                                />
                                <img
                                    className="combos-video-icon"
                                    src={require("../../../assets/images/icon-video.svg")}
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
                        ))}
                      </div>
                    </div>
                );
              })}
            </div>
          </div>
          <VideoModal
              isOpen={modalIsOpen}
              onRequestClose={onCloseVideo}
              videoId={selectedVideoId}
          />
        </div>
    );
  }

  return (
      <div></div>
  )
};

export default Combos;
