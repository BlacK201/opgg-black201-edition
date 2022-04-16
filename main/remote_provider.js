const BaseProvider = require("./base_provider");
const path = require('path');
const { BrowserWindow, ipcMain, screen} = require('electron');
const assetsDirectory = path.join(__dirname, "../assets");

class RemoteProvider extends BaseProvider {
    constructor(application) {
        super(application);
        this.app = application;
        this.scale = 1;
        this.window = null;
        this.parentWindow = null;
    }

    createWindow() {
        let options = {
            parent: "top",
            modal: true,
            // width: 480,
            width: 346,
            height: 129,
            transparent: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, "preload.js")
            },
            resizable: false,
            show: false,
            frame: false,
            icon: path.join(assetsDirectory, "images/icon.png"),
            skipTaskbar: true
        };

        this.window = new BrowserWindow(options);
        this.window.loadFile(path.join(__dirname, "remote.html"));

        this.getLocalStorage("lastMiniRemoteWindowPosition").then((bounds) => {
            if (bounds) {
                bounds = JSON.parse(bounds);
                let isPositionInBound = false;
                screen.getAllDisplays().forEach((monitor) => {
                    if (bounds.x >= monitor.bounds.x &&
                        bounds.x <= monitor.bounds.x + monitor.bounds.width &&
                        bounds.y >= monitor.bounds.y &&
                        bounds.y <= monitor.bounds.y + monitor.bounds.height
                    ) {
                        isPositionInBound = true;
                    }
                });

                if (isPositionInBound) {
                    this.setBounds({
                        x: bounds.x,
                        y: bounds.y
                    })
                }
            } else {
                let tmp = this.parentWindow?.window.getBounds();
                this.setBounds({
                    x: tmp.x + (this.widthMini - this.window.getBounds().width) / 2,
                    y: tmp.y + this.heightMini - 88 - 30
                });
            }
        });

        this.events();
        this.ipc();
    }

    events() {
        let self = this;

        this.window.on("close", function (e) {
            if (!self.isForceQuit) {
                e.preventDefault();
            }
        });

        this.window.on("moved", () => {
            this.setLocalStorage("lastMiniRemoteWindowPosition", JSON.stringify(this.window.getBounds()));
        });
    }

    ipc() {
        ipcMain.on("menu", (event, arg) => {
            this.sendToRenderer("menu", arg);
        });
    }
}

module.exports = RemoteProvider;