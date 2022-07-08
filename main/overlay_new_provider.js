const { BrowserWindow, screen, ipcMain } = require('electron');
const Overlay = require('electron-overlay');
const BaseProvider = require("./base_provider");
const path = require('path');
const fs = require("fs");
const {sendGA4Event} = require("../assets/js/ga4");
const {isNMP} = require("../renderer/utils/nmp");
const lolConstants = require("./constants/game/leagueoflegends");
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
            }, 1);
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
                        // Overlay.sendCommand({command: "input.intercept", intercept: false});
                    } else {
                        this.isVisible = true;
                        Overlay.sendChangVisible(this.window.id, true);
                        // Overlay.sendCommand({command: "input.intercept", intercept: true});
                    }
                }
            } else if (event === "game.window.focused") {
                // console.log("focusWindowId", payload.focusWindowId);
                // if (payload.focusWindowId === 0 && this.isVisible) {
                //     this.isVisible = false;
                //     Overlay.sendChangVisible(this.window.id, false);
                //     // Overlay.sendCommand({command: "input.intercept", intercept: false});
                //     setTimeout(() => {
                //         robot.keyTap("shift");
                //         // robot.keyToggle("shift", "down");
                //         // robot.keyToggle("shift", "up");
                //         // robot.keyTap("tab");
                //         // robot.keyTap("tab", "shift");
                //         // robot.keyTap("tab", "shift");
                //     }, 100);
                // }
                //
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
        fs.open(path.join(this.app.game.lol.config.installDir, "config/game.cfg"), "r", (err, fd) => {
            let buffer = Buffer.alloc(20480);
            fs.read(fd, buffer, 0, buffer.length, 0, async (err, bytesRead, buffer) => {
                let setting = buffer.toString("utf8");

                for (let i = 0; i < IOVhook.getTopWindows().length; i++) {
                    const p = IOVhook.getTopWindows()[i];
                    if (p.title === "League of Legends (TM) Client") {
                        let tmpWidth = p.width;
                        try {
                            tmpWidth = parseInt(setting.split("Width=")[1].split("\n")[0])
                        } catch (e) { }
                        let tmpHeight = p.height;
                        try {
                            tmpHeight = parseInt(setting.split("Height=")[1].split("\n")[0]);
                        } catch (e) { }
                        let tmpGlobalScale = 0;
                        try {
                            tmpGlobalScale = parseFloat(setting.split("GlobalScale=")[1].split("\n")[0]);
                        } catch (e) {
                            let response = await this.app.game.lol.callAPI("GET", "lol", lolConstants.LOL_GAME_SETTINGS).catch((_) => {
                                return null;
                            })
                            if (response) {
                                tmpGlobalScale = parseFloat(response.data.HUD.GlobalScale);
                            }
                        }
                        this.sendToRenderer("lol-overlay-skill-size", {
                            width: p.width,
                            height: p.height,
                            gameWidth: tmpWidth,
                            gameHeight: tmpHeight,
                            globalScale: tmpGlobalScale
                        });
                        this.Overlay.sendWindowBounds(this.window.id, {
                            rect: {
                                x: 0,
                                y: 0,
                                width: p.width,
                                height: p.height
                            }
                        }, 1);
                        this.window.setSize(p.width, p.height);
                    }
                }
                fs.close(fd, () => {

                });
            });
        });
    }

    ipc() {
        ipcMain.on("lol-loaded", () => {
            this.setOverlayBounds();
        });
    }
}

module.exports = OverlayNewProvider;
