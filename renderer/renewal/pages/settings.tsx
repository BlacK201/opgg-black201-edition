import React, {ChangeEvent, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import Modal from "react-modal";
import {getSettingInLocalStorage} from "../../lib";
import {setIsSettingOpen, setClientLogin, setIsAutoRune, setIsAutoSpell, setIsAutoAccept, setApril} from "../../redux/slices/common";
import {LANGUAGE_LIST} from "../../constants";
import {useTypedSelector} from "../../redux/store";
import {useDispatch} from "react-redux";
import sendGA4Event from "../../utils/ga4";

const {isNMP} = require("../../utils/nmp");

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
    zIndex: "1000",
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

const Settings = () => {
  const dispatch = useDispatch();
  const {t, i18n} = useTranslation();
  const [index, setIndex] = useState<number>(0);
  const {isSettingOpen, clientLogin} = useTypedSelector(state => state.common);
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
    }
    window.api.send(ipcEventKey, checked);
    localStorage.setItem(storageKey, String(e.target.checked));
    sendGA4Event(`setting_${ipcEventKey}`, {
      on: e.target.checked
    });
  };
  let lang = localStorage.getItem("i18n");

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
    localStorage.setItem("i18n", lang);
    window.api.send("i18n-changed", lang);
    i18n.changeLanguage(lang);
  };

  useEffect(() => {
    gameSettings.isSpell = isNMP ? localStorage.getItem("isSpell") === "true" : getSettingInLocalStorage("isSpell");
    // console.log(gameSettings.isSpell);
    window.api.send("isSpell", gameSettings.isSpell);
    dispatch(setIsAutoSpell(gameSettings.isSpell));
  }, [isNMP ? localStorage.getItem("isSpell") === "true" : getSettingInLocalStorage("isSpell")]);

  useEffect(() => {
    if (isSettingOpen) {
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

  let loginTimeout: any = null;
  useEffect(() => {
    if (clientLogin) {
      loginTimeout = setTimeout(() => {
        nickname = localStorage.getItem("opgg_nickname");
        dispatch(setClientLogin(false));
      }, 1000);
    }

    return () => {
      clearTimeout(loginTimeout);
    }
  }, [clientLogin]);

  let showBeacon = (visible: boolean) => {
    let beacon = document.getElementById("beacon-container");
    if (beacon) {
      beacon.style.display = visible ? "block" : "none";
    }
  }

  const onClickClose = () => {
    showBeacon(false);
    clearTimeout(loginTimeout);
    dispatch(setIsSettingOpen(false));
  }

  const onClickLoginButton = () => {
    if (nickname) {
      showBeacon(false);
      dispatch(setIsSettingOpen(false));
      window.api.send("logout");
    } else {
      window.open("https://member.op.gg/?redirect_url=https://member.op.gg/client-login&remember_me=true", '_blank');
    }
  }

  return (
    <Modal
      style={customStyles}
      isOpen={isSettingOpen}
      contentLabel="Example Modal"
    >
      <div className="popup-settings">
        <div className={"popup-settings-close"} onClick={onClickClose}>
          <img src={"../../assets/images/icon-close-wh.svg"}/>
        </div>
        <div className={"popup-settings-side"}>
          {lang === "kr" &&
              <div className={"popup-settings-side-top"}>
                  <div className={"popup-settings-profile"}>
                      <div className={"popup-settings-profile-img"}>
                          <img src={"../../assets/images/opgg-logo-square.svg"}/>
                      </div>
                      <div className={"popup-settings-profile-info"}>
                          <div>{nickname ?? "Login Please"}</div>
                        {nickname
                          ? <div>OP.GG Account</div>
                          : <div></div>
                        }
                      </div>
                  </div>
                  <div className={"popup-settings-login"} onClick={onClickLoginButton}>
                    {nickname
                      ? "OP.GG Logout"
                      : "OP.GG Member Login"
                    }
                  </div>
              </div>
          }
          <div className={"popup-settings-side-bottom"}>
            <div className={"popup-settings-side-bottom-section"}>{t("sidebar.settings")}</div>
            <div
              className={`popup-settings-side-bottom-section-row ${index === 0 ? "popup-settings-side-bottom-section-row-active" : ""}`}
              onClick={() => setIndex(0)}>{t("settings.game")}</div>
            <div
              className={`popup-settings-side-bottom-section-row ${index === 1 ? "popup-settings-side-bottom-section-row-active" : ""}`}
              onClick={() => setIndex(1)}>{t("settings.language")}</div>
          </div>
          <div className={"if-award"} onClick={() => {
            window.api.openExternal("https://ifdesign.com/en/winner-ranking/project/opgg-for-desktop/350772");
          }} style={{position: "absolute", left: "28px", bottom: "18px"}}>
            <img src={"../../assets/images/iF2022.svg"} width={160} />
          </div>
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

                {!isNMP &&
                    <div className={"popup-settings-main-row"}>
                        <div style={{display: "flex", alignItems: "center"}}>
                            <div className={"popup-settings-main-row-title"}
                                 style={{alignItems: "center", display: "flex"}}>{t("settings.overlay")} <img
                                className="img-overlay-beta" src={"../../assets/images/overlay-beta.svg"}/></div>
                            <label className="switch">
                                <input type="checkbox" checked={gameSettings.isOverlay}
                                       onChange={onChangeIsOverlay}/>
                                <span className="slider round"></span>
                            </label>
                        </div>
                        <div className="popup-settings-main-row-desc">{t("settings.overlay-desc")}</div>
                    </div>
                }

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
        </div>
      </div>
      <VCRedistModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </Modal>
  )
}

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
