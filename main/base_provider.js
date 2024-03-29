const {screen} = require("electron");
module.exports = class BaseProvider {
    constructor(application) {
        this.app = application;
        this.window = null;
        this.scale = 1;
        this.appMode = "";
        this.width = 0;
        this.height = 0;
        this.widthMini = 0;
        this.heightMini = 0;
    }

    getLocalStorage(item) {
        if (this.window === null) return 100;
        return this.window.webContents
            .executeJavaScript(`localStorage.getItem('${item}');`, true);
    }

    setLocalStorage(item, value) {
        if (this.window === null) return;
        this.window.webContents
            .executeJavaScript(`localStorage.setItem('${item}', '${value}');`, true);
    }

    removeLocalStorage(item) {
        if (this.window === null) return;
        this.window.webContents
            .executeJavaScript( `localStorage.removeItem('${item}')`, true);
    }

    setCookie(name, value, domain) {
        if (this.window === null) return;
        let aYearFromNow = new Date();
        aYearFromNow.setFullYear(aYearFromNow.getFullYear() + 1);
        this.window.webContents.session.cookies.set({
            domain: domain,
            name: name,
            value: value,
            url: `https://${domain}`, path: "/",
            expirationDate: parseInt(aYearFromNow.getTime()/1000),
            sameSite: "no_restriction"
        }).then((_) => {}).catch((_) => {});
        // this.window.webContents
        //     .executeJavaScript(`document.cookie = '${name}=${value};path=/;domain=${domain}';`, true);
    }

    removeCookie(name, domain) {
        if (this.window === null) return;
        this.window.webContents.session.cookies.remove(`https://${domain}`, name).then((_) => {}).catch((_) => {});
        // this.window.webContents
        //     .executeJavaScript(`document.cookie = '${name}=; Max-Age=-99999999'`, true);
    }

    sendToRenderer(channel, args=null) {
        if (this.window === null) return;
        this.window.webContents.send(channel, args);
    }

    setScale() {
        if (this.window === null) return;
        this.app.scale = this.scale;
        let adWidth = this.app.window.adBounds.width + this.app.window.adBounds.margin * 2;
        if (this.app.window.isAdOn) {
            adWidth = this.app.window.adBounds.width + this.app.window.adBounds.margin * 2;
        }

        switch (this.appMode) {
            case "mini":
                this.setBounds({
                    width: Math.round(this.widthMini * this.scale),
                    height: Math.round(this.heightMini * this.scale)
                });
                break;
            case "full":
            default:
                this.setBounds({
                    width: Math.round((this.width + adWidth) * this.scale),
                    height: Math.round(this.height * this.scale)
                });
                break;
        }

        if (this.app.window.isAdOn && this.app.window.adView) {
            this.app.window.adView.setBounds({
                x: Math.round((1280 + this.app.window.adBounds.margin * 2) * this.scale),
                y: Math.round(this.app.window.adBounds.y * this.scale),
                width: Math.round(this.app.window.adBounds.width * this.scale),
                height: Math.round(this.app.window.adBounds.height * this.scale)
            });
            setTimeout(() => {
                try { this.app.window.adView.webContents.setZoomFactor(this.scale) }
                catch (e) { this.app.window.adView.webContents.setZoomFactor(1) }
            }, 300);
        }

        setTimeout(() => {
            try { this.window.webContents.setZoomFactor(this.scale) }
            catch (e) { this.window.webContents.setZoomFactor(1) }
        }, 300);

        this.setLocalStorage("scale", this.scale);
    }

    optimizeScale() {
        let display = screen.getPrimaryDisplay();
        this.scale = 1;
        if (display.size.width <= 1366) {
            this.scale = 0.75;
        }
        if (display.scaleFactor !== 1) {
            this.scale = 1 / display.scaleFactor;
        }
        this.setScale();
    }

    openDeveloperTool() {
        if (this.window === null) return;
        this.window.webContents.openDevTools();
    }

    setBounds(bounds) {
        if (this.window === null) return;
        this.window.setBounds(bounds);
    }

    show() {
        if (this.window === null) return;
        this.window.show();

        // show nmp video ad
        this.sendToRenderer("nmp-ads", true);
    }

    showInactive() {
        if (this.window === null) return;
        this.window.showInactive();
    }

    hide() {
        if (this.window === null) return;
        this.window.hide();

        // hide nmp video ad
        this.sendToRenderer("nmp-ads", false);
    }

    setTitle(title) {
        if (this.window === null) return;
        this.window.setTitle(title);
    }
}