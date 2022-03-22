import React, {ChangeEvent, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import Modal from "react-modal";
import {getSettingInLocalStorage} from "../../lib";
import {
  setIsSettingOpen,
  setClientLogin,
  setIsAutoRune,
  setIsAutoSpell,
  setIsAutoAccept,
  setApril,
  setGPM, setRegion, setRiotAccounts
} from "../../redux/slices/common";
import {LANGUAGE_LIST} from "../../constants";
import {useTypedSelector} from "../../redux/store";
import {useDispatch} from "react-redux";
import sendGA4Event from "../../utils/ga4";
import axios from "axios";
import _ from "lodash";
import constants from "../../../main/constants/constants";
import customToastr from "../../lib/toastr";

let metaChampions = require("../../../assets/data/meta/champions.json");
const {isNMP} = require("../../utils/nmp");
const {isOW} = require("../../utils/ow");

const customStyles = {
  overlay: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    top: "0",
    left: "0",
    width: "1280px",
    height: "720px",
    position: "absolute",
    zIndex: "99999",
    backdropFilter: "blur(8px)",
    backgroundImage: "radial-gradient(circle at 50% 0, rgba(34, 34, 42, 0.82), rgba(19, 19, 23, 0.71) 75%)",
    backgroundColor: "transparent !important"
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: "transparent",
    border: "none",
    padding: "50px 0",
    borderRadius: "12px"
  }
};

const tabModeContent = [
  {
    title: "All Games",
    icon: "icon-overlay-all-",
    type: "all"
  },
  {
    title: "League of Legends",
    icon: "icon-overlay-lol-",
    type: "lol"
  },
  {
    title: "Team Fight Tactics",
    icon: "icon-overlay-tft-",
    type: "tft"
  }
];

const tabMode2Content = [
  {
    title: "커버 이미지",
    icon: "icon-overlay-all-",
    type: "cover"
  },
  {
    title: "내 응원팀",
    icon: "icon-overlay-lol-",
    type: "esports"
  },
  {
    title: "나만의 한마디",
    icon: "icon-overlay-tft-",
    type: "word"
  }
];

const overlayTypes = ["lol", "tft"];

const overlays = [
  {
    type: "lol",
    name: "benchmark"
  },
  {
    type: "lol",
    name: "skill"
  },
  {
    type: "tft",
    name: "meta"
  },
  // {
  //   type: "tft",
  //   name: "rank"
  // }
];

const overlayTitle = {
  "lol": "League of Legends",
  "tft": "Team Fight Tactics"
}

const Settings = () => {
  const dispatch = useDispatch();
  const {t, i18n} = useTranslation();
  const [index, setIndex] = useState<number>(4);
  const {isSettingOpen, clientLogin, summonerName, gpm, riotAccounts} = useTypedSelector(state => state.common);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gameSettings, setGameSettings] = useState({
    isOnStart: isNMP ? localStorage.getItem("autostart") === "true" : getSettingInLocalStorage("autostart"),
    isAutoRune: getSettingInLocalStorage("autorune"),
    isAutoItem: getSettingInLocalStorage("autoitem"),
    isAutoAccept: getSettingInLocalStorage("autoaccept"),
    isAPM: getSettingInLocalStorage("apm"),
    isSpell: isNMP ? localStorage.getItem("isSpell") === "true" : getSettingInLocalStorage("isSpell"),
    isOverlay: localStorage.getItem("isOverlay2") === "true",
    april: getSettingInLocalStorage("april"),
  });
  const [overlaySettings, setOverlaySettings] = useState(JSON.parse(localStorage.getItem("overlaySettings") ?? "{}"));
  const [tabModeIndex, setTabModeIndex] = useState<number>(0);
  const [tabMode2Index, setTabMode2Index] = useState<number>(0);
  const [selectedSkinId, setSelectedSkinId] = useState<number>(-1);
  const [selectedSkinChampionId, setSelectedSkinChampionId] = useState<number>(-1);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(-1);
  const [introduce, setIntroduce] = useState<string>("");
  const [isFocus, setIsFocus] = useState(false);

  const onChangeGame = (ipcEventKey: string, storageKey: string, key: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const {checked} = e.target;
    setGameSettings({
      ...gameSettings,
      [key]: checked
    })
    if (ipcEventKey === "autorune") {
      dispatch(setIsAutoRune(checked));
    } else if (ipcEventKey === "isSpell") {
      if (checked) {
        setTimeout(() => {
          window.api.send("update-spell-set", localStorage.getItem("spell") ?? "f");
        }, 200);
      }
      dispatch(setIsAutoSpell(checked));
    } else if (ipcEventKey === "april") {
      dispatch(setApril(checked));
    } else if (ipcEventKey === "autoaccept") {
      dispatch(setIsAutoAccept(checked));
    } else if (ipcEventKey === "isOverlay") {
      let tmp = {};
      overlays.map((o) => {
        tmp[`${o.type}-${o.name}`] = checked;
      });
      localStorage.setItem("overlaySettings", JSON.stringify(tmp));
      setOverlaySettings(tmp);
      window.api.send("overlay-setting-changed", JSON.stringify(tmp));
    } else if (ipcEventKey === "autoitem") {
      if (!checked) {
        window.api.send("remove-item-set");
      }
    }

    window.api.send(ipcEventKey, checked);
    localStorage.setItem(storageKey, String(e.target.checked));
    sendGA4Event(`setting_${ipcEventKey}`, {
      on: e.target.checked
    });
  };
  let lang = localStorage.getItem("i18n");
  if (lang !== "kr") {
    metaChampions = require("../../../assets/data/meta/champions_en.json");
  }

  const onChangeOverlaySetting = (o) => (e) => {
    let {checked} = e.target;
    if (!gameSettings.isOverlay) {
      setGameSettings({
        ...gameSettings,
        ["isOverlay"]: true
      });
      window.api.send("isOverlay", true);
      localStorage.setItem("isOverlay2", "true");
      checked = true;
    }
    let tmp = JSON.parse(localStorage.getItem("overlaySettings") ?? "{}");
    tmp[`${o.type}-${o.name}`] = checked;
    let allOff = true;
    for (const [key, value] of Object.entries(tmp)) {
      if (value === true) {
        allOff = false;
      }
    }
    if (allOff) {
      setGameSettings({
        ...gameSettings,
        ["isOverlay"]: false
      });
      window.api.send("isOverlay", false);
      localStorage.setItem("isOverlay2", "false");
    }
    overlays.map((o) => {
      if (tmp[`${o.type}-${o.name}`] === undefined) {
        tmp[`${o.type}-${o.name}`] = false;
      }
    });
    sendGA4Event(`setting_overlay`, {
      type: `${o.type}-${o.name}`,
      on: checked
    });
    localStorage.setItem("overlaySettings", JSON.stringify(tmp));
    setOverlaySettings(tmp);
    window.api.send("overlay-setting-changed", JSON.stringify(tmp));
  }

  const onChangeStart = onChangeGame("autostart", "autostart", "isOnStart");
  const onChangeAutoRune = onChangeGame("autorune", "autorune", "isAutoRune");
  const onChangeAutoItem = onChangeGame("autoitem", "autoitem", "isAutoItem");
  const onChangeAutoAccept = onChangeGame("autoaccept", "autoaccept", "isAutoAccept");
  const onChangeAPM = onChangeGame("apmSetting", "apm", "isAPM");
  const onChangeIsSpell = onChangeGame("isSpell", "isSpell", "isSpell");
  const onChangeIsOverlay = onChangeGame("isOverlay", "isOverlay2", "isOverlay");
  const onChangeApril = onChangeGame("april", "april", "april");
  const [scaleSetting, setScaleSetting] = useState(localStorage.getItem("scale") ?? "1");
  const [languageSetting, setLanguageSetting] = useState(localStorage.getItem("i18n"));
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [owConsentRequired, setowConsentRequired] = useState(false);
  const [searchChampion, setSearchChampion]= useState("");
  const [searchLeague, setSearchLeague]= useState("");
  const [introduceSaveClicked, setIntroduceSaveClicked] = useState(false);
  const [saveClickedAfter, setSaveClickedAfter] = useState(false);
  const [deleteClicked, setDeleteClicked] = useState(false);
  const [leagues, setLeagues] = useState({});
  const [teams, setTeams] = useState({});
  const [regionLeague, setRegionLeague]= useState("LCK");

  let nickname = localStorage.getItem("opgg_nickname");
  let vcredist = localStorage.getItem("vcredist") === "true";

  const onChangeScale = (e: ChangeEvent<HTMLSelectElement>) => {
    const {value} = e.target;
    setScaleSetting(value);
    localStorage.setItem("scale", value);
    window.api.send("scale", value);
  };

  const onClickLanguage = (lang: string) => () => {
    setLanguageSetting(lang);
    if (lang !== "kr") {
      metaChampions = require("../../../assets/data/meta/champions_en.json");
    } else {
      metaChampions = require("../../../assets/data/meta/champions.json");
    }
    localStorage.setItem("i18n", lang);
    window.api.send("i18n-changed", lang);
    i18n.changeLanguage(lang);
  };

  const versionToInt = (version: string): number => {
    let v = version.split(".");
    return parseInt(v[0])*10000+parseInt(v[1])*100+parseInt(v[2]);
  };

  const rsoFeatureType = (types: number=0, feature="") => {
    let isMember = !!localStorage.getItem("opgg_nickname");
    let isRSO = gpm?.is_owner;
    let isSet = false;

    if (feature === "fan") {
      isSet = !!gpm?.favorite_esport_team;
    } else if (feature === "introduce") {
      isSet = !!gpm?.word;
    }

    const typeNone = constants.TYPE_NONE;
    const typeLogin = isMember ? constants.TYPE_LOGIN : 0;
    const typeRSO = isRSO ? constants.TYPE_RSO : 0;
    const typeSet = isSet ? constants.TYPE_SET : 0;

    return {
      result: (typeNone | typeLogin | typeRSO | typeSet) >= types,
      isCurrentAccount: gpm?.is_owner
    }
  }

  const onChangeSearchChampion = (e: ChangeEvent<HTMLInputElement>) => {
    // setSelectedSkinId(-1);
    // setSelectedSkinChampionId(-1);
    setSearchChampion(e.target.value.toLowerCase());
  }

  const onChangeSearchLeague = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchLeague(e.target.value.toLowerCase());
  }

  const onChangeIntroduce = (e: ChangeEvent<HTMLInputElement>) => {
    setIntroduceSaveClicked(false);
    if (e.target.value.getBytes() <= 30) {
      setIntroduce(e.target.value);
    } else {
      setIntroduce(e.target.value.splitBytes(30));
    }
  }

  const onClickRemoveIntroduce = () => {
    setIntroduce("");
    // setIntroduceSaveClicked(false);
  }

  const profileInit = () => {
    if (tabMode2Index === 0) {
      setSelectedSkinId(-1);
      setSelectedSkinChampionId(-1);
      window.api.invoke("rso-profile-delete", {
        type: "cover"
      });
      sendGA4Event("click", {
        screen_category: "setting",
        screen_name: "profile_edit",
        screen_sub_name: "rso_cover_img",
        event_result: "apply_edit",
        label_category: "refresh",
        label_name: "refresh_button"
      });
    } else if (tabMode2Index === 1) {
      setSelectedTeamId(-1);
      window.api.invoke("rso-profile-delete", {
        type: "esports"
      });
      sendGA4Event("click", {
        screen_category: "setting",
        screen_name: "profile_edit",
        screen_sub_name: "rso_fan",
        event_result: "apply_edit",
        label_category: "refresh",
        label_name: "refresh_button"
      });
    } else if (tabMode2Index === 2) {
      setIntroduce("");
      setDeleteClicked(true);
      setSaveClickedAfter(false);
      window.api.invoke("rso-profile-delete", {
        type: "word"
      });
      sendGA4Event("click", {
        screen_category: "setting",
        screen_name: "profile_edit",
        screen_sub_name: "rso_comment",
        event_result: "apply_edit",
        label_category: "refresh",
        label_name: "refresh_button"
      });
    }
  }

  useEffect(() => {
    gameSettings.isSpell = isNMP ? localStorage.getItem("isSpell") === "true" : getSettingInLocalStorage("isSpell");
    // console.log(gameSettings.isSpell);
    window.api.send("isSpell", gameSettings.isSpell);
    dispatch(setIsAutoSpell(gameSettings.isSpell));
  }, [isNMP ? localStorage.getItem("isSpell") === "true" : getSettingInLocalStorage("isSpell")]);

  useEffect(() => {
    if (isSettingOpen.result) {
      window.api.invoke("get-region-league").then((response) => {
        setRegionLeague(response);
      });

      setIndex(isSettingOpen.index);
      if (isSettingOpen?.tabIndex || isSettingOpen?.tabIndex === 0) {
        setTabMode2Index(isSettingOpen?.tabIndex);
      }

      window.api.invoke("rso-profile").then((response) => {
        if (response?.data) {
          dispatch(setGPM(response.data));
          setSelectedSkinChampionId(response.data?.cover_champion?.id);
          setSelectedSkinId(response.data?.cover_champion?.skin_id);
          setIntroduce(response.data?.word ? response.data?.word?.content : "");
          setSaveClickedAfter(!!response.data?.word);
          setIntroduceSaveClicked(!!response.data?.word);
          setSelectedTeamId(response.data?.favorite_esport_team?.id);
        } else {
          dispatch(setGPM(null));
        }
      });

      window.api.invoke("rso-accounts").then((response) => {
        dispatch(setRiotAccounts(response));
      });

      axios.get("https://lol-api-summoner.op.gg/api/esports/leagues").then((response) => {
        setLeagues(response.data.data);
      });

      axios.get("https://lol-api-summoner.op.gg/api/esports/teams").then((response) => {
        setTeams(response.data.data);
      });

      window.api.invoke("get-version").then((v) => {
        axios.get("https://desktop-patch.op.gg/latest.yml").then((res) => {
          let latestVersion = res.data.split("version: ")[1].split("\n")[0];
          if (versionToInt(v) < versionToInt(latestVersion)) {
            setIsUpdateAvailable(true);
          }
        }).catch(() => {
        })
      });

      if (isOW) {
        window.api.invoke("ow-consent-required").then((result) => {
          setowConsentRequired(result);
        });
      }

      sendGA4Event("view_setting_page", {
        "menu_name": "full"
      });
      if (localStorage.getItem("isLaunchedBefore") !== "true" && (localStorage.getItem("app_mode") === "full" || localStorage.getItem("app_mode") === "login")) {
        localStorage.setItem("isLaunchedBefore", "true");
      }
      setScaleSetting(localStorage.getItem("scale") ?? "1");
      showBeacon(true);
      setGameSettings(prevState => ({
        ...prevState,
        isAutoRune: getSettingInLocalStorage("autorune")
      }));
    }
  }, [isSettingOpen]);

  let beaconInterval: any = null;
  useEffect(() => {
    beaconInterval = setInterval(() => {
      if (showBeacon(false)) {
        clearInterval(beaconInterval);
      }
    }, 1000);

    return () => {
      clearInterval(beaconInterval);
    }
  }, []);

  let loginTimeout: any = null;
  useEffect(() => {
    if (clientLogin) {
      window.api.invoke("rso-profile").then((response) => {
        if (response?.data) {
          dispatch(setGPM(response.data));
          setSelectedSkinChampionId(response.data?.cover_champion?.id);
          setSelectedSkinId(response.data?.cover_champion?.skin_id);
          setIntroduce(response.data?.word ? response.data?.word?.content : "");
          setIntroduceSaveClicked(!!response.data?.word);
          setSelectedTeamId(response.data?.favorite_esport_team?.id);
        } else {
          dispatch(setGPM(null));
          setSelectedSkinChampionId(-1);
          setSelectedSkinId(-1);
          setIntroduce("");
          setSaveClickedAfter(false);
          setIntroduceSaveClicked(false);
          setSelectedTeamId(-1);
        }
      });

      window.api.invoke("rso-accounts").then((response) => {
        dispatch(setRiotAccounts(response));
      });

      loginTimeout = setTimeout(() => {
        nickname = localStorage.getItem("opgg_nickname");
        dispatch(setClientLogin(false));
      }, 1000);
    }

    return () => {
      clearTimeout(loginTimeout);
    }
  }, [clientLogin]);

  useEffect(() => {
    window.api.invoke("rso-profile").then((response) => {
      if (response?.data) {
        dispatch(setGPM(response.data));
        setSelectedSkinChampionId(response.data?.cover_champion?.id);
        setSelectedSkinId(response.data?.cover_champion?.skin_id);
        setIntroduce(response.data?.word ? response.data?.word?.content : "");
        setSaveClickedAfter(!!response.data?.word);
        setIntroduceSaveClicked(!!response.data?.word);
        setSelectedTeamId(response.data?.favorite_esport_team?.id);
      } else {
        dispatch(setGPM(null));
        setSelectedSkinChampionId(-1);
        setSelectedSkinId(-1);
        setIntroduce("");
        setSaveClickedAfter(false);
        setIntroduceSaveClicked(false);
        setSelectedTeamId(-1);
      }
    })

  }, [summonerName]);

  useEffect(() => {
    setSearchChampion("");
    setIntroduce(gpm?.word?.content ?? "");
  }, [tabMode2Index]);

  let showBeacon = (visible: boolean) => {
    let beacon = document.getElementById("beacon-container");
    if (beacon) {
      beacon.style.display = visible ? "block" : "none";
      return true;
    }

    return false;
  }

  const onClickClose = () => {
    showBeacon(false);
    clearTimeout(loginTimeout);
    setSearchChampion("");
    setSelectedSkinChampionId(-1);
    setSelectedSkinId(-1);
    setIntroduce("");

    window.api.invoke("rso-profile").then((response) => {
      if (response.data) {
        dispatch(setGPM(response.data));
      }
    })

    if (index === 4) {
      if (tabMode2Index === 0) {
        sendGA4Event("click", {
          screen_category: "setting",
          screen_name: "profile_edit",
          screen_sub_name: "rso_cover_img",
          event_result: "move_screen",
          label_category: "close",
          label_name: "close_button"
        });
      } else if (tabMode2Index === 1) {
        sendGA4Event("click", {
          screen_category: "setting",
          screen_name: "profile_edit",
          screen_sub_name: "rso_fan",
          event_result: "move_screen",
          label_category: "close",
          label_name: "close_button"
        });
      } else if (tabMode2Index === 2) {
        sendGA4Event("click", {
          screen_category: "setting",
          screen_name: "profile_edit",
          screen_sub_name: "rso_comment",
          event_result: "move_screen",
          label_category: "close",
          label_name: "close_button"
        });
      }
    }

    dispatch(setIsSettingOpen({
      result: false,
      index: 0
    }));
  }

  const onClickLoginButton = () => {
    if (nickname) {
      sendGA4Event("click", {
        screen_category: "setting",
        screen_name: "main",
        event_result: "apply_edit",
        label_category: "side_nav",
        label_name: "member_logout_button"
      });
      showBeacon(false);
      dispatch(setIsSettingOpen({
        result: false,
        index: 0
      }));
      window.api.send("logout");
    } else {
      sendGA4Event("click", {
        screen_category: "setting",
        screen_name: "main",
        event_result: "move_web",
        label_category: "side_nav",
        label_name: "member_login_button"
      });
      window.api.openExternal("https://member.op.gg/?redirect_url=https://member.op.gg/client-login&remember_me=true");
      // window.open("https://member-stage-1fdsf134.op.gg/?redirect_url=https://member-stage-1fdsf134.op.gg/client-login&remember_me=true", '_blank')
    }
  }

  const onClickRSOButton = () => {
    if (rsoFeatureType(constants.TYPE_LOGIN | constants.TYPE_RSO).result) {
      sendGA4Event("click", {
        screen_category: "setting",
        screen_name: "main",
        event_result: "move_web",
        label_category: "side_nav",
        label_name: "rso_extra_login_button"
      });
    } else {
      sendGA4Event("click", {
        screen_category: "setting",
        screen_name: "main",
        event_result: "move_web",
        label_category: "side_nav",
        label_name: "rso_login_button"
      });
    }


    window.api.invoke("member-ott").then((data) => {
      if (data) {
        window.api.openExternal(`https://member-node.op.gg/api/redirect?ott=${data.token}&ts=${data.ts}&url=https%3A%2F%2Fmember.op.gg%2F%3Fredirect_url%3Dhttps%3A%2F%2Fmember.op.gg%2Fsettings%26attach_redirect_url%3Dhttps%3A%2F%2Fmember.op.gg%2Fclient-login`);
      } else {
        window.api.openExternal("https://member.op.gg/?redirect_url=https://member.op.gg/settings/edit&remember_me=true");
      }
    });
  }

  const onProfileAddWord = (enter=false) => {
    if (!introduceSaveClicked) {
      if (!enter) {
        sendGA4Event("click", {
          screen_category: "setting",
          screen_name: "profile_edit",
          screen_sub_name: "rso_comment",
          event_result: "apply_edit",
          label_category: "register_comment",
          label_name: "rso_comment_button"
        });
      } else {
        sendGA4Event("enter", {
          screen_category: "setting",
          screen_name: "profile_edit",
          screen_sub_name: "rso_comment",
          event_result: "apply_edit",
          label_category: "register_comment",
          label_name: "rso_comment_bar"
        });
      }

      let re = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/;
      if (!re.test(introduce)) {
        window.api.invoke("rso-profile-put", {
          type: "word",
          data: {
            "content": introduce
          }
        }).then((res) => {
          if (res === 422) {
            customToastr.error(t("rso.word-error"));
          }
        });
        setDeleteClicked(false);
        setIntroduceSaveClicked(true);
        setSaveClickedAfter(true);
      } else {
        customToastr.error(t("rso.word-error"));
      }
    }
  }

  return (
    <Modal
      style={customStyles}
      isOpen={isSettingOpen.result}
      contentLabel="Example Modal"
    >
      <div className="popup-settings">
        <div className={"popup-settings-close"} onClick={onClickClose}>
          <img src={"../../assets/images/icon-close-wh.svg"}/>
        </div>
        <div className={"popup-settings-side"}>
          <div className={"popup-settings-side-top"}>
            <div className={"popup-settings-profile"}>
                <div className={"popup-settings-profile-img"}>
                  <img src={"../../assets/images/opgg-logo-square.svg"}/>
                </div>
                <div className={"popup-settings-profile-info"}>
                  <div>{nickname ?? t("login-first")}</div>
                  {nickname
                    ? <div>{t("opgg-account")}</div>
                    : <div></div>
                  }
                </div>
            </div>
            <div className={"popup-settings-login"} onClick={onClickLoginButton}>
              {nickname
                ? t("opgg-logout")
                : t("opgg-login")
              }
            </div>
            <div className={`popup-settings-login ${rsoFeatureType(constants.TYPE_LOGIN).result ? "" : "popup-settings-login-disabled"}`}
                 style={{marginTop: 8, backgroundColor: "#5f32e6"}}
                 onClick={() => {
                   if (rsoFeatureType(constants.TYPE_LOGIN).result) {
                     onClickRSOButton();
                   }
                 }}
            >
              {riotAccounts !== 0
                  ? <div style={{
                    display: "flex",
                    alignItems: "center"
                  }}>
                    {t("rso.link-another")}
                  </div>
                  : <div>
                    {t("rso.link")}
                  </div>
              }
            </div>
          </div>
          <div className={"popup-settings-side-bottom"}>
            <div className={"popup-settings-side-bottom-section"}>{t("settings.accounts")}</div>
            <div
                className={`popup-settings-side-bottom-section-row ${index === 4 ? "popup-settings-side-bottom-section-row-active" : ""}`}
                onClick={() => {
                  sendGA4Event("click", {
                    screen_category: "setting",
                    screen_name: "profile_edit",
                    event_result: "move_screen",
                    label_category: "side_nav",
                    label_name: "profile_edit_button"
                  });
                  setIndex(4);
                }}>{t("settings.edit-profile")}
              <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    fontSize: "11px",
                    marginRight: "4px",
                    color: "#fff",
                    backgroundColor: "#5f32e6",
                    marginLeft: 4
                  }}
              >NEW</div>
            </div>

            <div className={"popup-settings-side-bottom-section"} style={{
              marginTop: 16
            }}>{t("sidebar.settings")}</div>
            <div
              className={`popup-settings-side-bottom-section-row ${index === 0 ? "popup-settings-side-bottom-section-row-active" : ""}`}
              onClick={() => setIndex(0)}>{t("settings.game")}</div>
            <div
              className={`popup-settings-side-bottom-section-row ${index === 1 ? "popup-settings-side-bottom-section-row-active" : ""}`}
              onClick={() => setIndex(1)}>{t("settings.language")}</div>
            {(!isNMP && window.api.platform() === "win32") &&
                <div
                    className={`popup-settings-side-bottom-section-row ${index === 2 ? "popup-settings-side-bottom-section-row-active" : ""}`}
                    onClick={() => setIndex(2)}>
                  {t("settings.overlay-side")}
                  <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        fontSize: "11px",
                        marginRight: "4px",
                        color: "#fff",
                        backgroundColor: "#5f32e6",
                        marginLeft: 4
                      }}
                  >NEW</div>
                </div>
            }
            {(isOW && owConsentRequired) &&
                <div
                    className={`popup-settings-side-bottom-section-row ${index === 3 ? "popup-settings-side-bottom-section-row-active" : ""}`}
                    onClick={() => setIndex(3)}>Privacy</div>
            }
          </div>

          <div className={"privacy-policy"}>
            <div onClick={() => {
              window.api.openExternal(`https://www.op.gg/policies/agreement`);
            }}>{t("settings.terms")}</div>
            <div onClick={() => {
              window.api.openExternal(`https://www.op.gg/policies/privacy`);
            }}>{t("settings.privacy")}</div>
          </div>
          {!isNMP
              ?  <div className={"if-award"} onClick={() => {
                window.api.openExternal("https://ifdesign.com/en/winner-ranking/project/opgg-for-desktop/350772");
              }} style={{position: "absolute", left: "28px", bottom: "18px"}}>
                <img src={"../../assets/images/iF2022.svg"} width={160} />
              </div>
              : <div className={"riot-compliant"} onClick={() => {
                window.api.openExternal("https://support-leagueoflegends.riotgames.com/hc/ko/articles/225266848");
              }}><img src={"../../assets/images/riot.svg"} />Riot Games Compliant</div>
          }
        </div>
        <div className={"popup-settings-main"}>
          {index === 0 &&
              <>
                {!isNMP &&
                    <div className={"popup-settings-main-row"}>
                        <div style={{display: "flex", alignItems: "center"}}>
                            <div className={"popup-settings-main-row-title"}>{t("settings.startup")}</div>
                            <label className="switch">
                                <input type="checkbox" checked={gameSettings.isOnStart}
                                       onChange={onChangeStart}/>
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>
                }

                  <div className={"popup-settings-main-row"}>
                      <div className={"popup-settings-main-row-title"}>{t("settings.scale")}</div>
                      <select className="settings-select" onChange={onChangeScale} value={scaleSetting}>
                          <option value="0.5">50%</option>
                          <option value="0.75">75%</option>
                          <option value="1">100%</option>
                          <option value="1.25">125%</option>
                          <option value="1.5">150%</option>
                          <option value="1.75">175%</option>
                          <option value="2">200%</option>
                      </select>
                  </div>

                  <div className={"popup-settings-main-row"}>
                      <div style={{display: "flex", alignItems: "center"}}>
                          <div className={"popup-settings-main-row-title"}>{t("settings.rune")}</div>
                          <label className="switch">
                              <input type="checkbox" checked={gameSettings.isAutoRune} onChange={onChangeAutoRune}/>
                              <span className="slider round"></span>
                          </label>
                      </div>
                      <div className="popup-settings-main-row-desc">{t("settings.rune-desc")}</div>
                  </div>

                  <div className={"popup-settings-main-row"}>
                      <div style={{display: "flex", alignItems: "center"}}>
                          <div className={"popup-settings-main-row-title"}>{t("settings.spell")}</div>
                          <label className="switch">
                              <input type="checkbox" checked={gameSettings.isSpell} onChange={onChangeIsSpell}/>
                              <span className="slider round"></span>
                          </label>
                      </div>
                      <div className="popup-settings-main-row-desc">{t("settings.spell-desc")}</div>
                  </div>

                  <div className={"popup-settings-main-row"}>
                      <div style={{display: "flex", alignItems: "center"}}>
                          <div className={"popup-settings-main-row-title"}>{t("settings.item")}</div>
                          <label className="switch">
                              <input type="checkbox" checked={gameSettings.isAutoItem} onChange={onChangeAutoItem}/>
                              <span className="slider round"></span>
                          </label>
                      </div>
                      <div className="popup-settings-main-row-desc">{t("settings.item-desc")}</div>
                  </div>

                  <div className={"popup-settings-main-row"}>
                      <div style={{display: "flex", alignItems: "center"}}>
                          <div className={"popup-settings-main-row-title"}>{t("settings.autoaccept")}</div>
                          <label className="switch">
                              <input type="checkbox" checked={gameSettings.isAutoAccept} onChange={onChangeAutoAccept} />
                              <span className="slider round"></span>
                          </label>
                      </div>
                      <div className="popup-settings-main-row-desc" >{t("settings.autoaccept-desc")}</div>
                  </div>

                {/*{!isNMP &&*/}
                {/*    <div className={"popup-settings-main-row"}>*/}
                {/*        <div style={{display: "flex", alignItems: "center"}}>*/}
                {/*            <div className={"popup-settings-main-row-title"}*/}
                {/*                 style={{alignItems: "center", display: "flex"}}>{t("settings.overlay")} <img*/}
                {/*                className="img-overlay-beta" src={"../../assets/images/overlay-beta.svg"}/></div>*/}
                {/*            <label className="switch">*/}
                {/*                <input type="checkbox" checked={gameSettings.isOverlay}*/}
                {/*                       onChange={onChangeIsOverlay}/>*/}
                {/*                <span className="slider round"></span>*/}
                {/*            </label>*/}
                {/*        </div>*/}
                {/*        <div className="popup-settings-main-row-desc">{t("settings.overlay-desc")}</div>*/}
                {/*    </div>*/}
                {/*}*/}

                  <div style={{display: "flex"}}>
                    {isNMP &&
                        <div
                            onClick={() => {
                              window.api.send("factory-reset");
                            }}
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              height: "30px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              backgroundColor: "#6b42dc",
                              padding: "0 12px",
                            }}
                        >앱 초기화</div>
                    }

                      <div
                          onClick={() => {
                            window.api.send("app-restart");
                          }}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "30px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            backgroundColor: "#6b42dc",
                            padding: "0 12px",
                            marginLeft: "8px"
                          }}
                      >{t("app-restart")}
                      </div>

                    {(!isNMP && isUpdateAvailable) &&
                        <div
                          onClick={() => {
                            window.api.send("check-update");
                          }}
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "30px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            backgroundColor: "#6b42dc",
                            padding: "0 12px",
                            marginLeft: "8px"
                          }}
                        >{t("app-update")}
                        </div>
                    }

                    {vcredist &&
                        <div
                            onClick={() => {
                              window.api.send("install-vcredist");
                              setIsModalOpen(true);
                            }}
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              height: "30px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              backgroundColor: "#6b42dc",
                              padding: "0 12px",
                              marginLeft: "8px"
                            }}
                        >C++ 재배포 패키지 설치</div>
                    }
                  </div>
              </>
          }
          {index === 1 &&
              <>
                {LANGUAGE_LIST.map(({key, name}) => (
                  <div key={key} className="language-wrapper" onClick={onClickLanguage(key)}>
                    <div className="radio-button" data-language="en">
                      <img src="../../assets/images/icon-radio-on.svg"
                           style={languageSetting === key ? {display: "block"} : {display: "none"}}/>
                    </div>
                    {name}
                  </div>
                ))}
              </>
          }
          {index === 2 &&
              <>
                <TabsMode
                    index={tabModeIndex}
                    setIndex={setTabModeIndex}
                    content={tabModeContent} />
                <div>
                  <div className={"popup-settings-main-row"} style={{
                    display: `${tabModeIndex === 0 ? "block" : "none"}`,
                    marginTop: 32,
                    marginBottom: 32
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center"
                    }}>
                      <div className={"popup-settings-main-row-title"}
                           style={{alignItems: "center", display: "flex"}}>{t("settings.overlay")}</div>
                      <label className="switch">
                        <input id={"overlay-check"} type="checkbox" checked={gameSettings.isOverlay}
                               onChange={onChangeIsOverlay}/>
                        <span className="slider round"></span>
                      </label>
                    </div>
                    <div className="popup-settings-main-row-desc">{t("settings.overlay-desc")}</div>
                  </div>

                  {overlayTypes.map((type, i) => {
                    return (
                        <>
                          <div className="settings-overlay-section" style={{
                            display: `${tabModeIndex !== 0 ? "none": "flex"}`
                          }}>
                            <img src={`../../assets/images/icon-overlay-${type}-on.svg`} />
                            {overlayTitle[type]}
                          </div>
                          <div className="settings-overlay-contents" style={{
                            display: `${(tabModeContent[tabModeIndex].type === type || tabModeIndex === 0) ? "flex": "none"}`,
                            marginTop: tabModeIndex !== 0 ? 32 : 0
                          }}>
                            {_.filter(overlays, {type: type}).map((o, i) => {
                              if (tabModeIndex === 0 || o.type === tabModeContent[tabModeIndex].type) {
                                return (
                                    <>
                                      <div className="settings-overlay-contents__item">
                                        <img width="256"
                                             src={`../../assets/images/overlay-${o.type}-${o.name}-${((overlaySettings[`${o.type}-${o.name}`] ?? true) && gameSettings.isOverlay) ? "on" : "off"}.webp`}/>
                                        <div className="title">
                                          {t(`overlay-${o.type}-${o.name}`)}
                                          <label className="switch">
                                            <input type="checkbox" checked={(overlaySettings[`${o.type}-${o.name}`] ?? true) && gameSettings.isOverlay} onChange={onChangeOverlaySetting(o)}/>
                                            <span className="slider round"></span>
                                          </label>
                                        </div>
                                        <div className="desc">{t(`overlay-${o.type}-${o.name}-desc`)}</div>
                                      </div>
                                    </>
                                )
                              }
                            })}
                          </div>
                        </>
                    )
                  })}

                </div>
              </>
          }

          {index === 3 &&
              <>
                <div className={"popup-settings-main-row"}>
                  <div style={{display: "flex", alignItems: "center"}}>
                    <div className={"popup-settings-main-row-title"}>Ads Personalization & Data</div>
                  </div>
                  <div className="popup-settings-main-row-desc">View and manage how advertisers on select apps may use your data for ad personalization</div>
                </div>
                <div
                    onClick={() => {
                      window.api.invoke("ow-consent", {});
                    }}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      "width": "100px",
                      height: "30px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      backgroundColor: "#6b42dc",
                      padding: "0 12px",
                      marginLeft: "8px"
                    }}
                >Manage</div>
              </>
          }

          {index === 4 &&
              <>
              {summonerName
                  ? <>
                    {rsoFeatureType(constants.TYPE_LOGIN).result
                        ? <>
                          {rsoFeatureType(constants.TYPE_LOGIN | constants.TYPE_RSO).result
                              ? <>
                                {rsoFeatureType(constants.TYPE_LOGIN | constants.TYPE_RSO).isCurrentAccount
                                    ? <>
                                      <div style={{display: "flex", alignItems: "center", marginBottom: 32}}>
                                        <TabsMode2
                                            index={tabMode2Index}
                                            setIndex={setTabMode2Index}
                                            content={tabMode2Content} />
                                        <div className={"save-init"} onClick={profileInit}>
                                          <img src={"../../assets/images/01-icon-icon-change.svg"} width={24} style={{marginRight: 4}} />
                                          {t("rso.restore")}
                                        </div>
                                      </div>
                                      {tabMode2Index === 0 &&
                                          <div className={"profile-edit-settings"}>
                                            <div style={{position: "relative", width: "fit-content"}}>
                                              <input className={"profile-edit-settings__search"} type={"text"} placeholder={t("live.feature.champion.search-champion")}
                                                     onChange={onChangeSearchChampion} onClick={() => {
                                                      sendGA4Event("click", {
                                                        screen_category: "setting",
                                                        screen_name: "profile_edit",
                                                        screen_sub_name: "rso_cover_img",
                                                        event_result: "activate_area",
                                                        label_category: "champion_search",
                                                        label_name: "rso_cover_img_bar"
                                                      });
                                                    }}
                                              />
                                              <img src={"../../assets/images/01-icon-icon-search.svg"} width={24}
                                                   style={{
                                                     position: "absolute",
                                                     right: 8,
                                                     top: 8
                                                   }}
                                              />
                                            </div>
                                            <div className={"profile-edit-settings__scroll"}>
                                              {_.sortBy(_.filter(metaChampions.data, (o) => {
                                                if (searchChampion === "") {
                                                  if (selectedSkinChampionId) {
                                                    return o.id === selectedSkinChampionId;
                                                  } else {
                                                    return false;
                                                  }
                                                }
                                                return o.name.indexOf(searchChampion.toLowerCase()) >= 0 || o.key.toLowerCase().indexOf(searchChampion.toLowerCase()) >= 0 || t(`champions.${o.id}`).toLowerCase().indexOf(searchChampion.toLowerCase()) >= 0;
                                              }), (o) => {
                                                if (localStorage.getItem("i18n") !== "kr") {
                                                  return o.key;
                                                } else {
                                                  return o.name;
                                                }
                                              }).map((c: any, index: number) => {
                                                return (
                                                    <div className={"profile-edit-settings__area"} key={index}>
                                                      <div className={"left"}>
                                                        <img src={`${c.image_url}?image=c_crop,h_103,w_103,x_9,y_9/q_auto,w_48`} />
                                                        <div>{t(`champions.${c.id}`)}</div>
                                                      </div>
                                                      <div className={"right"}>
                                                        {c.skins.map((s: any, index:number) => {
                                                          let tmpSkinId = s?.splash_image.split("/splash/")[1].split(".jpg")[0];
                                                          return (
                                                              <div className={"item"} onClick={() => {
                                                                if (selectedSkinId === s.id) {
                                                                  setSelectedSkinChampionId(-1);
                                                                  setSelectedSkinId(-1);
                                                                  window.api.invoke("rso-profile-delete", {
                                                                    type: "cover"
                                                                  });
                                                                } else {
                                                                  sendGA4Event("click", {
                                                                    screen_category: "setting",
                                                                    screen_name: "profile_edit",
                                                                    screen_sub_name: "rso_cover_img",
                                                                    event_result: "apply_edit",
                                                                    label_category: "champion_skin_image",
                                                                    label_name: "rso_cover_img_button"
                                                                  });
                                                                  setSelectedSkinChampionId(c.id);
                                                                  setSelectedSkinId(s.id);
                                                                  window.api.invoke("rso-profile-put", {
                                                                    type: "cover",
                                                                    data: {
                                                                      "cover_champion_id": c.id,
                                                                      "cover_champion_skin_id": s.id
                                                                    }
                                                                  });
                                                                }
                                                              }} key={index}>
                                                            <span className={`overlay`}>
                                                              {/*<img className={"skin-image"} loading={"lazy"} src={`https://desktop-app-data.s3.ap-northeast-2.amazonaws.com/centered/${c.id}/${skinId}.jpg?image=q_auto,w_240,h_160`} />*/}
                                                              <img className={"skin-image"} loading={"lazy"} src={`https://opgg-static.s3.ap-northeast-2.amazonaws.com/meta/centered/${tmpSkinId}.jpg?image=q_auto,w_240,h_160`} />
                                                              {/*<img className={"skin-image"} loading={"lazy"} src={`${s.splash_image}?image=q_auto,w_240,h_160`} />*/}
                                                              <span className={`${(selectedSkinId === s.id && selectedSkinChampionId === c.id) ? "overlay-selected" : "overlay-selected-disabled"}`}>
                                                                <img src={"../../assets/images/01-icon-icon-check.svg"} />
                                                              </span>
                                                            </span>
                                                                <div className={"skin-name"} style={{
                                                                  color: `${(selectedSkinId === s.id && selectedSkinChampionId === c.id) ? "#6e4fff" : "#fff"}`
                                                                }}>{s.name === "default" ? c.name : s.name}</div>
                                                              </div>
                                                          )
                                                        })}
                                                      </div>
                                                    </div>
                                                )
                                              })}
                                              {((selectedSkinId === -1 || !selectedSkinId) && (searchChampion === "" || !searchChampion)) &&
                                                  <div className={"profile-edit-settings__placeholder"}>
                                                    <img src={"../../assets/images/img-cover-image@2x.png"} width={87} style={{marginBottom: 8}} />
                                                    <div dangerouslySetInnerHTML={{__html: t("rso.cover-desc")}}></div>
                                                  </div>
                                              }
                                            </div>
                                          </div>
                                      }
                                      {tabMode2Index === 1 &&
                                          <>
                                            <div className={"profile-edit-settings"}>
                                              <div style={{position: "relative", width: "fit-content"}}>
                                                <input className={"profile-edit-settings__search"} type={"text"} placeholder={t("rso.search-team")}
                                                       onChange={onChangeSearchLeague} onClick={() => {
                                                        sendGA4Event("click", {
                                                          screen_category: "setting",
                                                          screen_name: "profile_edit",
                                                          screen_sub_name: "rso_fan",
                                                          event_result: "activate_area",
                                                          label_category: "search_team",
                                                          label_name: "search_rso_fan_bar"
                                                        });
                                                       }}
                                                />
                                                <img src={"../../assets/images/01-icon-icon-search.svg"} width={24}
                                                     style={{
                                                       position: "absolute",
                                                       right: 8,
                                                       top: 8
                                                     }}
                                                />
                                              </div>
                                              <div className={"profile-edit-settings__scroll"}>
                                                {_.sortBy(_.filter(leagues, (o) => {
                                                  return o?.short_name.indexOf(searchLeague.toUpperCase()) >= 0
                                                  || _.find(teams, (el) => {
                                                        return el?.name?.toLowerCase().indexOf(searchLeague.toLowerCase()) >= 0;
                                                      })?.league_id === o?.id
                                                  || _.find(teams, (el) => {
                                                    return el?.acronym?.toLowerCase().indexOf(searchLeague.toLowerCase()) >= 0;
                                                  })?.league_id === o?.id;
                                                }), (o) => {
                                                  if (o?.id === gpm?.favorite_esport_team?.league_id) {
                                                    return 1;
                                                  } else if (o?.short_name === regionLeague) {
                                                    return 1;
                                                  } else if (_.find(teams, {
                                                    id: selectedTeamId
                                                  })?.league_id === o?.id) {
                                                    return 1;
                                                  }
                                                  return o?.id;
                                                }).map((league, index: number) => {
                                                  return (
                                                      <div className={"profile-edit-settings__area"} key={index}>
                                                        <div className={"left"}>
                                                          <div style={{
                                                            display: "flex",
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                            width: 48,
                                                            height: 48,
                                                            borderRadius: 4,
                                                            backgroundColor: "#282830",
                                                            marginBottom: 4
                                                          }}>
                                                            <img style={{width: 32, height:32}} src={`${league.image_url_white}`} />
                                                          </div>
                                                          <div>{league.short_name}</div>
                                                        </div>
                                                        <div className={"right"}>
                                                          {_.filter(teams, {
                                                            league_id: league.id
                                                          }).map((s: any, index:number) => {
                                                            return (
                                                                <div className={"item"} onClick={() => {
                                                                  if (selectedTeamId === s.id) {
                                                                    setSelectedTeamId(-1);
                                                                    window.api.invoke("rso-profile-delete", {
                                                                      type: "esports"
                                                                    });
                                                                  } else {
                                                                    document.querySelectorAll(".profile-edit-settings__scroll")[0].scrollTo(0, 0);
                                                                    sendGA4Event("click", {
                                                                      screen_category: "setting",
                                                                      screen_name: "profile_edit",
                                                                      screen_sub_name: "rso_fan",
                                                                      event_result: "apply_edit",
                                                                      label_category: "team_image",
                                                                      label_name: "rso_fan_img_button"
                                                                    });
                                                                    setSelectedTeamId(s.id);
                                                                    window.api.invoke("rso-profile-put", {
                                                                      type: "esports",
                                                                      data: {
                                                                        "team_id": s.id
                                                                      }
                                                                    });
                                                                  }
                                                                }} key={index}>
                                                                  <div className={"league-wrapper"}>
                                                                <span className={`overlay overlay-league`}>
                                                                  <img className={"league-image"} loading={"lazy"} src={s.image_url} />
                                                                  <span className={`${selectedTeamId === s.id ? "overlay-selected" : "overlay-selected-disabled"}`}>
                                                                    <img src={"../../assets/images/01-icon-icon-check.svg"} style={{
                                                                      top: 32,
                                                                      left: 32
                                                                    }} />
                                                                  </span>
                                                                </span>
                                                                  </div>

                                                                  <div className={"league-name"} style={{
                                                                    color: `${selectedTeamId === s.id ? "#6e4fff" : "#fff"}`
                                                                  }}>{s.name}</div>
                                                                </div>
                                                            )
                                                          })}
                                                        </div>
                                                      </div>
                                                  )
                                                })}
                                              </div>
                                            </div>
                                            {/*{((!localStorage.getItem("selectedLeague") || localStorage.getItem("selectedLeague") === "0") && (!searchLeague || searchLeague === "")) &&*/}
                                            {/*    <div className={"profile-edit-settings__placeholder"}>*/}
                                            {/*      <img src={"../../assets/images/img-esports-cheer@2x.png"} width={87} style={{marginBottom: 8}} />*/}
                                            {/*      <div>원하는 이스포츠 팀명을 입력해서 내 응원팀을 설정해보세요.<br />*/}
                                            {/*        내 소환사 프로필에 내 응원팀을 노출할 수 있습니다.</div>*/}
                                            {/*    </div>*/}
                                            {/*}*/}
                                          </>
                                      }
                                      {tabMode2Index === 2 &&
                                          <>
                                            <div style={{position: "relative", display: "flex", width: 528}}>
                                              <div style={{position: "relative", width: "100%"}}>
                                                <input className={"profile-edit-settings__search profile-edit-settings__introduce"} type={"text"} placeholder={t("rso.comment-placeholder")}
                                                       onChange={onChangeIntroduce} value={introduce}
                                                       onFocus={(e) => {
                                                         setIsFocus(true);
                                                       }}

                                                       onBlur={() => {
                                                         setIsFocus(false);
                                                       }}

                                                       onClick={() => {
                                                         sendGA4Event("click", {
                                                           screen_category: "setting",
                                                           screen_name: "profile_edit",
                                                           screen_sub_name: "rso_comment",
                                                           event_result: "activate_area",
                                                           label_category: "register_comment",
                                                           label_name: "rso_comment_bar"
                                                         });
                                                       }}

                                                       onKeyDown={(e) => {
                                                         if (e.key === 'Enter') {
                                                           onProfileAddWord(true);
                                                           e.target.blur();
                                                         }
                                                       }}

                                                       style={{
                                                         paddingRight: isFocus ? 62 : 28
                                                       }}
                                                />
                                                <img src={`../../assets/images/icon-comment${introduce ? "" : "-disabled"}.svg`} width={20}
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
                                                          right: `${introduce !== "" ? "28px" : "12px"}`,
                                                          top: 10,
                                                          fontSize: 12,
                                                          color: "#5d5a73"
                                                        }}
                                                    >{introduce.getBytes()}/30</div>
                                                }
                                                {introduce !== "" &&
                                                  <img src={"../../assets/images/icon-delete.svg"} width={16}
                                                       style={{
                                                         position: "absolute",
                                                         right: 8,
                                                         top: 9,
                                                         cursor: "pointer"
                                                       }}
                                                       onClick={onClickRemoveIntroduce}
                                                  />
                                                }
                                              </div>
                                              {(gpm?.word?.content && !deleteClicked || saveClickedAfter) &&
                                                  <div className={`profile-edit-settings__introduce-delete`}
                                                       onClick={() => {
                                                         sendGA4Event("click", {
                                                           screen_category: "setting",
                                                           screen_name: "profile_edit",
                                                           screen_sub_name: "rso_comment",
                                                           event_result: "apply_edit",
                                                           label_category: "delete_comment",
                                                           label_name: "rso_comment_delete_button"
                                                         });
                                                         setIntroduce("");
                                                         setDeleteClicked(true);
                                                         setSaveClickedAfter(false);
                                                         window.api.invoke("rso-profile-delete", {
                                                           type: "word"
                                                         });
                                                       }}
                                                  >
                                                    {t("rso.delete")}
                                                  </div>
                                              }
                                              <div className={`profile-edit-settings__introduce-save ${introduce ? "profile-edit-settings__introduce-save-active" : ""} ${introduceSaveClicked ? "profile-edit-settings__introduce-save-disabled" : ""} `}
                                                   onClick={() => {
                                                     onProfileAddWord();
                                                   }}
                                              >
                                                {t("rso.add")}
                                              </div>
                                            </div>
                                            {(!introduce && !gpm?.word) &&
                                                <div className={"profile-edit-settings__placeholder"}>
                                                  <img src={"../../assets/images/img-my-comment@2x.png"} width={87} style={{marginBottom: 8}} />
                                                  <div dangerouslySetInnerHTML={{__html: t("rso.word-desc")}}></div>
                                                </div>
                                            }
                                          </>
                                      }
                                    </>
                                    : <>
                                      {summonerName &&
                                          <>
                                            {t("rso.rso-connect")}
                                          </>
                                      }
                                    </>
                                }
                              </>
                              : <div>
                                <RSOIntroduce type={"rso"} />
                              </div>
                          }
                        </>
                        : <div>
                          <RSOIntroduce type={"op.gg"} />
                        </div>
                    }
                  </>
                  : <>
                    <RSOIntroduce type={"client"} />
                  </>
              }
              </>
          }
        </div>
      </div>
      <VCRedistModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </Modal>
  )
}

const RSOIntroduce = ({type}: any) => {
  const {t} = useTranslation();

  const onClickLoginButton = () => {
    window.api.openExternal("https://member.op.gg/?redirect_url=https://member.op.gg/client-login&remember_me=true");
  }

  useEffect(() => {
    sendGA4Event("view", {
      screen_category: "setting",
      screen_name: "profile_edit",
      screen_sub_name: "rso_intro"
    });
  }, []);

  return (
      <div className={"rso-introduce"}>
        <div style={{fontSize: 14, marginBottom: 4}}>
          {type === "op.gg"
              ? <div style={{fontWeight: "bold"}}>{t("rso.opgg-connect")}</div>
              : <>
                {type === "client"
                    ? <div>{t("rso.client-connect")}</div>
                    : <div>{t("rso.rso-connect")}</div>
                }
              </>
          }
        </div>
        <div style={{fontSize: 14}}>{t("rso.mypage-desc")}</div>
        <div className={"rso-introduce__features"}>
          <div className={"rso-introduce__features-item"}>
            <img src={"../../assets/images/img-game-memo@2x.png"} width={71} />
            <div>{t("rso.memo")}</div>
          </div>
          <div className={"rso-introduce__features-item"}>
            <img src={"../../assets/images/img-certification-url@2x.png"} width={71} />
            <div>{t("rso.url")}</div>
          </div>
          <div className={"rso-introduce__features-item"}>
            <img src={"../../assets/images/img-certification-mark@2x.png"} width={71} />
            <div>{t("rso.verified")}</div>
          </div>
          <div className={"rso-introduce__features-item"}>
            <img src={"../../assets/images/img-cover-image@2x.png"} width={71} />
            <div>{t("rso.cover")}</div>
          </div>
          <div className={"rso-introduce__features-item"}>
            <img src={"../../assets/images/img-esports-cheer@2x.png"} width={71} />
            <div>{t("rso.esports")}</div>
          </div>
          <div className={"rso-introduce__features-item"}>
            <img src={"../../assets/images/img-my-comment@2x.png"} width={71} />
            <div>{t("rso.word")}</div>
          </div>
        </div>
        {type !== "client" &&
          <div className={"rso-introduce__btn"} onClick={() => {
            if (type === "op.gg") {
              sendGA4Event("click", {
                screen_category: "setting",
                screen_name: "profile_edit",
                screen_sub_name: "rso_intro",
                event_result: "move_web",
                label_category: "description",
                label_name: "member_login_button"
              });
              onClickLoginButton();
            } else {
              sendGA4Event("click", {
                screen_category: "setting",
                screen_name: "profile_edit",
                screen_sub_name: "rso_intro",
                event_result: "move_web",
                label_category: "description",
                label_name: "rso_login_button"
              });
              window.api.invoke("member-ott").then((data) => {
                if (data) {
                  window.api.openExternal(`https://member-node.op.gg/api/redirect?ott=${data.token}&ts=${data.ts}&url=https%3A%2F%2Fmember.op.gg%2F%3Fredirect_url%3Dhttps%3A%2F%2Fmember.op.gg%2Fsettings%26attach_redirect_url%3Dhttps%3A%2F%2Fmember.op.gg%2Fclient-login`);
                } else {
                  window.api.openExternal("https://member.op.gg/?redirect_url=https://member.op.gg/settings/edit&remember_me=true");
                }
              });
            }
          }}>
            {type === "op.gg"
                ? <div>{t("opgg-login")}</div>
                : <div>{t("rso.link")}</div>
            }
          </div>
        }
      </div>
  )
}

interface TabModeProps {
  index: number,
  setIndex: React.Dispatch<React.SetStateAction<number>>,
  content: {
    title: string;
    icon: string;
  }[]
}

const TabsMode = ({ index, setIndex, content }: TabModeProps) => {
  return (
      <div className="statistics-tabs mode-tabs">
        {content.map((tab, i) => (
            <div className={`recommendation-tab-mode ${index === i ? "recommendation-tab-mode-active" : ""}`}
                 onClick={() => setIndex(i)} key={i}>
              <img width={16} height={16} src={`../../assets/images/${tab.icon}${index === i ? "on" : "off"}.svg`} alt={tab.title} />
              <span className={`recommendation-tab-mode-title ${index === i ? "recommendation-tab-mode-title-active" : ""}`}>{tab.title}</span>
            </div>
        ))}
      </div>
  );
};

interface TabMode2Props {
  index: number,
  setIndex: React.Dispatch<React.SetStateAction<number>>,
  content: {
    title: string;
    icon: string;
    type: string;
  }[]
}

const TabsMode2 = ({ index, setIndex, content }: TabModeProps) => {
  const {t} = useTranslation();

  useEffect(() => {
    let subName = "rso_cover_img";
    if (index === 0) {

    } else if (index === 1) {
      subName = "rso_fan";
    } else if (index === 2) {
      subName = "rso_comment";
    }
    sendGA4Event("view", {
      screen_category: "setting",
      screen_name: "profile_edit",
      screen_sub_name: subName
    });
  }, [index]);

  return (
      <div className="statistics-tabs mode-tabs">
        {content.map((tab, i) => (
            <div className={`recommendation-tab-mode ${index === i ? "recommendation-tab-mode-active" : ""}`}
                 onClick={() => {
                   if (i === 0) {
                     sendGA4Event("click", {
                       screen_category: "setting",
                       screen_name: "profile_edit",
                       event_result: "move_screen",
                       label_category: "local_nav",
                       label_name: "rso_cover_img_button"
                     });
                   } else if (i === 1) {
                     sendGA4Event("click", {
                       screen_category: "setting",
                       screen_name: "profile_edit",
                       event_result: "move_screen",
                       label_category: "local_nav",
                       label_name: "rso_fan_button"
                     });
                   } else if (i === 2) {
                     sendGA4Event("click", {
                       screen_category: "setting",
                       screen_name: "profile_edit",
                       event_result: "move_screen",
                       label_category: "local_nav",
                       label_name: "rso_comment_button"
                     });
                   }
                   setIndex(i);
                 }} key={i}>
              <span className={`recommendation-tab-mode-title ${index === i ? "recommendation-tab-mode-title-active" : ""}`}>{t(`rso.${tab.type}`)}</span>
            </div>
        ))}
      </div>
  );
};


interface VCRedistModalProps {
  isModalOpen: boolean,
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
}

const VCRedistModal = ({isModalOpen, setIsModalOpen}: VCRedistModalProps) => {
  const {t} = useTranslation();

  const onRequestClose = () => {
    setIsModalOpen(false);
  }

  return (
    <div className={`vcredist-modal${isModalOpen ? " vcredist-modal__open" : ""}`} onClick={onRequestClose}>
      <div className={"popup-settings-close"} onClick={() => {
        setIsModalOpen(false);
      }}>
        <img src={"../../assets/images/icon-close-wh.svg"}/>
      </div>
      <div className={"title"}>재배포 패키지를 다운로드 후 설치했으면 앱 재시작을 눌러주세요!</div>
      <div
        onClick={() => {
          window.api.send("app-restart");
        }}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "30px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "12px",
          backgroundColor: "#6b42dc",
          padding: "0 12px",
          marginLeft: "8px",
          marginTop: "20px"
        }}
      >앱 재시작
      </div>
    </div>
  )
}

export default Settings;
