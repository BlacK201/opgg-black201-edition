const {app, Menu, nativeImage, screen, Tray} = require("electron");
const {sendGA4Event} = require("../assets/js/ga4");
const {isNMP} = require("../renderer/utils/nmp");
const path = require("path");

const assetsDirectory = path.join(__dirname, "../assets");
class CustomTray {
    constructor(application) {
        this.application = application;
        this.tray = null;
    }

    buildTray(t) {
        let self = this;

        if (this.tray) {
            this.tray.removeAllListeners();
            this.tray.destroy();
            this.tray = null;
        }
        let trayIcon = path.join(assetsDirectory, "images/tray-icon.png");
        if (process.platform !== "darwin") {
            trayIcon = path.join(assetsDirectory, "images/tray-icon.ico");
        }
        const trayImage = nativeImage.createFromPath(trayIcon);
        this.tray = new Tray(trayImage);

        function quit() {
            sendGA4Event("app_quit", {});
            self.application.window.isForceQuit = true;
            app.quit() && app.exit(0);
        }

        let scaleMenus = [];
        for (let i = 50; i <= 200; i+=25) {
            scaleMenus.push({
                label: `${i}%`,
                click() {
                    self.application.window.scale = i / 100;
                    self.application.window.sendToRenderer("toastr", "tray.scale-set");
                    self.application.window.setScale();
                },
            });
        }

        const contextMenu = Menu.buildFromTemplate([
            // {
            //     label: t.translation.tray.developer,
            //     type: "normal",
            //     click: () => {self.application.window.openDeveloperTool()},
            // },
            {
                label: t.translation.tray["display-scale"],
                submenu: scaleMenus
            },
            {
                label: t.translation.tray["optimize-scale"],
                type: "normal",
                click() {self.application.window.optimizeScale();},
            },
            {
                label: t.translation.tray["init-position"],
                type: "normal",
                click() {
                    let primaryDisplay = screen.getPrimaryDisplay();
                    self.application.window.getLocalStorage("app_mode").then((appMode) => {
                        if (appMode === "full" || appMode === "login") {
                            self.application.window.setBounds({
                                x: Math.round((primaryDisplay.size.width - self.application.window.width) / 2),
                                y: Math.round((primaryDisplay.size.height - self.application.window.height) / 2)
                            });
                        } else if (appMode === "mini") {
                            self.application.window.setBounds({
                                x: Math.round((primaryDisplay.size.width - self.application.window.widthMini) / 2),
                                y: Math.round((primaryDisplay.size.height - self.application.window.heightMini) / 2 - 100)
                            });
                        }
                    });
                }
            },
            { label: "", type: "separator" },
            { label: t.translation.tray.quit, type: "normal", click: quit },
        ]);

        this.tray.on("click", () => {
            this.application.window.show();
        });

        this.tray.setToolTip("OP.GG");
        this.tray.setContextMenu(contextMenu);
    }
}

module.exports = CustomTray;