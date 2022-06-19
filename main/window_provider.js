const { BrowserWindow, screen, shell, ipcMain, app, BrowserView } = require('electron');
const path = require('path');

const {isNMP} = require("../renderer/utils/nmp");
const {sendGA4Event} = require("../assets/js/ga4");
const BaseProvider = require("./base_provider");
const assetsDirectory = path.join(__dirname, "../assets");

const {LocalStorage} = require("node-localstorage");
const nodeStorage = new LocalStorage(`${app.getPath("userData")}/session`);

class WindowProvider extends BaseProvider {
    constructor(application) {
        super();
        this.app = application;
        this.window = null;
        this.remoteWindow = null;
        this.loadingWindow = null;
        this.updaterWindow = null;
        this.adView = null;
        this.isAdOn = false;
        this.width = 1364;
        this.height = 720;
        this.widthMini = 480;
        this.heightMini = 800;
        this.appMode = null;
        this.scale = 1;
        this.isForceQuit = false;
        this.adBounds = {
            x: 0,
            y: 173,
            width: 316,
            height: 547,
            margin: 4
        }
    }

    createWindow() {
        if (this.window === null) {
            let options = {
                width: this.width,
                height: this.height,
                webPreferences: {
                    webSecurity: false,
                    nodeIntegration: false,
                    webviewTag: true,
                    nativeWindowOpen: true,
                    contextIsolation: true,
                    preload: path.join(__dirname, "preload.js")
                },
                resizable: false,
                icon: path.join(assetsDirectory, "images/icon.png"),
                show: false,
                transparent: !isNMP,
                frame: false
            };

            this.window = new BrowserWindow(options);
            this.window.hide();

            if (process.env.NODE_ENV === "development") {
                this.window.loadURL(process.env.ELECTRON_START_URL);
                this.window.webContents.openDevTools();
            } else {
                this.window.loadFile(path.join(__dirname, `../assets/react/react.html`));
            }

            this.window.webContents.once("dom-ready", () => {
                // 광고 설정
                if (nodeStorage.getItem("test1") === "true") {
                    ipcMain.emit("ads", "off", "off");
                } else {
                    ipcMain.emit("ads", "on", "on");
                }

                // 앱 모드 불러오기
                this.getLocalStorage("app_mode").then((savedAppMode) => {
                    switch(savedAppMode) {
                        case "full":
                            this.appMode = "full";
                            this.remoteWindow?.hide();
                            break;
                        case "mini":
                            this.appMode = "mini";
                            this.remoteWindow?.show();
                            break;
                        case "login":
                        default:
                            this.appMode = "login";
                            this.remoteWindow?.hide();
                            break;
                    }

                    if (this.app._ot && this.appMode === "login") {
                        this.appMode = "full";
                    }

                    this.setLocalStorage("app_mode", this.appMode);
                    this.sendToRenderer("change-app-mode-react", this.appMode);
                });

                // 화면 비율 불러오기
                this.getLocalStorage("scale").then((savedScale) => {
                    if (savedScale !== null && savedScale !== "null") {
                        if (parseFloat(savedScale) > 2) {
                            this.scale = 1;
                        }
                        this.scale = parseFloat(savedScale);
                        this.setLocalStorage("scale", savedScale);
                    } else {
                        this.scale = 1;
                        this.setLocalStorage("scale", 1);
                    }

                    // 모니터 위치 불러오기
                    this.getLocalStorage("lastWindowPosition").then((savedBounds) => {
                        if (savedBounds) {
                            savedBounds = JSON.parse(savedBounds);
                            let isPositionInBound = false;
                            screen.getAllDisplays().forEach((monitor) => {
                                if (savedBounds.x >= monitor.bounds.x &&
                                    savedBounds.x <= monitor.bounds.x + monitor.bounds.width &&
                                    savedBounds.y >= monitor.bounds.y &&
                                    savedBounds.y <= monitor.bounds.y + monitor.bounds.height
                                ) {
                                    isPositionInBound = true;
                                }
                            });
                            if (isPositionInBound) {
                                this.setBounds({
                                    x: savedBounds.x,
                                    y: savedBounds.y
                                });
                            }
                        }

                        this.setScale();
                        // PC방 버전이 아니면 바로 표시
                        if (!isNMP) {
                            setTimeout(() => {
                                if (this.loadingWindow) {
                                    this.loadingWindow.close();
                                    this.loadingWindow.destroy();
                                    this.loadingWindow = null;
                                }
                                // this.show();
                            }, 200);
                        }
                    });
                });
            });

            this.events();
            this.ipc();
        }
    }

    createLoadingWindow() {
        let options = {
            width: 390,
            height: 505,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: true,
            },
            transparent: true,
            resizable: false,
            show: false,
            icon: path.join(assetsDirectory, "images/icon.png"),
        };

        if ( process.platform === "darwin") {
            options["titleBarStyle"] = "hiddenInset";
        } else {
            options["frame"] = false;
        }

        this.loadingWindow = new BrowserWindow(options);
        this.loadingWindow.loadFile(path.join(__dirname, "loading.html"));

        this.loadingWindow.webContents.once("dom-ready", () => {
            this.loadingWindow.show();
        });
    }

    createUpdaterWindow() {
        let options = {
            width: 280,
            height: 360,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, "preload.js")
            },
            resizable: false,
            show: false,
            icon: path.join(assetsDirectory, "images/icon.png"),
        };

        if (process.platform === "darwin") {
            options["titleBarStyle"] = "hiddenInset";
        } else {
            options["frame"] = false;
        }

        this.updaterWindow = new BrowserWindow(options);
        this.updaterWindow.loadFile(path.join(__dirname, "updater.html"));

        this.updaterWindow.webContents.once("dom-ready", () => {
            this.updaterWindow.show();
        });
    }

    update() {
        this.createUpdaterWindow();
        this.loadingWindow?.close();
        this.loadingWindow?.destroy();
        this.loadingWindow = null;
        this.window?.close();
        this.window?.destroy();
        this.window = null;
    }

    events() {
        let self = this;

        this.window.once("focus", () => {
            self.window.flashFrame(false);
        });

        this.window.on("moved", () => {
            self.setLocalStorage("lastWindowPosition", JSON.stringify(self.window.getBounds()));
        });

        this.window.on("focus", () => {
            try {
                if (self.remoteWindow) {
                    if (!self.remoteWindow.window.isFocused()) {
                        self.remoteWindow.window.focus();
                    }
                }
            } catch {
            }
        });

        this.window.on("page-title-updated", (e) => {
            e.preventDefault();
        });

        this.window.on("close", function (e) {
            if (!self.isForceQuit) {
                e.preventDefault();
                // sendGA4Event("app_close", {});
                self.hide();
            } else {
                app.exit(0);
            }
        });

        const handleRedirect = (e, url) => {
            if (url !== e.sender.getURL()) {
                e.preventDefault();
                shell.openExternal(url);
            }
        };

        this.window.webContents.on("new-window", handleRedirect);

        this.window.webContents.on("did-attach-webview", (e, webContents) => {
            webContents.on("new-window", handleRedirect);
        });
    }

    ipc() {
        let self = this;

        ipcMain.on("window-quit", () => {
            self.isForceQuit = true;
            app.quit() && app.exit(0);
        });

        ipcMain.on("window-close", (event) => {
            // sendGA4Event("app_close", {});
            self.window.hide();
        });

        ipcMain.on("window-maximize", (event) => {
            self.window.maximize();
        });

        ipcMain.on("window-unmaximize", (event) => {
            self.window.unmaximize();
        });

        ipcMain.on("window-minimize", (event) => {
            self.window.minimize();
        });

        ipcMain.on("change-app-mode-react", (event, arg) => {
            self.appMode = arg;
            if (self.remoteWindow) {
                if (arg === "mini") {
                    self.remoteWindow.show();
                } else {
                    self.remoteWindow.hide();
                }
            }
            self.setScale();
        });

        ipcMain.on("mini-menu-clicked", (event, arg) => {
            if (self.window) {
                self.sendToRenderer(`mini-menu-${arg}`);
            }
        });

        ipcMain.on("ignore-mouse", (event, arg) => {
            if (self.window) {
                if (arg) {
                    self.window.setIgnoreMouseEvents(true, {forward: true});
                } else {
                    self.window.setIgnoreMouseEvents(false);
                }
            }
        });

        ipcMain.on("ads", (event, arg) => {
            if (self.window) {
                if (arg === "on") {
                    self.isAdOn = true;
                    self.setBounds({
                        width: Math.round((self.width + self.adBounds.width + self.adBounds.margin * 2) * self.scale),
                        height: Math.round(self.height * self.scale)
                    });
                } else {
                    self.isAdOn = false;
                    self.setBounds({
                        width: Math.round(self.width * self.scale),
                        height: Math.round(self.height * self.scale)
                    });
                }
            }
        });

        ipcMain.on("ad-attach", (event, arg) => {
            this.isAdOn = true;
            if (!this.adView && this.window) {
                this.adView = new BrowserView();
                this.window.setBrowserView(this.adView);
                // this.adView.webContents.openDevTools();
                const handleRedirect = (e, url) => {
                    // console.log(url);
                    if (url !== e.sender.getURL()) {
                        e.preventDefault();
                        shell.openExternal(url);
                    }
                };

                this.adView.webContents.on("new-window", handleRedirect);
                this.adView.setBounds({
                    x: Math.round(this.window.getBounds().width + this.adBounds.margin * this.scale),
                    y: Math.round(this.adBounds.y * this.scale),
                    width:  Math.round(this.adBounds.width * this.scale),
                    height:  Math.round(this.adBounds.height * this.scale)
                });
                this.adView.webContents.loadURL(arg, {httpReferrer: "https://op.gg"});
                this.setScale();
            } else {
                this.window.setBrowserView(this.adView);
                this.adView.webContents.loadURL(arg, {httpReferrer: "https://op.gg"});
            }
        });

        ipcMain.on("ad-detach", (event, arg) => {
            this.isAdOn = false;
            if (this.adView && this.window) {
                this.window.removeBrowserView(this.adView);
                this.adView.webContents.loadURL("about:blank");
            }
        });

        ipcMain.on("ad-set-url", (event, arg) => {
            if (this.adView) {
                this.adView.webContents.loadURL(arg, {httpReferrer: "https://op.gg"});
            }
        });
        ipcMain.on("ad-reload", (event, arg) => {
            if (this.adView) {
                this.adView.webContents.reload();
            }
        });
    }
}

module.exports = WindowProvider;