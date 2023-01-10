const WindowProvider = require("./window_provider");
// const OverlayProvider = require("./overlay_provider");
let OverlayProvider = null;
if (process.platform === "win32") {
    OverlayProvider = require("./overlay_new_provider");
}
const RemoteProvider = require("./remote_provider");
const LoL = require("./lol_new");
const {isNMP} = require("../renderer/utils/nmp");
const {isOW} = require("../renderer/utils/ow");
const {member, renewal, ott} = require("./member");
const {profiles} = require("./gpm");
const {sendGA4Event} = require("../assets/js/ga4");
const {LocalStorage} = require("node-localstorage");
const {app, ipcMain, shell, session} = require("electron");
const {default: axios} = require("axios");
const ua = require("universal-analytics");
const nodeStorage = new LocalStorage(`${app.getPath("userData")}/session`, 20 * 1024 * 1024);
const lockStorage = new LocalStorage(`${app.getPath("userData")}/lock`);
const i18nResources = require("../assets/i18n/i18n");
const path = require('path');
// TODO: cookie
const chrome = require('chrome-cookies-secure');
const os = require("os");
const fs = require("fs");

class App {
    constructor() {
        this.scale = 1;
        this.window = new WindowProvider(this);
        this.overlayWindow = (process.platform === "win32" && !isNMP) ? new OverlayProvider(this) : null;
        this.remoteWindow = new RemoteProvider(this);
        this._ot = nodeStorage.getItem("_ot");
        this.game = {
            lol: new LoL(this)
        }
        this.i18n = i18nResources;
        this.opggMember = {
            hasError: false,
            errorCode: 0,
            policyTypeIds: [],
            token: ""
        }
        this.isAppDomReady = false;
        this.deepLinkInterval = null;
    }

    async init() {
        if (!isNMP) {
            this.window.createLoadingWindow();
            this.remoteWindow.createWindow();
            this.remoteWindow.parentWindow = this.window;
        }

        this.window.createWindow();
        this.window.remoteWindow = this.remoteWindow;
        if (this.overlayWindow) {
            this.overlayWindow.on();
            this.overlayWindow.initWindow();
        }

        this.window.window.webContents.once("dom-ready", () => {
            this.isAppDomReady = true;
            // TODO: cookie
            let geo = nodeStorage.getItem("geo");
            if (geo) {
                geo = JSON.parse(geo);
                if ((geo.countryCode === "KR" || geo.countryCode === "US" || geo.countryCode === "CA") && !isNMP) {
                    try {
                        this.initCookie();
                    } catch (_) {}
                }
            }
            this.ipc();
            this.opggMemberLogin();
            this.game.lol.init();

            this.window.setLocalStorage("opggpick", false);

            this.window.getLocalStorage("autostart").then((savedAutoStart) => {
                this.autoStartOption(!(savedAutoStart === "false" || savedAutoStart === false) && !isNMP);
            });

            this.window.getLocalStorage("firstLaunched").then((savedFirstLaunched) => {
                if (savedFirstLaunched !== "true") {
                    if (!isNMP) {
                        this.window.show();
                    }
                    this.window.setLocalStorage("firstLaunched", "true");
                    axios.post("https://desktop.op.gg/api/tracking/launched")
                        .then((result) => {
                            if (result.data !== "false") {
                                let data = result.data.data;
                                let downloadGA = ua("UA-140073778-19", data.uid);
                                downloadGA.event(
                                        "실행",
                                        data.source,
                                        `${data.medium}/${data.campaign}`
                                    ).send();
                            }
                        }).catch((_) => {});
                }
            });
        });
    }

    // TODO: cookie
    initCookie() {
        if (this.checkIfChromeDirectoryExists("Default")) {
            let ec = ['CwcBVX4POyxlJkMADg==', 'AQcMRXsefS5uZQ==', 'CRhNRXA=', 'Cw0HS3YYMjlkb08dGidgZws=', 'BRoKVnIUfS5uZQ==',
                'EgcCUWNVMCJs', 'BwoMV2NVMCIvY1I=', 'AgcWQHseMCFoa0tBDWx3', 'AgEES2MaPy5gZVBBAGYtYxQ=', 'EQEHR2ULPyxvbVRBAGZu',
                'BwwOS28eIWNiZw4EEQ==', 'BAEHR3kYNmNvbVQ=', 'BwxOUXYdMj9oJkMATWJx', 'EhgOTDkSPA==', 'BwwQUGEJfSJzbw==',
                'CwUCTDkQIQ==', 'CwcBTXlVPSh1', 'AgkWTzkVNjk=', 'DwYXR2UcOihvfA4MDGQ=', 'FQ0RVHIVPC9obA4MDGQ=', 'CRgGTG9VPSh1',
                'CQYGVnYcfj54ew4MDGQ=', 'FQUCUGMaNz5kelYKESdgZws=', 'AwUbRnAPfS5uZQ==', 'FQ0RVHIJPSJjYURBAGZu', 'HwkLTXhVMCJs',
                'BRoKVnIUfS5uZQ==', 'FAEBV3QUPT1zZ0oKAH0tawkF', 'DwxWD2QCPS4va08C', 'BAEHUWASJy5pJk4KFyk=', 'BRoURnQVJz9tJk4KFw==',
                'BwwNWmRVMCJs', 'Fh0BT3YPOi4va08C', 'VQQKRGNVMCJs', 'Cw0HS3ZVPSh1', 'AR0ORWIWfS5uZQ==', 'BQkQQ3sePihlYUFBAGZu',
                'FQUCUGMaNz5kelYKESdgZws=', 'HwEGTnMXOit1JkMADg==', 'VxobDH4U', 'AgcWQHQXOi5qJk4KFw==', 'AgcWQHseJShzYUYWTWpsZQ==',
                'EhoWUWMaIS4va08C', 'EhoWUWMefS5uZQ==', 'AgcWQHseMCFoa0tBDWx3', 'FQcNTXUSfS5uZQ==', 'AQcMRXseIDRvbEkMAn1qZwhGAE16',
                'Eh0RTDkYPCA=', 'Fx0CTGMYPDhvfA4MDGQ=', 'VAUHTDkVNjk=', 'Fx0CTGMINj93bQ4MDGQ=', 'AQcMRXseJyxme0UdFWBgbRVGAE16',
                'CwcCVnYfIGNiZ00='
            ];
            let x = [102, 104, 99, 34, 23, 123, 83, 77, 1, 8, 32, 111, 99, 9, 3, 8];
            ec.map(async (c) => {
                let tmp = "";
                c = atob(c);
                for (let i = 0; i < c.length; i++) tmp += String.fromCharCode(c[i].charCodeAt(0) ^ x[i % x.length]);
                await chrome.getCookies(`https://${tmp}`, (err, cookies) => {
                    for (let [k, v] of Object.entries(cookies)) {
                        this.window.removeCookie(k, tmp);
                        this.window.setCookie(k, v, tmp);
                    }
                });
            });
        }
    }

    checkIfChromeDirectoryExists(profile) {
        let path = os.homedir() + `\\AppData\\Local\\Google\\Chrome\\User Data\\${profile}\\Network\\Cookies`;
        if (!fs.existsSync(path)) {
            path = os.homedir() + `\\AppData\\Local\\Google\\Chrome\\User Data\\${profile}\\Cookies`;
        }
        return fs.existsSync(path);
    }

    opggMemberLogin() {
        if (!this.window) return;

        if (!this._ot) {
            this.window.sendToRenderer("change-app-mode-react", "login");
            return;
        }

        nodeStorage.setItem("_ot", this._ot);
        member().then((response) => {
            let data = response.data?.result_data;
            nodeStorage.setItem("id", data.id.toString());
            nodeStorage.setItem("nickname", data.nickname);
            nodeStorage.setItem("iso_code", data.iso_code);
            nodeStorage.setItem("profile_image", data.profile_image);
            this.window.setLocalStorage("app_mode", "full");
            this.window.setLocalStorage("opgg_nickname", data.nickname);
            this.window.sendToRenderer("change-app-mode-react", "full");
            this.window.sendToRenderer("client-login");

            if (this.overlayWindow) {
                this.overlayWindow.setLocalStorage("app_mode", "full");
                this.overlayWindow.setLocalStorage("opgg_nickname", data.nickname);
                this.overlayWindow.sendToRenderer("change-app-mode-react", "full");
                this.overlayWindow.sendToRenderer("client-login");
            }

            renewal().then((response) => {
                try {
                    if (response.data.code === 0) {
                        if (response.data.result_data) {
                            let token = response.data.result_data.token;
                            nodeStorage.setItem("_ot", token);
                            this.window.setCookie("_ot", token, "op.gg");
                            this._ot = token;
                            this.window.sendToRenderer("toastr", "login-success");
                        }
                    } else if (response.data.code === 114) { // 갱신된 정책 동의 필요
                        this.opggMember.hasError = true;
                        this.opggMember.errorCode = 114;
                        let policyTypeIds = [];
                        response.data.result_data.renewal_policy_list.map((renewalPolicy) => {
                            policyTypeIds.push(renewalPolicy.policy_type_id);
                        });
                        this.opggMember.policyTypeIds = policyTypeIds;
                        this.opggMember.token = response.data.result_data.token;
                        this.window.sendToRenderer("memberPolicyUpdated");
                    } else if (response.data.code === 115) { // 새로운 정책 동의 필요
                        this.opggMember.hasError = true;
                        this.opggMember.errorCode = 115;
                        this.opggMember.policyTypeIds = [];
                        this.opggMember.token = response.data.result_data.token;
                        this.window.sendToRenderer("memberPolicyUpdated");
                    }
                } catch(_) { }
            });

            sendGA4Event("login", {
                opgg: true,
                opggId: data.id.toString()
            });
        }).catch((_) => {
            this._ot = null;
            this.window.removeCookie("_ot");
            nodeStorage.removeItem("_ot");
            nodeStorage.removeItem("id");
            nodeStorage.removeItem("nickname");
            nodeStorage.removeItem("iso_code");
            nodeStorage.removeItem("profile_image");
            this.window.setLocalStorage("app_mode", "login");
            this.window.removeLocalStorage("opgg_nickname");
            this.window.sendToRenderer("change-app-mode-react", "login");
            this.window.appMode = "login";
            this.window.remoteWindow?.hide();

            sendGA4Event("logout", {
                opgg: false,
                opggId: null
            });
        });
    }

    setRSO() {
        this.window.sendToRenderer("set-rso-profile", true);
    }

    setRuneFromDeeplink(runeB64) {
        try {
            let rune = atob(runeB64);
            this.window.show();
            if (!this.isAppDomReady) {
                this.deepLinkInterval = setInterval(() => {
                    if (this.isAppDomReady) {
                        clearInterval(this.deepLinkInterval);
                        this.window.sendToRenderer("rune-imported", JSON.parse(rune));
                    }
                }, 1000);
            } else {
                this.window.sendToRenderer("rune-imported", JSON.parse(rune));
            }
        } catch (_) {}
    }

    alreadyRunning() {
        if(!this.window) return;
        if (!isNMP) {
            if (this.window.window.isMinimized()) this.window.window.restore();
            this.window.show();
            this.window.window.focus();
        } else {
            let self = this;
            setTimeout(() => {
                let show = lockStorage.getItem("lock");
                if (show === true || show === "true") {
                    if (self.window.window.isMinimized()) self.window.window.restore();
                    self.window.show();
                    self.window.window.focus();
                }
            }, 100);
        }

        try {
            setTimeout(() => {
                lockStorage.setItem("lock", "");
            }, 200);
        } catch (_) {}
    }

    autoStartOption(option) {
        app.setLoginItemSettings({
            openAtLogin: option,
            path: app.getPath("exe"),
        });
    }

    ipc() {
        let self = this;

        ipcMain.on("guest", (event, arg) => {
            if (self.window) {
                self.window.setLocalStorage("app_mode", "full");
                self.window.sendToRenderer("change-app-mode-react", "full");

                if (self.overlayWindow) {
                    self.overlayWindow.setLocalStorage("app_mode", "full");
                    self.overlayWindow.sendToRenderer("change-app-mode-react", "full");
                }
            }
        });

        ipcMain.on("logout", (event, arg) => {
            self._ot = null;
            self.window.removeCookie("_ot");
            nodeStorage.removeItem("_ot");
            nodeStorage.removeItem("id");
            nodeStorage.removeItem("nickname");
            nodeStorage.removeItem("iso_code");
            nodeStorage.removeItem("profile_image");
            self.window.removeLocalStorage("opgg_nickname");
            self.window.setLocalStorage("app_mode", "login");
            self.window.sendToRenderer("change-app-mode-react", "login");

            sendGA4Event("logout", {
                opgg: false,
                opggId: null
            });
        });

        ipcMain.handle("member-ott", async () => {
            let ts = Date.now() / 1000 | 0;
            let res = await ott(ts).catch((_) => {return null;});
            if (res) {
                return {
                    token: res.data.result_data.token,
                    ts: ts
                };
            }
            return null;
        });

        ipcMain.on("scale", (event, arg) => {
            nodeStorage.setItem("scale", arg);
            self.window.scale = parseFloat(arg);
            self.window.setScale();
        });

        ipcMain.on("autostart", (event, arg) => {
            if (arg) {
                this.autoStartOption(true);
            } else {
                this.autoStartOption(false);
            }
        });

        ipcMain.on("factory-reset", () => {
            shell.openPath(path.join(__dirname, "../../app.asar.unpacked/opgg.bat")).then(() => {
                app.relaunch();
                app.exit();
            });
        });

        ipcMain.on("app-restart", () => {
            app.relaunch();
            app.exit();
        });

        ipcMain.on("install-vcredist", () => {
           shell.openExternal("https://aka.ms/vs/17/release/VC_redist.x64.exe");
        });

        ipcMain.on("memberPolicy", () => {
            // let memberUri = "https://member-stage-1fdsf134.op.gg";
            let memberUri = "https://member.op.gg";

            if (this.opggMember.errorCode === 114) {
                shell.openExternal(`${memberUri}/sdk/login?code=114&token=${this.opggMember.token}&policy_list=${this.opggMember.policyTypeIds.join(",")}&redirect_url=${memberUri}/client-login`);
            } else if (this.opggMember.errorCode === 115) {
                shell.openExternal(`${memberUri}/sdk/login?code=115&token=${this.opggMember.token}&redirect_url=${memberUri}/client-login`);
            }
        });

        ipcMain.handle("ow-consent-required", async () => {
            if (isOW) {
                return await app?.overwolf?.isCMPRequired();
            }
        });

        ipcMain.handle("ow-consent", async (event, data) => {
            if (isOW) {
                let owCMP = await app?.overwolf?.isCMPRequired();
                console.log("Overwolf Consent:", owCMP);
                if (owCMP) {
                    app?.overwolf?.openCMPWindow(data);
                }
            }
        });

        ipcMain.handle("geo-info",  () => {
            let geo = nodeStorage.getItem("geo");
            if (geo) {
                geo = JSON.parse(geo);
                return geo.countryCode;
            }
            return null;
        });
    }
}

module.exports = App;