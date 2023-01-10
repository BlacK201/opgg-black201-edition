const { BrowserWindow, screen, ipcMain } = require('electron');
const Overlay = require('electron-overlay');
const BaseProvider = require("./base_provider");
const path = require('path');
const fs = require("fs");
const {sendGA4Event} = require("../assets/js/ga4");
const {isNMP} = require("../renderer/utils/nmp");
const lolConstants = require("./constants/game/leagueoflegends");
const _ = require("lodash");
let IOVhook = null;
if (!isNMP) {
    IOVhook = require("node-ovhook");
}

class OverlayNewProvider extends BaseProvider {
    constructor(application){
        super(application);
        this.app = application;
        this.display = null;
        this.injecteID = "";
        this.visibleWin = [];
        this.intercepting = false;
        this.windowPropsById = {};
        this.window = null;
        this.isVisible = false;
        this.Overlay = Overlay;
        this.isTFT = true;
    }

    addOverlayWindow(
        name,
        window,
        layer,
        showAlways,
        x,
        y,
        dragborder=0,
        captionLeftBorder = 0,
        captionRightBorder = 0,
        captionTopBorder = 0,
        captionHeight = 0,
        transparent = false,
        visible = true
    ) {
        window.setPosition(window.getBounds().x, window.getBounds().y);
        const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());

        Overlay.addWindow(window.id, {
            name,
            transparent,
            resizable: window.isResizable(),
            maxWidth: 3840,
            maxHeight: 2160,
            layer: layer,
            showAlways: showAlways,
            rect: {
                ...window.getBounds(),
            },
            nativeHandle: window.getNativeWindowHandle().readUInt32LE(0),
            scaleFactor: this.display.scaleFactor,
            dragBorderWidth: dragborder,
            caption: {
                left: captionLeftBorder,
                right: captionRightBorder,
                top: captionTopBorder,
                height: captionHeight,
            },
            visible: visible
        });

        window.webContents.on(
            "paint",
            (event, dirty, image) => {
                try{
                    Overlay.sendFrameBuffer(
                        window.id,
                        image.getBitmap(),
                        image.getSize().width,
                        image.getSize().height
                    )
                    // console.log("paint:  " + image.getSize().width + " / " + image.getSize().height + " / " + window.id);
                } catch (err) {
                    // console.log("overlay paint:  " , err);
                }
            }
        )

        window.on("ready-to-show", () => {
            window.focusOnWebView()
        })

        // window.on("resize", () => {
        //     Overlay.sendWindowBounds(window.id, { rect: window.getBounds() }, 1)
        // })
        //
        // window.on("move", () => {
        //     Overlay.sendWindowBounds(window.id, { rect: window.getBounds() }, 1)
        // })

        const windowId = window.id
        window.on("closed", () => {
            Overlay.closeWindow(windowId)
        })

        window.webContents.on("cursor-changed", (event, type) => {
            let cursor
            switch (type) {
                case "default":
                    cursor = "IDC_ARROW"
                    break
                case "pointer":
                    cursor = "IDC_HAND"
                    break
                case "crosshair":
                    cursor = "IDC_CROSS"
                    break
                case "text":
                    cursor = "IDC_IBEAM"
                    break
                case "wait":
                    cursor = "IDC_WAIT"
                    break
                case "help":
                    cursor = "IDC_HELP"
                    break
                case "move":
                    cursor = "IDC_SIZEALL"
                    break
                case "nwse-resize":
                    cursor = "IDC_SIZENWSE"
                    break
                case "nesw-resize":
                    cursor = "IDC_SIZENESW"
                    break
                case "ns-resize":
                    cursor = "IDC_SIZENS"
                    break
                case "ew-resize":
                    cursor = "IDC_SIZEWE"
                    break
                case "none":
                    cursor = ""
                    break
            }
            if (cursor) {
                Overlay.sendCommand({ command: "cursor", cursor })
            }
        });
    }

    initWindow() {
        if (this.window === null) {
            let options = {
                width: 2560,
                height: 1440,
                frame: false,
                show: false,
                // show: true,
                resizable: true,
                movable: false,
                // fullscreen: true,
                transparent: true,
                webPreferences: {
                    offscreen: true,
                    nodeIntegration: false,
                    contextIsolation: true,
                    enableRemoteModule: true,
                    devTools: true,
                    webSecurity: false,
                    // webviewTag: true,
                    // worldSafeExecuteJavaScript: false,
                    preload: path.join(__dirname, "preload.js")
                }
            };

            let platform = process.platform;
            if (platform === "darwin") {
                options["titleBarStyle"] = "hiddenInset";
            } else {
                options["frame"] = false;
            }

            let window = new BrowserWindow(options);

            if (this.isDev()) {
                const startUrl = process.env.OVERLAY_START_URL || url.format({
                    pathname: path.join(__dirname, '/assets/react/overlay/overlay.html'),
                    protocol: 'file',
                    slashes: true
                });
                window.loadURL(startUrl, {
                    userAgent: "overlay"
                });
                window.webContents.openDevTools();
            } else {
                window.loadFile(path.join(__dirname, '../assets/react/overlay/overlay.html'), {
                    query: {
                        overlay: "overlay"
                    }
                });
            }
            this.addOverlayWindow("overlay", window, 0, true, 0, 0, 0, 0, 0, 0, 0, false, true);
            Overlay.sendWindowBounds(window.id, {
                rect: {
                    x: 0,
                    y: 0,
                    width: 1920,
                    height: 1080
                }
            }, screen.getPrimaryDisplay().scaleFactor);
            Overlay.sendChangVisible(window.id, false);
            this.window = window;

            this.ipc();
        }
    }

    on () {
        this.display = screen.getPrimaryDisplay();

        if (Overlay == null) {
            console.error('Overlay is null');
            return;
        }

        Overlay.start();
        Overlay.setHotkeys([
            { name: "overlay.toggle", keyCode: 9, modifiers: { shift: true } },
            // { name: "overlay.toggle", keyCode:  85}
        ]);
        Overlay.setEventCallback((event, payload) => {
            // console.log("callback", event, payload);
            if (event === "game.input") {
                const window = BrowserWindow.fromId(payload.windowId)
                if (window) {
                    const inputEvent = Overlay.translateInputEvent(payload)
                    if (payload.msg !== 512) {
                        // console.log(event, payload)
                        // console.log(`translate ${JSON.stringify(inputEvent)}`)
                    }

                    if (inputEvent) {
                        window.webContents.sendInputEvent(inputEvent)
                    }
                }
            } else if (event === "graphics.fps") {

            } else if (event === "game.hotkey.down") {
                // console.log("game.hotkey.down ", payload.name);
                if (payload.name === "overlay.toggle") {
                    this.setOverlayBounds();
                    if (this.isVisible) {
                        this.isVisible = false;
                        Overlay.sendChangVisible(this.window.id, false);
                        // if (this.isTFT) {
                        //     Overlay.sendCommand({command: "input.intercept", intercept: false});
                        // }
                    } else {
                        this.isVisible = true;
                        Overlay.sendChangVisible(this.window.id, true);
                        // if (this.isTFT) {
                        //     Overlay.sendCommand({command: "input.intercept", intercept: true});
                        // }
                    }
                }
            } else if (event === "game.window.focused") {
                BrowserWindow.getAllWindows().forEach((window) => {
                    window.blurWebView()
                })

                const focusWin = BrowserWindow.fromId(payload.focusWindowId)
                if (focusWin) {
                    focusWin.focusOnWebView()
                }
            }
        });
    }

    toggleOverlay() {
        this.isVisible = true;
        Overlay.sendChangVisible(this.window.id, true);
    }

    isDev = () => {
        return process.env.NODE_ENV === "development";
    };

    setOverlayBounds() {
        try {
            let stats = fs.statSync(path.join(this.app.game.lol.config.installDir, "config/PersistedSettings.json"));
            fs.open(path.join(this.app.game.lol.config.installDir, "config/PersistedSettings.json"), "r", (err, fd) => {
                let buffer = Buffer.alloc(stats.size);
                fs.read(fd, buffer, 0, buffer.length, 0, async (err, bytesRead, buffer) => {
                    let setting = buffer.toString("utf8");
                    setting = JSON.parse(setting);

                    for (let i = 0; i < IOVhook.getTopWindows().length; i++) {
                        const p = IOVhook.getTopWindows()[i];
                        if (p.title === "League of Legends (TM) Client") {
                            let tmpGlobalScale = 0;
                            try {
                                tmpGlobalScale = _.find(_.find(_.find(setting.files, {"name": "Game.cfg"}).sections, {"name": "HUD"}).settings, {"name": "GlobalScale"}).value
                            } catch (e) {
                            }

                            let tmpScale = screen.getPrimaryDisplay().scaleFactor;
                            this.sendToRenderer("lol-overlay-skill-size", {
                                width: p.width,
                                height: p.height,
                                gameWidth: 0,
                                gameHeight: 0,
                                globalScale: tmpGlobalScale,
                                scaleFactor: tmpScale
                            });
                            this.Overlay.sendWindowBounds(this.window.id, {
                                rect: {
                                    x: 0,
                                    y: 0,
                                    width: Math.round(p.width),
                                    height: Math.round(p.height)
                                }
                            }, tmpScale);
                            this.window.setSize(Math.round(p.width/tmpScale), Math.round(p.height/tmpScale));
                            this.window.setBounds({
                                x: 0,
                                y: 0,
                                width: Math.round(p.width/tmpScale),
                                height: Math.round(p.height/tmpScale)
                            });
                        }
                    }
                    fs.close(fd, () => {

                    });
                });
            });
        } catch (e) {
            console.log(e);
        }
    }

    ipc() {
        ipcMain.on("lol-loaded", () => {
            this.setOverlayBounds();
        });

        ipcMain.on("gotInstallDirectory", () => {
            fs.watchFile(path.join(this.app.game.lol.config.installDir, "config/PersistedSettings.json"), {interval: 1000}, (curr, prev) => {
                this.setOverlayBounds();
            });

            fs.watchFile(path.join(this.app.game.lol.config.installDir, "config/game.cfg"), {interval: 1000},(curr, prev) => {
                this.setOverlayBounds();
            });
        });

        ipcMain.on("overlay-tft", (event, data) => {
            this.isTFT = data;
        });
    }
}

module.exports = OverlayNewProvider;
