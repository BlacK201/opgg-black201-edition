import React, {useEffect, useState} from "react";
import { NavLink, Link } from "react-router-dom";
import { useTypedSelector } from "../../../redux/store";
import {
  setTipChampion,
  setIngame,
  setEOG,
  setIsSettingOpen
} from "../../../redux/slices/common";
import { useDispatch } from "react-redux";
import {useTranslation} from "react-i18next";
import axios from "axios";
import Tippy from "@tippyjs/react";
// const { ipcRenderer, remote, shell } = globalThis.require("electron");
// const appVersion = remote.app.getVersion();
const {isNMP} = require("../../../utils/nmp");
// Edit By BlacK201
const {editionVersion} = require("../../../utils/edition_version");

const Side = () => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const [index, setIndex] = useState(localStorage.getItem("spell") ?? "f");
  const [version, setVersion] = useState("1.0.11");
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isTFTUpdated, setIsTFTUpdated] = useState(false);
  const [overlaySetting, setOverlaySetting] = useState(false);
  const [isOPChampionNew, setIsOPChampionNew] = useState(true);
  const { isLoLGameLive, isAutoSpell, onlineStatus } = useTypedSelector((state) => state.common);
  const [is420, setIs420] = useState(null);

  let opChampionTimeout = null;
  let lang = localStorage.getItem("i18n");

  let isOverlay;
  if (process.env.NODE_ENV === "development") {
    isOverlay = navigator.userAgent.includes("overlay");
  } else {
    isOverlay = location.href.includes("overlay");
  }

  const versionToInt = (version: string): number => {
    let v = version.split(".");
    return parseInt(v[0])*10000+parseInt(v[1])*100+parseInt(v[2]);
  };

  useEffect(() => {
    let isMounted = true;
    let ver = "";
    window.api.invoke("get-version").then((v) => {
      if (isMounted) {
        ver = v;
        setVersion(v);
        let latestYML = "latest.yml";
        if (window.api.platform() === "darwin") {
          latestYML = "latest-mac.yml"
        }
        axios.get(`https://desktop-patch.op.gg/${latestYML}`).then((res) => {
          let latestVersion = res.data.split("version: ")[1].split("\n")[0];
          if (versionToInt(v) < versionToInt(latestVersion)) {
            setIsUpdateAvailable(true);
          }
        }).catch(() => {})
      }
    });

    let updateInterval = setInterval(() => {
      axios.get("https://desktop-patch.op.gg/latest.yml").then((res) => {
        let latestVersion = res.data.split("version: ")[1].split("\n")[0];
        if (versionToInt(ver) < versionToInt(latestVersion)) {
          setIsUpdateAvailable(true);
        }
      }).catch(() => {})
    }, 3600 * 1000);

    let checkTFT = () => {
      axios.get(`https://desktop-app-data.op.gg/tft/8/recommend.json?timestamp=${new Date().getTime()}`).then((res) => {
        let currentTFTVersion = localStorage.getItem("tftVersion") ?? 1;
        if (currentTFTVersion != res.data.file_version) {
          localStorage.setItem("tftVersion", res.data.file_version);
          setIsTFTUpdated(true);
        }
      }).catch(() => {})
    }

    checkTFT();
    let tftInterval = setInterval(() => {
      checkTFT();
    }, 3600 * 1000);

    const fn = (event, data) => {
      setOverlaySetting(data);
    };
    window.api.on("overlay-setting", fn);

    const fn2 = (event, data) => {
      setIs420(data.is420);
    }
    window.api.on("is-solo-rank", fn2);

    return () => {
      isMounted = false;
      clearInterval(updateInterval);
      clearInterval(tftInterval);
      window.api.removeListener("overlay-setting", fn);
      window.api.removeListener("is-solo-rank", fn2);
    }
  }, []);

  window.onClickLiveTest = () => {
    // const dataIngame = require("../../../data/ingame2.json");
    //     dispatch(setMultisearch(dataMultisearch));
    // dispatch(setChampion(dataChampion));
    // dispatch(setIngame(dataIngame));
    dispatch(setTipChampion([
      {
        id: 523,
        key: "Aphelios"
      },{
        id: 266,
        key: "Aatrox"
      },{
        id: 55,
        key: "Katarina"
      },{
        id: 122,
        key: "Darius"
      },{
        id: 82,
        key: "Mordekaiser"
      }
    ]));
    window.api.send("get-op-score");
    // dispatch(setOverlaySettingIsOpen(true));
  };

  window.ingame = () => {
    const dataIngame = require("../../../data/eog3.json");
    dispatch(setIngame(dataIngame));
  };

  window.ingameNew = () => {
    const dataIngame = require("../../../data/ingame_new.json");
    dispatch(setIngame(dataIngame));
  }

  window.ingame2 = () => {
    const dataIngame = require("../../../data/test.json");
    dispatch(setIngame(dataIngame));
  };

  window.eog = () => {
    const dataEOG = require("../../../data/ingame3.json");
    dispatch(setEOG(dataEOG));
    window.api.send("get-op-score");
  };

  const hrefIcon = {
    setting: {
      d: "M9.267 1.333l.833 1.594c.478.182.924.423 1.328.715l1.712-.072 1.267 2.194-.799 1.257c.06.318.092.645.092.979 0 .334-.031.661-.092.979l.799 1.257-1.267 2.194-1.712-.072c-.404.292-.85.533-1.328.715l-.833 1.594H6.733L5.9 13.073c-.478-.182-.924-.423-1.328-.715l-1.712.072-1.267-2.194.799-1.257C2.332 8.661 2.3 8.334 2.3 8c0-.334.031-.661.092-.979l-.799-1.257L2.86 3.57l1.712.072c.404-.292.85-.533 1.328-.715l.833-1.594h2.534zm-.808 1.334h-.918l-.694 1.327-.474.18c-.365.139-.708.324-1.021.55l-.375.27-1.366-.058-.46.795.649 1.02-.098.518c-.046.24-.069.483-.069.731s.023.492.069.73l.098.519-.648 1.02.459.795 1.366-.057.375.27c.313.225.656.41 1.021.549l.474.18.694 1.327h.918l.694-1.327.474-.18c.365-.139.708-.324 1.021-.55l.375-.27 1.366.058.46-.795-.649-1.02.098-.518c.046-.24.069-.483.069-.731s-.023-.492-.069-.73L12.2 6.75l.648-1.02-.459-.795-1.366.057-.375-.27c-.313-.225-.656-.41-1.021-.549l-.474-.18-.694-1.327zM8 5.333c1.473 0 2.667 1.194 2.667 2.667 0 1.473-1.194 2.667-2.667 2.667-1.473 0-2.667-1.194-2.667-2.667 0-1.473 1.194-2.667 2.667-2.667zm0 1.334c-.736 0-1.333.597-1.333 1.333S7.264 9.333 8 9.333 9.333 8.736 9.333 8 8.736 6.667 8 6.667z",
      transform:
        "translate(-348.000000, -290.000000) translate(320.000000, 130.000000) translate(0.000000, 65.000000) translate(16.000000, 20.000000) translate(12.000000, 74.000000) translate(0.000000, 1.000000)",
    },
    champion: {
      d: "M14.126 8.168c0-1.421.559-8.125-6.098-8.166L7.97 0C1.314.043 1.873 6.747 1.873 8.168c0 1.426.238 2.822-.267 3.208-.505.386-.326.95.683 2.197 1.01 1.248 2.822 1.96 2.822 1.96V9.177c-.33-.109-.653-.304-.928-.587-.76-.783-.864-1.914-.231-2.529.63-.614 1.715-.43 2.52.305.32.292.543.738.643 1.083.14.436.156.902.156 1.47 0 .958.011 2.309.011 2.309 0 .87 1.434.87 1.434 0 0 0 .012-1.35.012-2.309 0-.568.016-1.034.156-1.47.1-.345.323-.791.643-1.083.805-.736 1.89-.92 2.52-.305.633.615.53 1.746-.23 2.53-.276.282-.599.477-.929.586v6.358s1.813-.713 2.822-1.96c1.01-1.248 1.188-1.812.683-2.198-.504-.386-.267-1.782-.267-3.208z",
      transform:
        "translate(-348.000000, -373.000000) translate(320.000000, 130.000000) translate(0.000000, 65.000000) translate(16.000000, 143.000000) translate(12.000000, 34.000000) translate(-0.000000, 1.000000)",
    },
    multisearch: {
      d: "M12 9v2H4V9h8zm0-4v2H4V5h8z",
      transform:
        "translate(-348.000000, -405.000000) translate(320.000000, 130.000000) translate(0.000000, 65.000000) translate(16.000000, 143.000000) translate(12.000000, 66.000000) translate(0.000000, 1.000000)",
    },
    inGame: {
      d: "M8 3C4.667 3 1.82 5.073.667 8c1.153 2.927 4 5 7.333 5s6.18-2.073 7.333-5c-1.153-2.927-4-5-7.333-5zm0 8.333C6.16 11.333 4.667 9.84 4.667 8S6.16 4.667 8 4.667 11.333 6.16 11.333 8 9.84 11.333 8 11.333zM8 6c-1.107 0-2 .893-2 2s.893 2 2 2 2-.893 2-2-.893-2-2-2z",
      transform:
        "translate(-348.000000, -437.000000) translate(320.000000, 130.000000) translate(0.000000, 65.000000) translate(16.000000, 143.000000) translate(12.000000, 98.000000) translate(0.000000, 1.000000)",
    },
    combo: {
      d: "M9.83075552,0 C10.7833363,-1.74986246e-16 11.5555556,0.77221928 11.5555556,1.72480004 L11.555,3.333 L16,1.66666667 L16,8.33333333 L11.555,6.666 L11.5555556,8.27519996 C11.5555556,9.22778072 10.7833363,10 9.83075552,10 L1.72480004,10 C0.77221928,10 1.16657498e-16,9.22778072 0,8.27519996 L0,1.72480004 C-1.16657498e-16,0.77221928 0.77221928,1.74986246e-16 1.72480004,0 L9.83075552,0 Z M4.4,3.07692308 L4.4,6.92307692 L8.4,5 L4.4,3.07692308 Z",
      transform:
        "translate(0.0 3.0)",
    },
    tier: {
      d: "M12.2248305,3 C13.2233013,4.31888503 13.8676188,6.02603368 13.9817776,7.89987144 L14,8.35000002 L14,8.64999998 L13.995,8.746 L13.9930825,8.87018511 C13.919554,10.8341577 13.2639981,12.6273584 12.2248305,14 L1.76966813,14 C0.774376777,12.6822027 0.132228936,10.972009 0.0182376786,9.10056847 L0.000760602593,8.69921392 L0,8.35000002 L0.00452426135,8.20047728 C0.0646772765,6.21169552 0.721246359,4.38814361 1.76966813,3 L12.2248305,3 Z M12.312673,10.2509075 L1.68680375,10.2504373 C1.85181038,11.0084347 2.12264009,11.7223904 2.48530491,12.3620581 L2.567,12.499 L11.428,12.499 L11.5121081,12.3600355 C11.8759052,11.7205689 12.1473171,11.0078743 12.312673,10.2509075 Z M3.41053393,4.49599827 L2.567,4.499 L2.4795614,4.6479967 C2.11889371,5.28630497 1.84933156,5.99780211 1.68534813,6.74962193 L12.3128912,6.75009166 C12.1610865,6.05473148 11.9197904,5.39671581 11.5995986,4.79848701 L11.5131819,5.10948968 C11.2546138,6.11985865 10.6368093,6.18879834 10.2633147,6.18879834 C9.91855046,6.18879834 9.40290545,5.97114796 9.13232225,5.41951204 L9.07002261,5.27457771 C8.82426727,4.61579398 8.54317177,4.53280033 8.19696369,4.53280033 C7.89403163,4.53280033 7.64950195,4.74877671 7.41943372,4.92314709 L7.12709206,5.13532649 C6.88744163,5.30367541 6.54650121,5.49122525 5.87607824,5.49122525 C5.02258309,5.49122525 4.09462453,4.53559139 3.41053393,4.49599827 Z M12.25,0 C12.9403559,0 13.5,0.44771525 13.5,1 C13.5,1.55228475 12.9403559,2 12.25,2 L1.75,2 C1.05964406,2 0.5,1.55228475 0.5,1 C0.5,0.44771525 1.05964406,0 1.75,0 L12.25,0 Z",
      transform:
        "translate(1.0 1.0)",
    },
    tft: {
      d: "M4.805 13.987c.125.11.384.289.777.54v1.503l5.013 2.917-.011-.724c1.514.67 2.68 1.074 3.497 1.212l.025.004L12 20.667l-7.195-4.198v-2.482zM12 4l7.195 4.148v6.328A7.108 7.108 0 0 1 21 16.368c-.125-.058-.38-.162-.765-.313.477 1.053.54 2.607-1.165 3.008-4.079.96-9.414-1.692-11.432-3.058 1.025.417 2.003.774 2.933 1.072v-.653a19.052 19.052 0 0 1-4.437-2.211C4.485 13.103 3.193 11.709 3 11.469c.276.075.51.12.702.138-.627-1.14.038-2.319 1.103-2.795v-.664L12 4zm0 .89L5.582 8.599v3.02c-.276-.263-.69-.94-.777-1.378-.276.2-.322.64-.15 1.077.745 1.898 3.931 3.969 5.916 5.053v-5.065H7.462L6.36 8.862h11.344L16.6 11.306h-3.108v6.545c.92.185 1.78.297 2.582.334 3.472.163 3.71-.84 3.121-1.679l-2.006 1.166a6.367 6.367 0 0 1-1.504-.025l2.733-1.567V8.6L12 4.889z",
      transform:
          "translate(-348.000000, -598.000000) translate(320.000000, 130.000000) translate(0.000000, 65.000000) translate(16.000000, 308.000000) translate(8.000000, 90.000000) translate(0.000000, 1.000000)",
    },
    recommend: {
      d: "M8.52352941,0 C9.38769261,0 10.0882353,0.727316756 10.0882353,1.62450744 L10.0882353,4.24133161 L12.4352941,4.24133161 C13.2994573,4.24133161 14,4.96864836 14,5.86583905 L13.2176471,11.3715521 C12.9865096,12.3952022 12.3485893,13.0575032 11.6529412,12.9960595 L6.17647059,12.9960595 C4.98493268,12.9960595 4.0007766,12.0742175 3.84955677,10.8799959 L3.849,4.241 L4.00111383,4.24123194 C5.64958709,4.2386699 6.95882353,4.17132983 6.95882353,2.43676117 L6.95882353,1.62450744 C6.95882353,0.727316756 7.65936621,0 8.52352941,0 Z M3.129,4.241 L3.12941176,12.1838058 C3.12941176,12.6324012 2.77914042,12.9960595 2.34705882,12.9960595 L0.782352941,12.9960595 C0.350271343,12.9960595 0,12.6324012 0,12.1838058 L0,5.05358533 C0,4.60498999 0.350271343,4.24133161 0.782352941,4.24133161 L3.129,4.241 Z",
      transform: "translate(1.0 1.0)"
    }
  };

  const spells = [
    {
      key: "d",
    },
    {
      key: "f",
    },
  ];

  useEffect(() => {
    // console.log(isAutoSpell);
  }, [isAutoSpell]);

  function SpellButton() {
    const onSpellButtonClick = (key: string) => () => {
      setIndex(key);
      localStorage.setItem("spell", key);
      window.api.send("spell", key);
      setTimeout(() => {
        window.api.send("update-spell-set", key);
      }, 200);
    };

    return (
      <div className="side-item-setting">
        <img
          src="https://opgg-static.akamaized.net/images/lol/spell/SummonerFlash.png?image=c_scale,q_auto,w_42&v=1626880099"
          alt="flash"
        />
        {spells.map((spell) => (
          <div
            className={`side-item-setting-spell ${
              index === spell.key ? "side-item-setting-spell-active" : ""
            }`}
            key={spell.key}
            onClick={onSpellButtonClick(spell.key)}
          >
            {spell.key.toUpperCase()}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="side">
      {isAutoSpell &&
          <>
            <div className="side-item">
              <div className="side-item-title">
                <h1>{t("sidebar.spell")}</h1>
              </div>
              <div className="side-href">
                <SpellButton/>
                {/*<NavLink*/}
                {/*  to="/user-settings"*/}
                {/*  className="side-href-item"*/}
                {/*  activeClassName="side-href-item-active"*/}
                {/*>*/}
                {/*  <SideHrefItemIcon*/}
                {/*    d={hrefIcon["setting"].d}*/}
                {/*    transform={hrefIcon["setting"].transform}*/}
                {/*  />*/}
                {/*  <span className="side-href-item-title">User Settings</span>*/}
                {/*</NavLink>*/}
              </div>
            </div>
            <div className="side-seperator"></div>
          </>
      }
      <div className="side-main">
        <div className="side-item side-liveGame">
          <div className="side-item-title">
            <h1>{t("sidebar.live")}</h1>
            {isLoLGameLive &&
            <div className="side-liveGame-icon">
              <span>Live</span>
              <div className="side-liveGame-icon-oval"></div>
            </div>
            }
          </div>
          <div className="side-href">
            {(is420 === null || is420 === true)
                ?   <NavLink
                    to={`/live/recommendation`}
                    className={`side-href-item`}
                    activeClassName="side-href-item-active"
                    onClick={() => {
                      window.api.send("menu", "0");
                      setOverlaySetting(false);
                    }}
                >
                  <SideHrefItemIcon
                      d={hrefIcon["recommend"].d}
                      transform={hrefIcon["recommend"].transform}
                  />
                  <span className="side-href-item-title">{t("live.tab.recommendation")}</span>
                </NavLink>
                : <span
                    className={`side-href-item ${!is420 ? "side-href-item-inactive" : ""}`}
                >
                    <SideHrefItemIcon
                        d={hrefIcon["recommend"].d}
                        transform={hrefIcon["recommend"].transform}
                    />
                  <span className="side-href-item-title">{t("live.tab.recommendation")}</span>
                </span>
            }

            {!is420
                ?  <NavLink
                    to={`/live/multisearch`}
                    className={`side-href-item ${!is420 ? "" : "side-href-item-inactive"}`}
                    activeClassName="side-href-item-active"
                    onClick={() => {
                      window.api.send("menu", "1");
                      setOverlaySetting(false);
                    }}
                >
                  <SideHrefItemIcon
                      d={hrefIcon["multisearch"].d}
                      transform={hrefIcon["multisearch"].transform}
                  />
                  <span className="side-href-item-title">{t("live.tab.multisearch")}</span>
                </NavLink>
                : <span
                    className={`side-href-item ${!is420 ? "" : "side-href-item-inactive"}`}
                >
                     <SideHrefItemIcon
                         d={hrefIcon["multisearch"].d}
                         transform={hrefIcon["multisearch"].transform}
                     />
                  <span className="side-href-item-title">{t("live.tab.multisearch")}</span>
                </span>
            }

            <NavLink
              to={`/live/champion`}
              className={`side-href-item`}
              activeClassName="side-href-item-active"
              onClick={() => {
                window.api.send("menu", "2");
                setOverlaySetting(false);
              }}
              draggable={false}
            >
              <SideHrefItemIcon
                d={hrefIcon["champion"].d}
                transform={hrefIcon["champion"].transform}
              />
              <span className="side-href-item-title">{t("live.tab.champion")}</span>
            </NavLink>
            <NavLink
              to="/live/ingame"
              className="side-href-item"
              activeClassName="side-href-item-active"
              onClick={() => {
                window.api.send("menu", "3");
                setOverlaySetting(false);
              }}
              draggable={false}
            >
              <SideHrefItemIcon
                d={hrefIcon["inGame"].d}
                transform={hrefIcon["inGame"].transform}
              />
              <span className="side-href-item-title">{t("live.tab.ingame")}</span>
            </NavLink>
          </div>
        </div>
        <div className="side-contour"></div>
        <div className="side-item">
          <div className="side-item-title">
            <h1>{t("sidebar.champion")}</h1>
          </div>
          <div className="side-href">
            <NavLink
              to="/champions"
              className="side-href-item"
              activeClassName="side-href-item-active"
              draggable={false}
              onClick={() => {
                setOverlaySetting(false);
              }}
            >
              <SideHrefItemIcon
                d={hrefIcon["champion"].d}
                transform={hrefIcon["champion"].transform}
              />
              <span className="side-href-item-title">{t("sidebar.tier")}</span>
            </NavLink>
            {!isOverlay &&
            <NavLink
                to="/combos"
                className="side-href-item"
                activeClassName="side-href-item-active"
                draggable={false}
            >
              <SideHrefItemIcon
                  d={hrefIcon["combo"].d}
                  transform={hrefIcon["combo"].transform}
              />
              <span className="side-href-item-title">{t("sidebar.combos")}</span>
            </NavLink>
            }
            <NavLink
              to="/live-op-champions"
              className="side-href-item"
              activeClassName="side-href-item-active"
              draggable={false}
              onClick={() => {
                clearTimeout(opChampionTimeout);
                setIsOPChampionNew(false);
                opChampionTimeout = setTimeout(() => {
                  setIsOPChampionNew(true);
                }, 60 * 60 * 1000);
                setOverlaySetting(false);
              }}
            >
              <SideHrefItemIcon
                d={hrefIcon["tier"].d}
                transform={hrefIcon["tier"].transform}
              />
              <span className="side-href-item-title" style={{
                display: "flex",
                alignItems: "center"
              }}>
                {t("op")}
                {isOPChampionNew &&
                    <div style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "16px",
                      height: "16px",
                      fontSize: "10px",
                      fontWeight: "bold",
                      borderRadius: "4px",
                      marginLeft: "4px",
                      backgroundColor: "#FF4E4E",
                      color: "#fff",
                      paddingRight: `${lang === "kr" ? "1px" : "0"}`
                    }}>N</div>
                }
              </span>
            </NavLink>
          </div>
        </div>

        <div className="side-contour"></div>
        <div className="side-item">
          <div className="side-item-title">
            <h1>{t("tft")}</h1>
          </div>
          <div className="side-href">
            <NavLink
                to="/tft"
                className="side-href-item"
                activeClassName="side-href-item-active"
                draggable={false}
                onClick={() => {
                  setIsTFTUpdated(false);
                  setOverlaySetting(true);
                }}
            >
              <SideHrefItemIcon
                  d={hrefIcon["tft"].d}
                  transform={hrefIcon["tft"].transform}
              />
              <span className="side-href-item-title" style={{
                display: "flex",
                alignItems: "center"
              }}>
                {t("tft-team-comps")}
                {isTFTUpdated &&
                    <div style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "16px",
                      height: "16px",
                      fontSize: "10px",
                      fontWeight: "bold",
                      borderRadius: "4px",
                      marginLeft: "4px",
                      backgroundColor: "#FF4E4E",
                      color: "#fff",
                      paddingRight: `${lang === "kr" ? "1px" : "0"}`
                    }}>N</div>
                }
              </span>
            </NavLink>
          </div>
        </div>

        <ul className="side-menu">
          <li className="side-menu-item" style={{cursor: "pointer", display: "flex", alignItems: "center"}} onClick={() => dispatch(setIsSettingOpen({
            result: true,
            index: 4
          }))}>
            <img width={16} height={16} src={"../../assets/images/icon-setting.svg"} style={{marginRight: "4px"}} /> {t("sidebar.settings")}
            {(overlaySetting && !isNMP && window.api.platform() !== "darwin" && ((localStorage.getItem("isOverlay2") === "false" || localStorage.getItem("isOverlay2") === null) || !JSON.parse(localStorage.getItem("overlaySettings") ?? "{}")["tft-meta"])) &&
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#fff",
                  backgroundColor: "#FF4E4E",
                  borderRadius: 4,
                  padding: "2px 6px",
                  fontSize: 11,
                  marginLeft: 4
                }}>{t("set-overlay-on")}</div>
            }
          </li>
          <li className="side-menu-item" style={{cursor: "pointer", display:"flex", alignItems: "center"}} onClick={() => window.api.openExternal("https://discord.gg/ZwK5ahZeWz")}>
            <img width={16} height={16} src={"../../assets/images/icon-discord.svg"} style={{marginRight: "4px"}} /> Discord
          </li>
          {/*<li className="side-menu-item">*/}
          {/*  <Link to="/support">Support</Link>*/}
          {/*</li>*/}
        </ul>
        <span className={"side-network-status"} style={{
          display: `${!onlineStatus ? "block" : "none"}`
        }}>
          <img src={"../../assets/images/offline.svg"}/>
        </span>
        {/* Edit By BlacK201 */}
        <span className="side-version" style={{
          marginTop: `${isNMP ? "50px" : ""}`
        }}>
          {isNMP &&
              <div className={"riot-compliant-small"} onClick={() => {
                window.api.openExternal("https://support-leagueoflegends.riotgames.com/hc/ko/articles/225266848");
              }}><img src={"../../assets/images/riot.svg"} width={16} />Riot Games Compliant</div>
          }
          {(isUpdateAvailable && !isNMP)
              ? <Tippy content={t("update-available")} maxWidth={"280px"}>
              <div style={{display: "flex", alignItems: "center", cursor: "pointer", textAlign: "center"}} onClick={() => {
                window.api.send("check-update");
              }}>
                  <img src={"../../assets/images/icon-info-red.svg"} style={{marginRight: "4px"}} width={"18"} height={"18"} />
                <p>V.{version}</p> <p>{editionVersion}</p>
              </div>
              </Tippy>
            : <>
              {isNMP
                ? <div style={{
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    bottom: 37,
                    right: 12
                  }}>
                    <div
                      style={{
                        width: 44,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "1px 8px",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        fontSize: "11px",
                        marginRight: "4px",
                        color: "#fff",
                        backgroundColor: "#5f32e6"
                      }}
                    >PC방</div>
                    <div>{version}</div>
              </div>
                : <><p>V.{version}</p> <p>{editionVersion}</p></>
              }
              </>
          }
        </span>
      </div>
    </div>
  );
};

export default Side;

interface SideHrefItemIconProps {
  d: string;
  transform: string;
}

const SideHrefItemIcon = ({ d, transform }: SideHrefItemIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className="side-href-item-icon"
    >
      <g fill="none" fillRule="evenodd">
        <g className="side-href-item-icon-fill" fillRule="nonzero">
          <g>
            <g>
              <g>
                <g>
                  <g>
                    <path d={d} transform={transform} />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};
