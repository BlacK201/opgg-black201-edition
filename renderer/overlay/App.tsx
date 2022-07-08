import React, {useEffect, useState} from "react";
import axios from "axios";
import _ from "lodash";
import {useTranslation} from "react-i18next";

const App = () => {
  const {t, i18n} = useTranslation();

  const baseResolution = 1920;
  const positionMap = {
    TOP: "T",
    JUNGLE: "J",
    MIDDLE: "M",
    BOTTOM: "A",
    UTILITY: "S"
  };

  const heightMul = 0.14136904761904761904761904761905;
  const iconSizeMul = 0.04861111111111111111111111111111;
  const iconMarginMul = 0.0125;
  const frameMul = 0.02986111111111111111111111111111;
  const frameMul2 = 0.00607638888888888888888888888889;

  const [skillData, setSkillData] = useState(["Q"]);
  const [level, setLevel] = useState(1);
  const [isHidden, setIsHidden] = useState(true);
  const [globalScale, setGlobalScale] = useState(1);
  const [resolutionScale, setResolutionScale] = useState(1);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [left, setLeft] = useState(1920 / 2 - ((3.5 * 1080 * iconSizeMul) + (3 * 1080 * iconMarginMul)));
  const [bottom, setBottom] = useState(heightMul * 1080);
  const [iconSize, setIconSize] = useState(0);
  const [iconMargin, setIconMargin] = useState(0);

  const [diffHidden, setDiffHidden] = useState(true);
  const [diffData, setDiffData] = useState({});
  const [gameStats, setGameStats] = useState({
    cs: "0",
    gold: "0",
    time: 0,
    rank: "NONE",
    position: "M"
  });

  useEffect(() => {
    axios.get(`https://opgg-desktop-data.akamaized.net/overlay/minute_avg_data.json?t=${new Date().getTime()}`).then((result) => {
      console.log(result.data);
      let tmp = result.data;
      tmp["NONE"] = tmp["null"];
      setDiffData(result.data);
    }).catch((_) => {
    });

    window.api.on("overlay-i18n", (event, data) => {
      console.log("i18n", data);
      localStorage.setItem("i18n", data);
      i18n.changeLanguage(data);
    });

    // summoner tier unranked = NONE
    // RANKED_FLEX_SR, RANKED_SOLO_5x5
    window.api.on("lol-diff", (event, data) => {
      // console.log(data);
      if (data.time === 0) {
        setGameStats({
          cs: "0.0",
          gold: "500.0",
          time: 0,
          rank: data.summoner.queueMap.RANKED_SOLO_5x5.tier === "NONE" ? data.summoner.queueMap.RANKED_SOLO_5x5.previousSeasonAchievedTier : data.summoner.queueMap.RANKED_SOLO_5x5.tier,
          position: positionMap[data.position] ?? "M"
        });
      } else {
        setGameStats({
          cs: (data.cs / (data.time / 60)).toFixed(1),
          gold: (data.gold / (data.time / 60)).toFixed(1),
          time: data.time / 60,
          rank: data.summoner.queueMap.RANKED_SOLO_5x5.tier === "NONE" ? data.summoner.queueMap.RANKED_SOLO_5x5.previousSeasonAchievedTier : data.summoner.queueMap.RANKED_SOLO_5x5.tier,
          position: positionMap[data.position] ?? "M"
        });
      }
    });

    window.api.on("lol-overlay-skill-size", (event, data) => {
      setResolutionScale(data / baseResolution);
      setWidth(data.width);
      setHeight(data.height);
      let tmpIconSize = (data.height * iconSizeMul) - (((data.height * iconSizeMul) - (data.height * iconSizeMul) * 0.66) / 100) * ((1 - data.globalScale) * 100);
      let tmpIconMargin = (data.height * iconMarginMul) - (((data.height * iconMarginMul) - (data.height * iconMarginMul) * 0.66) / 100) * ((1 - data.globalScale) * 100);
      let tmpHeight = (data.height * heightMul) - (((data.height * heightMul) - (data.height * heightMul) * 0.66) / 100) * ((1 - data.globalScale) * 100);
      setIconSize(tmpIconSize);
      setIconMargin(tmpIconMargin);
      setLeft(data.width / 2 - ((3.5 * (tmpIconSize)) + (3 * (tmpIconMargin))) - 3);
      setBottom(tmpHeight);
      setGlobalScale(data.globalScale);
    });

    window.api.on("lol-overlay-skill-globalScale", (event, data) => {
      // console.log(data);
      setGlobalScale(data);
    });

    window.api.on("lol-skill-data", (event, data) => {
      // console.log(data);
      setSkillData(data);
    });

    window.api.on("lol-levelup", (event, data) => {
      // console.log(data);
      setLevel(data);
    });

    window.api.on("lol-levelup-hide", (event, data) => {
      // console.log(data);
      setIsHidden(data);
    });

    window.api.on("lol-diff-hide", (event, data) => {
      console.log(data);
      setDiffHidden(data);
    });

    return () => {
      window.api.eventNames().forEach((channel) => {
        window.api.removeAllListeners(channel);
      });
    };
  }, []);

  return (
    <div>
      {!diffHidden &&
          <div className={"overlay-diff"}>
              <div className={"overlay-diff-header"}>
                  <div className={"overlay-diff-header__vs"}>
                      vs {gameStats.rank} ~{parseInt(gameStats.time)}{t("minutes")} <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "1px 8px",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        fontSize: "11px",
                        marginLeft: "8px",
                        color: "#fff",
                        backgroundColor: "#5f32e6"
                      }}
                  >βeta</div>
                  </div>
                  <div className={"overlay-diff-header__close"}></div>
              </div>
              <div className={"overlay-diff-body"}>
                  <div className={"overlay-diff-body__row"} style={{fontSize: "10px"}}>
                      <div className={"diff-value-label diff-value"}>{t("current")}</div>
                      <div className={`diff-diff-label diff-diff`}>{t("average")}</div>
                      <div className={"diff-title-label diff-title"}></div>
                  </div>
                  <div className={"overlay-diff-body__row"}>
                      <div className={"diff-value"}>{gameStats.cs}</div>
                      <div className={`diff-diff`}>{gameStats.time !== 0 ? (_.find(diffData[gameStats.rank], {
                        timestamp: gameStats.time.toString(),
                        position: gameStats.position
                      })?.cs / gameStats.time).toFixed(1) : 0}</div>
                      <div className={"diff-title"}>CS/Min</div>
                  </div>
                  <div className={"overlay-diff-body__row"}>
                      <div className={"diff-value"}>{gameStats.gold}</div>
                      <div className={`diff-diff`}>{gameStats.time !== 0 ? (_.find(diffData[gameStats.rank], {
                        timestamp: gameStats.time.toString(),
                        position: gameStats.position
                      })?.totalgold / gameStats.time).toFixed(1) : 0}</div>
                      <div className={"diff-title"}>Gold/Min</div>
                  </div>
              </div>
          </div>
      }
      <div className={"skill-levelup"} style={{
        "bottom": bottom - (iconSize) + (iconSize * 0.59090909090909090909090909090909) + height * frameMul + (0.19 * (globalScale) * 100),
        "left": left - (height * frameMul2) - (0.06 * (globalScale) * 100),
        "width": (((iconSize) * 4) + ((iconMargin) * 3)),
        "height": (iconSize),
        // border: "1px solid red"
      }}>
        {["Q", "W", "E", "R"].map((skill) => {
          return (
            <div style={{
              position: "relative",
              width: iconSize,
              height: iconSize,
              borderWidth: `${skillData[level] === skill ? "0" : "0"}`,
              display: `${isHidden ? "none" : "block"}`,
              visibility: `${skillData[level] === skill ? "visible" : "hidden"}`
            }}>
              <img
                style={{
                  position: "absolute",
                  width: iconSize,
                  top: 0,
                  left: 0,
                  zoom: 1.4
                }}
                src={"https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/overlay-skill.png"}/>
            </div>
          );
        })}
      </div>
    </div>
  )
}

export default App;
