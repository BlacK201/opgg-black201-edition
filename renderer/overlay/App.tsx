import React, {useEffect, useState} from "react";
import axios from "axios";
import _ from "lodash";
import {useTranslation} from "react-i18next";
import Tft from "../renewal/pages/tft";

const App = () => {
  const {t, i18n} = useTranslation();

  const positionMap = {
    TOP: "T",
    JUNGLE: "J",
    MIDDLE: "M",
    BOTTOM: "A",
    UTILITY: "S"
  };

  const [isTFT, setIsTFT] = useState(true);
  const [skillData, setSkillData] = useState([""]);
  const [level, setLevel] = useState(0);
  const [isHidden, setIsHidden] = useState(true);
  const [globalScale, setGlobalScale] = useState(1);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [scaleFactor, setScaleFactor] = useState(1);

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
      // console.log(data);
      setWidth(data.width);
      setHeight(data.height);
      setGlobalScale(data.globalScale);
      setScaleFactor(data.scaleFactor);
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

    window.api.on("init-overlay", (event, data) => {
      setIsHidden(false);
      setDiffHidden(false);
    });

    window.api.on("destroy-overlay", (event, data) => {
      setGameStats({
        cs: "0",
        gold: "0",
        time: 0,
        rank: "NONE",
        position: "M"
      });
      setLevel(0);
      setSkillData([""]);
      setIsHidden(true);
      setDiffHidden(true);
    });

    window.api.on("overlay-tft", (event, data) => {
      setIsTFT(data);
    });

    return () => {
      window.api.eventNames().forEach((channel) => {
        window.api.removeAllListeners(channel);
      });
    };
  }, []);

  return (
    <div className={"overlay-main"} style={{
      width: width/scaleFactor,
      height: height/scaleFactor
    }}>
      <div className={"main-interface"}
           style={{
             position: "absolute",
             bottom: 0,
             width: "455px",
             height: "182px",
             // border: "1px solid #000",
             left: "50%",
             transform: "translate(-50%, 0)",
             display: `${(isHidden || isTFT) ? "none" : "block"}`,
             zoom: `${((1 - 0.34 * (1-globalScale)) * height / 1080) * 1/scaleFactor}`
           }}>

        <div style={{
          position: "absolute",
          width: "50px",
          height: "50px",
          left: "3px",
          // border: "1px solid red",
          visibility: `${skillData[level] === "Q" ? "visible" : "hidden"}`
        }}>
          <img src={"https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/overlay-skill.png"}
               style={{
                  position: "absolute",
                  top: "-49px",
                  width: "71px",
                  left: "-12px"
               }} />
        </div>

        <div style={{
          position: "absolute",
          width: "52px",
          height: "50px",
          // border: "1px solid red",
          left: "69px",
          visibility: `${skillData[level] === "W" ? "visible" : "hidden"}`
        }}>
          <img src={"https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/overlay-skill.png"}
               style={{
                 position: "absolute",
                 top: "-49px",
                 width: "71px",
                 left: "-12px"
               }} />
        </div>

        <div style={{
          position: "absolute",
          width: "52px",
          height: "50px",
          // border: "1px solid red",
          left: "135px",
          visibility: `${skillData[level] === "E" ? "visible" : "hidden"}`
        }}>
          <img src={"https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/overlay-skill.png"}
               style={{
                 position: "absolute",
                 top: "-49px",
                 width: "71px",
                 left: "-12px"
               }} />
        </div>

        <div style={{
          position: "absolute",
          width: "50px",
          height: "50px",
          // border: "1px solid red",
          left: "200px",
          visibility: `${skillData[level] === "R" ? "visible" : "hidden"}`
        }}>
          <img src={"https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/overlay-skill.png"}
               style={{
                 position: "absolute",
                 top: "-49px",
                 width: "71px",
                 left: "-12px"
               }} />
        </div>
      </div>
      {(!diffHidden && !isTFT) &&
          <div className={"overlay-diff"} style={{
            zoom: 1/scaleFactor
          }}>
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

      {isTFT &&
          <div style={{
            color: "#fff"
          }}>
            <Tft mode={"overlay"} />
          </div>
      }
    </div>
  )
}

export default App;
