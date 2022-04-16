const WindowProvider = require("./window_provider");
const OverlayProvider = require("./overlay_provider");
const RemoteProvider = require("./remote_provider");
const LoL = require("./lol_new");
const {isNMP} = require("../renderer/utils/nmp");
const {member, renewal} = require("./member");
const {sendGA4Event} = require("../assets/js/ga4");
const {LocalStorage} = require("node-localstorage");
const {app, ipcMain, shell} = require("electron");
const {default: axios} = require("axios");
const ua = require("universal-analytics");
const nodeStorage = new LocalStorage(`${app.getPath("userData")}/session`);
const lockStorage = new LocalStorage(`${app.getPath("userData")}/lock`);
const i18nResources = require("../assets/i18n/i18n");
const path = require('path');

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
    }

    init() {
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
            this.ipc();
            this.opggMemberLogin();
            this.game.lol.init();

            this.window.getLocalStorage("autostart").then((savedAutoStart) => {
                this.autoStartOption(!(savedAutoStart === "false" || savedAutoStart === false) && !isNMP);
            });

            this.window.getLocalStorage("firstLaunched").then((savedFirstLaunched) => {
                if (savedFirstLaunched !== "true") {
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
                            this.window.setLocalStorage("firstLaunched", "true");
                        }).catch((_) => {});
                }
            });
        });
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
                            this.window.setCookie("_ot", token);
                            this._ot = token;
                        }
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

        setTimeout(() => {
            lockStorage.setItem("lock", "");
        }, 200);
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

        ipcMain.on("scale", (event, arg) => {
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
            console.log(path.join(__dirname, "../opgg.bat"));
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
    }
}

module.exports = App;