const { BrowserWindow, screen } = require('electron');
const Overlay = require('electron-overlay');
const BaseProvider = require("./base_provider");
const path = require('path');

class OverlayProvider extends BaseProvider {
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
        dragborder = 0,
        captionLeftBorder = 0,
        captionRightBorder = 0,
        captionTopBorder = 0,
        captionHeight = 0,
        transparent = false,
        visible = true
      ) {
        // console.log(`AddOverlay ${window.id}` + ":  size: " + window.getSize() +  " / bounds: "
        //  +  JSON.stringify(window.getBounds()) + " /scaleFactor:  " +  this.display.scaleFactor + "/visible: " + visible);

        //this is important as screenscale(over 100%, drag)
        window.setPosition(window.getBounds().x, window.getBounds().y);

        const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());

        Overlay.addWindow(window.id, {
            name,
            transparent,
            resizable: window.isResizable(),
            maxWidth: window.isResizable
                ? display.bounds.width
                : window.getBounds().width,
            maxHeight: window.isResizable
                ? display.bounds.height
                : window.getBounds().height,
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

    createWindow(name, browserOption, properties) {
        return new BrowserWindow(browserOption);
    }

    isDev = () => {
        return process.env.NODE_ENV === "development";
    };

    initWindow() {
        if (this.window === null) {
            let options = {
                width: 1280,
                height: 720,
                frame: false,
                show: false,
                resizable: false,
                movable: false,
                // fullscreen: true,
                webPreferences: {
                    offscreen: true,
                    nodeIntegration: false,
                    contextIsolation: true,
                    enableRemoteModule: true,
                    // devTools: true,
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
                const startUrl = process.env.ELECTRON_START_URL || url.format({
                    pathname: path.join(__dirname, '/assets/react/react.html'),
                    protocol: 'file',
                    slashes: true
                });
                window.loadURL(startUrl, {
                    userAgent: "overlay"
                });
                // window.webContents.openDevTools();
            } else {
                window.loadFile(path.join(__dirname, '../assets/react/react.html'), {
                    query: {
                        overlay: "overlay"
                    }
                });
            }
            this.addOverlayWindow("overlay", window, 0, true, 0, 0, 0, 0, 0, 0, 0, false, true);
            Overlay.sendWindowBounds(window.id, {
                rect: {
                    x: window.getBounds().x,
                    y: window.getBounds().y,
                    width: 1280,
                    height: 820
                }
            }, 1);
            Overlay.sendChangVisible(window.id, false);
            this.window = window;
        }
    }

    overlayCommand(data) {
        Overlay.sendCommand(data);
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
                    if (this.isVisible) {
                        this.isVisible = false;
                        Overlay.sendChangVisible(this.window.id, false);
                        Overlay.sendCommand({command: "input.intercept", intercept: false});
                    } else {
                        this.isVisible = true;
                        Overlay.sendChangVisible(this.window.id, true);
                        Overlay.sendCommand({command: "input.intercept", intercept: true});
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
}

module.exports = OverlayProvider
