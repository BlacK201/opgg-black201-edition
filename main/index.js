const { app, shell, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const { v4 } = require("uuid");
const { LocalStorage } = require("node-localstorage");
const ua = require("universal-analytics");
const path = require("path");

const nodeStorage = new LocalStorage(`${app.getPath("userData")}/session`);
const lockStorage = new LocalStorage(`${app.getPath("userData")}/lock`);

const i18nResources = require("../assets/i18n/i18n");
const {sendGA4Event} = require("../assets/js/ga4");

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    let show = app.commandLine.getSwitchValue("show");
    lockStorage.setItem("lock", show);
    app.quit() && app.exit(0);
    return;
}

const GA_TRACKING_ID = "UA-37377845-6";
const userId = nodeStorage.getItem("userid") || v4();
nodeStorage.setItem("userid", userId);
let isDev = process.env.NODE_ENV === "development";
let _ot = null
let ga = ua(GA_TRACKING_ID, userId);

const {isNMP} = require("../renderer/utils/nmp");
const App = require("./app");
const CustomTray = require("./tray");
const {default: axios} = require("axios");

const application = new App();
const tray = new CustomTray(application);
app.commandLine.appendSwitch('wm-window-animations-disabled');
app.on("ready", () => {
    axios.get("https://geo-internal.op.gg/api/current-ip")
        .then((result) => {
            let data = result.data;
            nodeStorage.setItem("geo", JSON.stringify(data));
        })
        .catch((_) => {});

    application.init();

    ga.pageview("/").send();
    ga.event("APP_LAUNCHED", "l", process.platform).send();
});

app.on("second-instance", (event, commandLine) => {
    if (process.platform !== 'darwin') {
        let deepLink = commandLine.find((arg) => arg.startsWith('opgg://'));
        if (deepLink) {
            if (deepLink.includes("login")) {
                _ot = getParameterByName("token", deepLink);
                if (_ot.match(/^(?:[\w-]*\.){2}[\w-]*$/)) {
                    application._ot = _ot;
                    application.opggMemberLogin();
                    application.setRSO();
                }
            } else if (deepLink.includes("rune")) {
                let runeB64 = getParameterByName("rune", deepLink);
                application.setRuneFromDeeplink(runeB64);
            }
        }
    }

    application.alreadyRunning();
});

if (isDev && process.platform === "win32") {
    app.setAsDefaultProtocolClient('opgg', process.execPath, [
        path.resolve(process.argv[1])
    ]);
} else {
    app.setAsDefaultProtocolClient("opgg");
}

process.on("uncaughtException", (err) => {
    console.log("#################################################", err);
    try {
        sendGA4Event("app_crash", {
            name: err.name.substring(0, 99),
            msg: err.message.substring(0, 99)
        });
        app.quit() && app.exit(0);
    } catch(e) {}
});

app.on('open-url', function (event, url) {
    event.preventDefault();
    if (url.includes("login")) {
        _ot = url.split("?token=")[1];
        if (_ot.match(/^(?:[\w-]*\.){2}[\w-]*$/)) {
            application._ot = _ot;
            application.opggMemberLogin(_ot);
            application.setRSO();
        }
    } else if (url.includes("rune")) {
        let runeB64 = url.split("?rune=")[1];
        application.setRuneFromDeeplink(runeB64);
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit() && app.exit(0);
    }
});

app.on("before-quit", function (e) {
    if (process.platform === "darwin") application.window.isForceQuit = true;

    if (!application.window.isForceQuit) {
        e.preventDefault();
        // sendGA4Event("app_close", {});
        application.window.hide();
    } else {
        application.window.setLocalStorage("logged-in", "false");
    }
});

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

ipcMain.on("i18n-changed", (event, arg) => {
    nodeStorage.setItem("locale", arg);
    tray.buildTray(i18nResources[arg]);
    if (!isNMP && process.platform === "win32") {
        application.overlayWindow.sendToRenderer("overlay-i18n", arg);
    }
});

ipcMain.on("i18n", (event, arg) => {
    event.returnValue = i18nResources;
});

ipcMain.on("get-ga", (event) => {
    event.returnValue = {
        userId: userId,
        trackingId: GA_TRACKING_ID,
    };
});

ipcMain.on("get-version-sync", (event) => {
    event.returnValue = app.getVersion();
});

ipcMain.on("change-app-mode", (event, arg) => {
    application.window.appMode = arg;
    application.window.sendToRenderer("app-mode-changed");
});

ipcMain.on("openLink", (event, arg) => {
    shell.openExternal(arg);
});

ipcMain.handle("get-version", () => {
    return app.getVersion();
});

ipcMain.on("check-update", (event) => {
    autoUpdater.checkForUpdates().catch((err) => {
        console.log(err);
    });
});

ipcMain.on("geo", (event) => {
    event.returnValue = nodeStorage.getItem("geo");
});

ipcMain.on("opgg-summoner", (event, data) => {
    event.returnValue = nodeStorage.getItem("opgg-summoner") ?? null;
});

ipcMain.on("opgg-id", (event, data) => {
    event.returnValue = nodeStorage.getItem("id") ?? null;
});

ipcMain.on("locale", async (event) => {
    event.returnValue = nodeStorage.getItem("locale");
});

ipcMain.on("online-status", (event, arg) => {
    if (arg) {
        autoUpdater.checkForUpdates().catch((err) => {
            console.log(err);
        });
    }
});

if (!isNMP) {
    // autoUpdater.setFeedURL("https://opgg-desktop-patch.akamaized.net");
    // autoUpdater.setFeedURL("https://desktop-patch.op.gg");
    autoUpdater.setFeedURL("https://opgg-desktop-patch.bk201.icu");
    autoUpdater.checkForUpdates().catch((err) => {
        console.log(err);
    });

    autoUpdater.on("checking-for-update", function() {
        console.log("Checking-for-update");
    });

    autoUpdater.on("error", function(error) {
        console.error("error", error);
    });

    autoUpdater.on("download-progress", function(progressObj) {
        application.window.updaterWindow.webContents.send("progress", progressObj.percent);
    });

    autoUpdater.on(
        "update-downloaded",
        function(event, releaseNotes, releaseName) {
            console.log("update-downloaded");
            autoUpdater.quitAndInstall();
        }
    );

    autoUpdater.on("update-available", function() {
        ga.event("UPDATE", "u", app.getVersion()).send();
        console.log("A new update is available");
        application.window.update();
    });

    autoUpdater.on("update-not-available", function() {
        console.log("update-not-available");
    });
}