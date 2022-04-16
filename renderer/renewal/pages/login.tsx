import React, {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import sendGA4Event from "../../utils/ga4";
// const { ipcRenderer, remote } = globalThis.require('electron');
// const appVersion = remote.app.getVersion();

const Login = () => {
  const {t} = useTranslation();

  let isOverlay;
  if (process.env.NODE_ENV === "development") {
    isOverlay = navigator.userAgent.includes("overlay");
  } else {
    isOverlay = location.href.includes("overlay");
  }

  let i18n = localStorage.getItem("i18n");

  const [user, setUser] = useState({
    username: "",
    password: "",
  });

  const { username, password } = user;

  useEffect(() => {
    sendGA4Event("view_login_page", {
      "menu_name": "full"
    });
  }, []);

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setUser({ ...user, [id]: value });
  };

  const onClick = () => {
    if (i18n === "kr") {
      window.open("https://member.op.gg/?redirect_url=https://member.op.gg/client-login&remember_me=true", '_blank')
    } else {
      window.api.send("guest");
    }
  }

  const onSignUpClick = () => {
    window.open("https://member.op.gg/?redirect_url=https://member.op.gg/client-login&remember_me=true", '_blank')
  }

  const onGuestClick = () => {
    window.api.send("guest");
  }

  return (
      <>
        <div className="draggable"></div>
        <div className="main-container login">
          <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 48 48"
              className="login-opggIcon"
          >
            <g fill="none" fillRule="evenodd">
              <g fill="#FFF" fillRule="nonzero">
                <g>
                  <g>
                    <g>
                      <path
                          d="M33.273 25.032c2.505 0 4.869 1.103 6.485 3.025l.24.284-.31.207-2.74 1.829-.23.153-.192-.197c-.867-.887-2.022-1.3-3.253-1.3-2.51 0-4.554 1.97-4.554 4.483 0 2.514 2.043 4.559 4.554 4.559 2.122 0 3.53-1.2 3.807-2.54h-3.463v-3.037h7.557c.017.212.041.548.058 1.018.027.79-.014 1.275-.173 2.228C40.416 39.603 37.432 42 33.273 42c-4.673 0-8.475-3.805-8.475-8.484 0-4.678 3.802-8.484 8.475-8.484zm-17.798-.002c2.506 0 4.87 1.103 6.485 3.025l.239.284-.309.206-2.74 1.83-.23.153-.192-.198c-.866-.887-2.021-1.298-3.253-1.298-2.51 0-4.554 1.969-4.554 4.482s2.043 4.558 4.554 4.558c2.123 0 3.53-1.2 3.807-2.539h-3.463v-3.037h7.556c.019.211.042.547.059 1.018.027.79-.014 1.274-.174 2.228-.642 3.859-3.626 6.256-7.785 6.256-4.673 0-8.475-3.805-8.475-8.484 0-4.678 3.802-8.484 8.475-8.484zM15.483 6c4.677 0 8.483 3.81 8.483 8.491 0 4.683-3.806 8.492-8.483 8.492-4.677 0-8.483-3.809-8.483-8.492C7 9.81 10.806 6 15.483 6zm18.535.004c3.573 0 6.064 2.82 6.064 6.47 0 3.67-2.62 6.471-6.064 6.471h-4.63v4.024h-3.806V6.004zm6.064 13.523c.949 0 1.72.772 1.72 1.721 0 .95-.771 1.721-1.72 1.721-.948 0-1.72-.772-1.72-1.721 0-.95.772-1.721 1.72-1.721zM15.483 10.03c-2.458 0-4.457 2.002-4.457 4.462s2 4.462 4.457 4.462 4.456-2.002 4.456-4.462-1.999-4.462-4.456-4.462zM34 9.928h-4.611v5.092h4.61c1.592 0 2.077-1.467 2.077-2.546 0-1.046-.485-2.546-2.076-2.546z"
                          transform="translate(-154.000000, -222.000000) translate(105.000000, 180.000000) translate(49.000000, 42.000000) translate(0.000000, 0.000000)"
                      />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </svg>
          <div className="login-title">{t("login.title")}</div>
          {!isOverlay &&
          <>
              <button
                className="login-button"
                onClick={onClick}
                // disabled={!Boolean(username && password)}
            >
                {i18n === "kr"
                    ? <>{t("login.button")}</>
                    : <>{t("login.start")}</>
                }

            </button>
            {i18n === "kr" &&
              <>
                <div className={"sign-up"}>
                  <div>{t("login.signup-title")}</div>
                  <div className={"sign-up-link"} onClick={onSignUpClick}>{t("login.signup")}</div>
                </div>
                <div className={"sign-up"} style={{marginTop: "8px"}}>
                <div>{t("login.or")}</div>
                <div className={"guest-link"} onClick={onGuestClick}>{t("login.guest")}</div>
                </div>
              </>
            }
            </>
            }
          <div className="login-help">
            {/*<div className="login-help-item">Create Account</div>*/}
            {/*<div className="login-help-item">Guest Mode</div>*/}
            <div className={"if-award"} onClick={() => {
              window.api.openExternal("https://ifdesign.com/en/winner-ranking/project/opgg-for-desktop/350772");
            }}>
              <img src={"../../assets/images/iF2022.svg"} width={160} />
            </div>
            <div className={"riot-notice"}>© 2012-2022 OP.GG. OP.GG isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.</div>
          </div>
          {/*<div className="login-version">V.{window.appVersion}</div>*/}
        </div>
        <div className="login-right">
          {/*<img className={"login-main-image"} src={"../../assets/images/login-main.png"} />*/}
          <video muted autoPlay loop id="bg-video">
            <source src="../../assets/images/main-jinx.mp4" type="video/mp4"></source>
          </video>
          <div className={"login-banner"}>
            <img className={"login-banner-img"} src={"../../assets/images/login-banner.png"} />
            <div style={{color: "#6f6f6f", fontSize: "14px", fontWeight: "bold"}}>{t("lol")}</div>
            <div style={{color: "#fff", fontSize: "24px", margin: "12px 0", fontWeight: "bold"}}>{t("login.slogan")}</div>
            <div style={{color: "#7b7a8e", fontSize: "12px", display: "flex", alignItems: "center"}}><img src={"../../assets/images/icon-game-dark.svg"} style={{marginRight: "8px"}} />{t("login.supports")}</div>
            <div style={{color: "#7b7a8e", fontSize: "12px", marginTop: "8px"}}>{t("login.features")}</div>
          </div>
        </div>
      </>
  );
};

export default Login;
