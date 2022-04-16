process.once("loaded", () => {
    const {ipcRenderer, contextBridge, shell} = require("electron");
    const osLocale = require('os-locale');

    contextBridge.exposeInMainWorld(
        "api", {
            send: (channel, data) => {
                ipcRenderer.send(channel, data);
            },
            sendSync: (channel, data) => {
                return ipcRenderer.sendSync(channel, data);
            },
            on: (channel, func) => {
                ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
            },
            invoke: async (channel, ...params) => {
                return await ipcRenderer.invoke(channel, ...params);
            },
            eventNames: () => {
                return ipcRenderer.eventNames();
            },
            removeAllListeners: (channel) => {
                return ipcRenderer.removeAllListeners(channel);
            },
            openExternal: async (url) => {
                await shell.openExternal(url);
            },
            osLocale: () => {
                return osLocale.sync();
            },
            platform: () => {
                return process.platform
            }
        }
    );
});