const { ipcMain, shell, app, screen } = require('electron');
const {isNMP} = require("../renderer/utils/nmp");
const {exec} = require("child_process");
const {default: axios} = require("axios");
const WebSocket = require("ws");
const lolConstants = require("./constants/game/leagueoflegends");
const _ = require('lodash');
const {v4} = require("uuid");
const {sendGA4Event} = require("../assets/js/ga4");
const championsMetaData = require("../assets/data/meta/champions.json");
const fs = require("fs");
const os = require("os");
const path = require("path");
const homedir = os.homedir();
const {LocalStorage} = require("node-localstorage");
const {isOW} = require("../renderer/utils/ow");
const {profiles} = require("./gpm");
const {enc, PBKDF2, AES} = require("crypto-js");
const nodeStorage = new LocalStorage(`${app.getPath("userData")}/session`);
const misc = require('./misc');
const { v4: uuidv4 } = require('uuid');

// require("../assets/i18n/ddragon");
// require("../assets/data/meta");
let rustProcess = () => {};

let IOVhook = null;
if (!isNMP && process.platform === "win32") {
    IOVhook = require("node-ovhook");
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
if (!String.prototype.format) {
    String.prototype.format = function() {
        let args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

let idToKey = (id) => {
    return _.find(championsMetaData.data, {id: id}).key;
};

let keyToId = (key) => {
    return _.find(championsMetaData.data, {key: key}).id;
}

let spellKeyToId = {
    SummonerBoost: 1,
    SummonerBarrier: 21,
    SummonerDot: 14,
    SummonerExhaust: 3,
    SummonerFlash: 4,
    SummonerHaste: 6,
    SummonerHeal: 7,
    SummonerMana: 13,
    SummonerPoroRecall: 30,
    SummonerPoroThrow: 31,
    SummonerSmite: 11,
    SummonerSnowURFSnowball_Mark: 39,
    SummonerSnowball: 32,
    SummonerTeleport: 12,
}

class LoL {
    constructor(application) {
        this.app = application;
        this.config = {
            port: 0,
            token: "",
            httpsURL: "",
            wssURL: "",
            opggRegion: "www",
            isRuneOn: true,
            isItemBuildOn: true,
            isSpellOn: true,
            isAutoAcceptOn: false,
            spellLocation: "d",
            isOverlayOn: false,
            region: null,
            rust: false,
            isFront: false,
            installDir: null
        }
        this.game = {
            summoner: null,
            summonerRank: null,
            soloRank: "unranked",
            queueId: 0,
            mapId: "",
            championId: 0,
            perkPages: null,
            itemSets: null,
            globalItemSets: null,
            spellSets: null,
            isPlaying: false,
            phase: "",
            fdItem: null,
            position: null,
            lobbyPosition: "UNSELECTED",
            positionSet: false,
            opggSummonerId: null
        }
        this.api = {
            combos: null
        }
        this.isGameRunning = false;
        this.detectGameProcessInterval = null;
        this.liveClientDataInterval = null;
        this.ws = null;
        this.pendingCalls = new Map();

        if (process.platform === "win32") {
            try {
                rustProcess = require("rust-process").checkProcess;
                this.config.rust = true;
                this.app.window.sendToRenderer("vcredist", "false");
            } catch(e) {
                // Need to install c++ dist package
                // https://visualstudio.microsoft.com/ko/downloads/#microsoft-visual-c-redistributable-for-visual-studio-2022
                sendGA4Event("vcredist", {
                    installed: false
                });
                this.app.window.sendToRenderer("vcredist", "true");
            }
        }
    }

    init() {
        // 설정 값 가져오기
        if (this.app.window) {
            this.app.window.getLocalStorage("autorune")
                .then((result) => {
                    this.config.isRuneOn = !(result === "false" || result === false);
                });
            this.app.window.getLocalStorage("autoitem")
                .then((result) => {
                    this.config.isItemBuildOn = !(result === "false" || result === false);
                });
            this.app.window.getLocalStorage("autoaccept")
                .then((result) => {
                    this.config.isAutoAcceptOn = (result === "true" || result === true);
                })
            this.app.window.getLocalStorage("isSpell")
                .then((result) => {
                    this.config.isSpellOn = !(result === "false" || result === false);
                    if (isNMP) {
                        this.config.isSpellOn = (result === "true" || result === true);
                    }
                });
            this.app.window.getLocalStorage("spell")
                .then((result) => {
                    this.config.spellLocation = result === "d" ? "d" : "f";
                });
            this.app.window.getLocalStorage("isOverlay2")
                .then((result) => {
                    this.config.isOverlayOn = (result === "true" || result === true);
                });
            this.app.window.getLocalStorage("overlaySettings")
                .then((result) => {
                    this.broadcastIPC("overlay-setting-changed", result);
                });
        }

        this.ipc();
        this.app.window.show();
        this.detectGameProcess();

        this.callAPI("GET", "s3", `/combo_test.json?timestamp=${new Date().getTime()}`).then((data) => {
            this.broadcastIPC("combos", data.data);
            this.api.combos = data.data;
        });
    }

    detectGameProcess() {
        if (this.detectGameProcessInterval !== null) {
            return;
        }
        this.detectGameProcessInterval = setInterval(async () => {
            this.checkProcess();
            if (this.isGameRunning) {
                console.log("httpsurl " + this.config.httpsURL)
                console.log("wssurl " + this.config.wssURL)
                console.log(`Basic ${Buffer.from(`riot:${this.config.token}`).toString('base64')}`)
                // return;
                if (this.ws === null) {
                    this.websocket();
                    return;
                }
                if (this.ws.readyState !== WebSocket.OPEN) {
                    return;
                }

                let regionResponse = await this.callAPI("GET", "lol", lolConstants.LOL_REGION_LOCALE)
                    .catch((_) => {return null;});
                if (!regionResponse) return;
                this.config.region = regionResponse.data;
                if (lolConstants.GARENAS.includes(this.config.region.region)) {
                    this.broadcastIPC("is-garena", true);
                }
                this.config.opggRegion = lolConstants.OPGG_RIOT_REGION_MAP[this.config.region.region];
                if (nodeStorage.getItem("test1") === "true") {
                    ipcMain.emit("ads", "off", "off");
                } else {
                    ipcMain.emit("ads", "on", "on");
                }

                if (this.config.region.region !== "NA") {
                    ipcMain.emit("ad-detach", "off", "off");
                } else {
                    ipcMain.emit("ad-attach", "on", "on");
                }

                let summonerResponse = await this.callAPI("GET", "lol", lolConstants.LOL_CURRENT_SUMMONER)
                    .catch((_) => {return null;});
                if (!summonerResponse) return;
                this.game.summoner = summonerResponse.data;
                this.broadcastIPC("set-region", lolConstants.RIOT_REGION_MAP[this.config.region.region]);
                this.broadcastIPC("set-availability", lolConstants.SERVICE_AVAILABLE[this.config.region.region]);
                this.broadcastIPC("logged-in", this.game.summoner, true);
                if (isNMP) {
                    this.app.window.setTitle("OPGG_Logged_in");
                }
                this.app.window.show();

                let summonerRankResponse = await this.callAPI("GET", "lol", `${lolConstants.LOL_RANKED_STATS}/${this.game.summoner.puuid}`)
                    .catch((_) => {return null});
                if (!summonerRankResponse) return;
                this.game.summonerRank = summonerRankResponse.data;
                try {
                    this.game.soloRank = summonerRankResponse.data.queueMap.RANKED_SOLO_5x5.tier;
                    this.app.window.setLocalStorage("soloRank", summonerRankResponse.data.queueMap.RANKED_SOLO_5x5.tier);
                } catch (_) {

                }

                let installDir = await this.callAPI("GET", "lol", lolConstants.LOL_INSTALL_DIR)
                    .catch((_) => {return null;});
                if (installDir) this.config.installDir = installDir.data;

                sendGA4Event("login_lol", {
                    server: this.config.region.region,
                    summoner_rank: summonerRankResponse.data.highestRankedEntry.tier,
                    screen_resolution: `${screen.getPrimaryDisplay().size.width}*${screen.getPrimaryDisplay().size.height}`
                }, {
                    login_lol: true,
                    number_of_monitors: screen.getAllDisplays().length,
                    setting_autoitem: this.config.isItemBuildOn,
                    setting_autorune: this.config.isRuneOn,
                    setting_isSpell: this.config.isSpellOn,
                    setting_autoaccept: this.config.isAutoAcceptOn,
                    setting_isOverlay: this.config.isOverlayOn,
                    summoner_level: this.game.summoner.summonerLevel,
                    summoner_name: this.game.summoner.displayName,
                    summoner_id: this.game.summoner.summonerId,
                    app_size: nodeStorage.getItem("scale"),
                });

                this.callAPI("GET",
                    "lol-api-summoner",
                    `/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/summoners?name=${encodeURI(this.game.summoner.displayName)}`)
                    .then((response) => {
                        try {
                            nodeStorage.setItem("opgg-summoner", JSON.stringify(response.data.data[0]));
                        } catch (_) { }
                    })
                    .catch(() => null);

                setTimeout(() => {
                    this.initDesktopApp();
                }, 1000);
                // console.log(this.config, this.game);
                console.log("clearInterval");
                // this.websocket();
                clearInterval(this.detectGameProcessInterval);
                this.detectGameProcessInterval = null;
                ipcMain.emit("guest");
                ipcMain.emit("gotInstallDirectory");
            }
        }, 3000);
    }

    websocket() {
        if (this.ws === null || (this.ws !== null && this.ws.readyState === WebSocket.OPEN)) {
            this.ws = new WebSocket(this.config.wssURL, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`riot:${this.config.token}`).toString('base64')}`
                },
                rejectUnauthorized: false
            });

            this.ws.on("open", () => {
                this.ws.send(JSON.stringify([5, 'OnJsonApiEvent']));
            });

            this.ws.on("message", (content) => {
                try {
                    const json = JSON.parse(content)
                    let data = json.slice(2)[0].data;
                    let uri = json.slice(2)[0].uri;
                    // console.log(uri);
                    let [type, ...response] = json;

                    switch(type) {
                        case 3: {
                            console.log(JSON.stringify(json))
                            let [messageId, result] = response;
                            let deferred = this.pendingCalls.get(messageId);
                            if (!deferred) break;
                            deferred.resolve({data: result});
                            this.pendingCalls.delete(messageId);
                            break;
                        }
                        case 4: {
                            console.log(JSON.stringify(json))
                            let [messageId, code, description] = response;
                            let error = new Error('RPC error');
                            error.code = code;
                            error.description = description;
                            let deferred = this.pendingCalls.get(messageId);
                            if (!deferred) break; // ?????
                            debug(`wamp error (${deferred.requestFnName}) ${code}: ${description}`);
                            deferred.reject(error);
                            this.pendingCalls.delete(messageId);
                            break;
                        }
                        case 8:
                            switch (uri) {
                                case lolConstants.LOL_GAMEFLOW_SESSION:
                                    this.game.queueId = data.gameData.queue.id;
                                    this.game.mapId = data.map.gameMode;
                                    this.gameFlowChanged(data);
                                    break;

                                case lolConstants.LOL_CHAMPSELECT_SESSION:
                                    this.champSelectionSession(data);
                                    break;
                                case lolConstants.LOL_LOBBY:
                                    this.lobby(data);
                                    break;
                                case lolConstants.LOL_PRESHUTDOWN_BEGIN:
                                    this.ws.close();
                                    break;
                                case "/lol-matchmaking/v1/ready-check":
                                    console.log(data)
                                    if (this.config.isAutoAcceptOn && data.timer >= 1){
                                        this.acceptMatch();
                                    }
                                    break;
                            }
                            break;
                    }
                } catch {
                }
            });

            this.ws.on("error", (err) => {
                console.log(err);
            });

            this.ws.on("close", () => {
                for (let deferred of this.pendingCalls.values()) {
                    let err = new Error('WebSocket disconnected');
                    err.code = 'Disconnected';
                    err.description = 'WebSocket connection ended';
                    deferred.reject(err);
                }
                console.log("close");
                this.ws.close();
                this.ws = null;
                this.broadcastIPC("logged-in", null, true);
                if (isNMP) {
                    this.app.window.setTitle("OP.GGforDesktop");
                }
                this.isGameRunning = false;
                this.detectGameProcess();
            });
        }
    }

    async initDesktopApp() {
        // 인게임정보
        let gameFlow = await this.callAPI("GET", "lol", lolConstants.LOL_GAMEFLOW_SESSION).catch((_) => {return null;});
        if (gameFlow) {
            this.game.queueId = gameFlow.data.gameData.queue.id;
            this.gameFlowChanged(gameFlow.data);
        }

        // 멀티서치, 챔피언분석
        let championSelect = await this.callAPI("GET", "lol", lolConstants.LOL_CHAMPSELECT_SESSION).catch((_) => {return null;});
        if (championSelect) {
            this.champSelectionSession(championSelect.data);
        }

        // OP.GG 픽
        let lobby = await this.callAPI("GET", "lol", lolConstants.LOL_LOBBY).catch((_) => {return null;});
        if (lobby) {
            this.lobby(lobby.data);
        }
    }

    checkLockfile() {
        try {
            let self = this;
            let lockfile = path.join(homedir, "AppData/Local/Riot Games/Riot Client/Config/lockfile");
            fs.stat(lockfile, (err) => {
                if (err) return;
                fs.open(lockfile, "r", (err, fd) => {
                    let buffer = Buffer.alloc(100);
                    fs.read(fd, buffer, 0, buffer.length, 0, (err, bytesRead, buffer) => {
                        let data = buffer.toString("utf8").split(":");
                        let httpsUrl = `https://riot:${data[3]}@127.0.0.1:${data[2]}`;
                        axios.get(`${httpsUrl}/product-session/v1/sessions`).then((res) => {
                            if (res) {
                                for (const [_, v] of Object.entries(res.data)) {
                                    if (v.productId === "league_of_legends") {
                                        let leagueLockfile = `${v.launchConfiguration.workingDirectory}/lockfile`;
                                        fs.stat(leagueLockfile, (err) => {
                                            if (err) return;
                                            fs.open(leagueLockfile, "r", (err, fd) => {
                                                let buffer = Buffer.alloc(100);
                                                fs.read(fd, buffer, 0, buffer.length, 0, (err, bytesRead, buffer) => {
                                                    let data = buffer.toString("utf8").split(":");
                                                    self.config.port = data[2];
                                                    self.config.token = data[3]
                                                    self.config.httpsURL = `https://riot:${self.config.token}@127.0.0.1:${self.config.port}`;
                                                    self.config.wssURL = `wss://127.0.0.1:${self.config.port}`;
                                                    axios.get(`${self.config.httpsURL}${lolConstants.LOL_CURRENT_SUMMONER}`).then((res) => {
                                                        if (res) {
                                                            self.isGameRunning = true;
                                                        }
                                                    }).catch((_) => {
                                                    });
                                                });
                                            });
                                        });
                                    }
                                }
                            }
                        }).catch((_) => {
                        })
                    });
                });
            });
        } catch(e) {

        }
    }

    async acceptMatch() {
        await this.callAPI("POST", "lol", "/lol-matchmaking/v1/ready-check/accept").catch((_) => {console.log(_)});
        // await this.callAPI("POST", "lol", "/lol-lobby-team-builder/v1/ready-check/accept").catch((_) => {console.log(_)});
    }

    checkProcess() {
        let platform = process.platform;
        let cmd = platform === 'win32' ? 'tasklist' : (platform === 'darwin' ? 'ps -ax | grep LeagueClientUx' : (platform === 'linux' ? 'ps -A' : ''));
        if (cmd === '') return;

        try {
            if (platform === "darwin") {
                this.execShellCommand(cmd).then((stdout) => {
                    try {
                        this.config.port = stdout.split("--app-port=")[1].split(" ")[0];
                        this.config.token = stdout.split("--remoting-auth-token=")[1].split(" ")[0];
                        this.config.httpsURL = `https://riot:${this.config.token}@127.0.0.1:${this.config.port}`;
                        this.config.wssURL = `wss://riot:${this.config.token}@127.0.0.1:${this.config.port}`;
                        this.isGameRunning = true;
                    } catch {

                    }
                });
            } else if (platform === "win32") {
                if (this.config.rust) {
                    let stdout = rustProcess();
                    if (stdout.indexOf('--app-port=') !== -1) {
                        this.config.port = stdout.split('--app-port=')[1].split('"')[0];
                        this.config.token = stdout.split('--remoting-auth-token=')[1].split('"')[0];
                        this.config.httpsURL = `https://riot:${this.config.token}@127.0.0.1:${this.config.port}`;
                        this.config.wssURL = `wss://127.0.0.1:${this.config.port}`;
                        this.isGameRunning = true;
                    } else {
                        // if League Client is running on admin
                        // lockfile로 확인
                        this.checkLockfile();
                        // sendGA4Event("admin_privilege", {
                        //     admin_privilege: true
                        // });
                    }
                } else {
                    // lockfile로 확인
                    this.checkLockfile();
                }
            }
        } catch {
        }
    };

    execShellCommand(cmd) {
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.warn(error);
                }
                resolve(stdout ? stdout : stderr);
            });
        });
    }

    broadcastIPC(event, data, toMiniRemote = false) {
        if (this.app.window !== null) {
            this.app.window.sendToRenderer(event, data);
        }

        if (this.app.overlayWindow !== null) {
            this.app.overlayWindow.sendToRenderer(event, data);
        }

        if (toMiniRemote && this.app.remoteWindow !== null) {
            this.app.remoteWindow.sendToRenderer(event, data);
        }
    };

    async callHttp2API(method, url, data = null, options = {}) {
        // TODO: 增加POST数据处理
        let self = this;
        return new Promise (function (resolve, reject) {
            const client = http2.connect(`https://127.0.0.1:${self.config.port}`, {
                rejectUnauthorized: false,
            });
            client.on('error', (err) => {
                console.log(`ERROR: ${err}`)
                reject(err)
            });

            const req = client.request({
                ':path': url,
                ':method': method,
                [http2.constants.HTTP2_HEADER_AUTHORIZATION]: `Basic ${Buffer.from(`riot:${self.config.token}`).toString('base64')}`
            });

            let resData = [];
            req.on('data', (chunk) => {
                resData.push(chunk);
            });

            let response = {}

            req.on('end', () => {
                if (resData.length !== 0) {
                    response['data'] = JSON.parse(resData.join(""))
                } else {
                    response['data'] = {}
                }
                client.close();
                resolve(response)
            });

            req.end();
        })
    }


    callWSAPI(method, url, data = null, options = {}) {
        let randomRequestId = uuidv4();
        if (this.ws === null) {
            console.log("Not connected")
            throw new Error('Not connected');
        }
        let fnName = `${method} ${url}`;
        let deferred = new misc.Deferred();
        deferred.requestFnName = fnName;
        this.pendingCalls.set(randomRequestId, deferred);
        if (data === null) {
            this.ws.send(JSON.stringify([
                2,
                randomRequestId,
                fnName
            ]));
        } else {
            this.ws.send(JSON.stringify([
                2,
                randomRequestId,
                fnName,
                data
            ]));
        }
        return deferred.promise;
    }

    callAPI(method, game, url, data = null, options = {}, _ot=false) {
        let self = this;
        if (game === "lol") {
            // uri = self.config.httpsURL;
            return this.callWSAPI(method, url, data, options);
        }
        return new Promise(function (resolve, reject) {
            let uri = "";
            // if (game === "lol") {
            //     // uri = self.config.httpsURL;
            //     return callWSAPI(method, url, data, options);
            // } else
            if (game === "opgg") {
                uri = `https://${self.config.opggRegion}.op.gg`;
            } else if (game === "opggkr") {
                uri = `https://www.op.gg`;
            } else if (game === "s3") {
                uri = lolConstants.OPGG_DESKTOP_APP_S3;
            } else if (game === "s3-980ti") {
                uri = lolConstants.OPGG_980TI_S3;
            } else if (game === "liveclientdata") {
                uri = `https://127.0.0.1:2999/liveclientdata`;
            } else if (game === "lfg") {
                uri = "http://13.125.58.3";
            } else if (game === "data") {
                uri = "https://7xm409rj2j.execute-api.ap-northeast-2.amazonaws.com";
            } else if (game === "data2") {
                uri = "https://m9km92rbn4.execute-api.ap-northeast-2.amazonaws.com/";
            } else if (game === "lol-api-champion") {
                uri = "https://lol-api-champion.bk201.icu";
            } else if (game === "lol-api-summoner") {
                uri = "https://lol-api-summoner.op.gg"
            }

            console.log(`${game}   ${url}`)

            let axiosOptions = {
                method: method,
                url: `${uri}${url}`,
                data: data,
                timeout: 10000,
                headers: {
                    "User-Agent": "OP.GG Desktop App"
                }
            };

            if (_ot) {
                axiosOptions["headers"]["Authorization"] = `Bearer ${nodeStorage.getItem("_ot")}`;
            }

            Object.keys(options).forEach((key) => {
                axiosOptions[key] = options[key];
            });

            axios(axiosOptions)
                .then(function (response) {
                    resolve(response);
                }).catch(function (error) {
                reject(error);
            }).finally(function () {
            });
        });
    };

    async gameFlowChanged(data) {
        switch (data.phase) {
            case "ChampSelect":
                if (this.game.phase === data.phase) break;
                this.broadcastIPC("is-lol-game-live", true);
                this.broadcastIPC("lol-current-game-queue", this.game.queueId);
                if (lolConstants.RIFT_QUEUE_IDS.includes(this.game.queueId)) {
                    this.broadcastIPC("toast-info",  {
                        text: "op-champ-notice"
                    });
                }
                break;
            case "Lobby":
                try {
                    if (data.map.gameMode === "TFT") {
                        this.broadcastIPC("switch-tft");
                        this.broadcastIPC("overlay-setting", true);
                        this.broadcastIPC("overlay-tft", true);
                    } else {
                        this.broadcastIPC("overlay-tft", false);
                    }
                } catch (_) {}
                this.game.championId = -1;
                this.game.queueId = -1;
                this.game.phase = "";
                this.game.isPlaying = false;
                this.config.isFront = false;
                this.game.positionSet = false;
                this.broadcastIPC("is-lol-game-live", false);
                this.broadcastIPC("lol-current-game-queue", -9999);
                break;
            case "Matchmaking":
                if (this.game.phase === data.phase) break;
                this.game.championId = -1;
                this.game.queueId = -1;
                this.game.phase = "";
                this.game.isPlaying = false;
                this.config.isFront = false;
                this.game.positionSet = false;
                clearInterval(this.liveClientDataInterval);
                this.broadcastIPC("is-lol-game-live", false);
                this.broadcastIPC("lol-current-game-queue", -9999);
                break;
            case "PreEndOfGame":
                if (this.game.phase === data.phase) break;
                break;
            case "InProgress":
                if (this.game.phase === data.phase) break;

                if (data.gameClient.serverIp !== "") {
                    let playGameWithRecommended = 0;
                    try {
                        if (this.game.queueId === 420) {
                            let liveopChampions = await this.app.window.getLocalStorage("liveop-champions") ?? "[]";
                            let mostChampions = await this.app.window.getLocalStorage("most-champions") ?? "[]";
                            try {
                                liveopChampions = JSON.parse(liveopChampions);
                                mostChampions = JSON.parse(mostChampions);
                            } catch (_) {
                            }
                            if (liveopChampions.includes(this.game.championId) && !mostChampions.includes(this.game.championId)) {
                                playGameWithRecommended = 1;
                            }
                        }
                    } catch (_) {}
                    sendGA4Event("play_game", {
                        queueId: this.game.queueId,
                        gameId: data.gameData.gameId,
                        useRecommendation: playGameWithRecommended
                    });
                } else {
                    sendGA4Event("spectate_game", {
                        queueId: this.game.queueId
                    });
                }

                if (!lolConstants.TFT_QUEUE_IDS.includes(this.game.queueId)) {
                    this.removeItemSet(false);

                    let tmpName = "";
                    if (data.gameClient.serverIp !== "") {
                        tmpName = this.game.summoner.displayName;
                    } else {
                        tmpName = data.gameData.playerChampionSelections[0].summonerInternalName;
                        this.broadcastIPC("lol-current-game-queue", -9998);
                        this.getIngameData(tmpName);
                    }

                    if (!lolConstants.BOT_QUEUE_IDS.includes(this.game.queueId) && data.gameClient.serverIp !== "") {
                        let goldSpent = 0;
                        let predictCS = 0;
                        let prevGold = 500;
                        let prevCS = 0;
                        let isFirst = true;
                        let position = "M";
                        let ingameInterval = setInterval(async () => {
                            let liveClientData = await this.callAPI("GET", "liveclientdata", "/allgamedata").catch((_) => {
                                return null;
                            });
                            if (!liveClientData) return;
                            clearInterval(ingameInterval);
                            ingameInterval = null;

                            this.getIngameData(tmpName);

                            if (lolConstants.SKILL_OVERLAY_NOT_SUPPORTED.includes(this.game.championId) && this.app.overlayWindow !== null) {
                                this.app.overlayWindow.sendToRenderer("lol-levelup-hide", true);
                            }
                            // this.app.overlayWindow.sendToRenderer("lol-levelup-hide", true);
                            let gameStartInterval = setInterval(async () => {
                                let liveClientData = await this.callAPI("GET", "liveclientdata", "/eventdata").catch((_) => {
                                    return null;
                                });
                                if (!liveClientData) return;
                                if (liveClientData.data.Events.length > 0) {
                                    // this.app.overlayWindow.sendToRenderer("lol-levelup-hide", false);
                                    clearInterval(gameStartInterval);
                                    this.liveClientDataInterval = setInterval(async () => {
                                        // overlay - skill
                                        let liveClientData = await this.callAPI("GET", "liveclientdata", "/activeplayer").catch((_) => {
                                            return null;
                                        });
                                        if (!liveClientData) return;
                                        let total = 0;
                                        if (lolConstants.TRANSFORM_CHAMPION_IDS.includes(this.game.championId)) {
                                            total = -1;
                                        }

                                        for (let [key, value] of Object.entries(liveClientData.data.abilities)) {
                                            if (key !== "Passive") {
                                                total += value.abilityLevel;
                                            }
                                        }

                                        if (this.app.overlayWindow !== null) {
                                            if (total === liveClientData.data.level || lolConstants.SKILL_OVERLAY_NOT_SUPPORTED.includes(this.game.championId)) {
                                                this.app.overlayWindow.sendToRenderer("lol-levelup-hide", true);
                                            } else {
                                                this.app.overlayWindow.sendToRenderer("lol-levelup-hide", false);
                                            }
                                            // this.app.overlayWindow.sendToRenderer("lol-levelup", liveClientData.data.level);
                                            this.app.overlayWindow.sendToRenderer("lol-levelup", total);
                                        }

                                        if (lolConstants.RIFT_QUEUE_IDS.includes(this.game.queueId) && this.app.overlayWindow !== null) {
                                            this.app.overlayWindow.sendToRenderer("lol-diff-hide", false);

                                            if (isFirst) {
                                                isFirst = false;
                                                let playerList = await this.callAPI("GET", "liveclientdata", "/playerlist").catch((_) => {
                                                    return null;
                                                });
                                                if (!playerList) return;
                                                position = _.find(playerList.data, {summonerName: liveClientData.data.summonerName})?.position;
                                                this.app.overlayWindow.sendToRenderer("lol-diff", {
                                                    gold: 500,
                                                    cs: 0,
                                                    summoner: this.game.summonerRank,
                                                    time: 0,
                                                    predictCS: 0,
                                                    position: position
                                                });
                                            }

                                            // overlay - diff
                                            // 근거리 미니언 : 21골드
                                            // 원거리 미니언 : 14골드
                                            // 대포 미니언 : 60골드(미드 50골드) 90초당 + 3골드 최대 90골드
                                            // 미니언 최초 생성 2분 5초 3웨이브마다, 15분 이후에 2웨이브마다, 25분 이후에는 매 웨이브
                                            // 템 팔 때 오류 (템 되돌리기 시 골드에 오차가 생길 수 있음)
                                            let gameStats = await this.callAPI("GET", "liveclientdata", "/gamestats").catch((_) => {
                                                return null;
                                            });
                                            if (!gameStats) return;

                                            if (liveClientData.data.currentGold - prevGold <= 100 && liveClientData.data.currentGold - prevGold >= 14) {
                                                predictCS += parseInt((liveClientData.data.currentGold - prevGold) / 14);
                                            }
                                            if (liveClientData.data.currentGold - prevGold < 0) {
                                                goldSpent += prevGold - liveClientData.data.currentGold;
                                            }
                                            // console.log(liveClientData.data.currentGold + goldSpent, goldSpent, liveClientData.data.currentGold - prevGold, liveClientData.data.currentGold, prevGold, predictCS, prevCS + predictCS);
                                            if (parseInt(gameStats.data.gameTime) % 60 === 0) {
                                                let activePlayerScore = await this.callAPI("GET", "liveclientdata", `/playerscores?summonerName=${encodeURI(liveClientData.data.summonerName)}`).catch((_) => {
                                                    return null;
                                                });
                                                if (!activePlayerScore) return;

                                                if (activePlayerScore.data.creepScore !== prevCS) {
                                                    predictCS -= activePlayerScore.data.creepScore - prevCS;
                                                    if (predictCS >= 10 || predictCS < 0) {
                                                        predictCS = 0;
                                                    }
                                                }

                                                // console.log(activePlayerScore.data, {
                                                //     gold: liveClientData.data.currentGold + goldSpent,
                                                //     cs: activePlayerScore.data.creepScore,
                                                //     summoner: this.game.summonerRank,
                                                //     time: parseInt(gameStats.data.gameTime),
                                                //     predictCS: predictCS,
                                                //     totalCS: predictCS + activePlayerScore.data.creepScore,
                                                //     position: position
                                                // });

                                                this.app.overlayWindow.sendToRenderer("lol-diff", {
                                                    gold: liveClientData.data.currentGold + goldSpent,
                                                    cs: activePlayerScore.data.creepScore,
                                                    summoner: this.game.summonerRank,
                                                    time: parseInt(gameStats.data.gameTime),
                                                    predictCS: predictCS,
                                                    position: position
                                                });
                                                prevCS = activePlayerScore.data.creepScore;
                                            }
                                            prevGold = liveClientData.data.currentGold;
                                        } else {
                                            if (this.app.overlayWindow !== null) {
                                                this.app.overlayWindow.sendToRenderer("lol-diff-hide", true);
                                            }
                                        }
                                    }, 1000);
                                }
                            }, 1000);
                        }, 1000);
                    }
                }

                // overlay
                if (!isNMP && this.app.overlayWindow && process.platform === "win32" &&
                    IOVhook && this.config.isOverlayOn && data.gameClient.serverIp !== "") {
                    let isInjected = false;
                    if (!isInjected) {
                        let tmpInterval = setInterval(() => {
                            for (let i = 0; i < IOVhook.getTopWindows().length; i++) {
                                const p = IOVhook.getTopWindows()[i];
                                if (p.title === "League of Legends (TM) Client") {
                                    this.app.overlayWindow.sendToRenderer("init-overlay");
                                    ipcMain.emit("lol-loaded");
                                    isInjected = true;
                                    clearInterval(tmpInterval);
                                    IOVhook.injectProcess(p);
                                    this.app.overlayWindow.toggleOverlay();
                                    sendGA4Event("lol_overlay_injected", {});
                                }
                            }
                        }, 3000);
                    }
                }
                break;
            case "EndOfGame":
                if (this.game.phase === data.phase) break;
                if (this.game.queueId === 400 || this.game.queueId === 420 || this.game.queueId === 430 || this.game.queueId === 440 || this.game.queueId === 450 || this.game.queueId === -1) {
                    if (this.app.overlayWindow !== null) {
                        this.app.overlayWindow.sendToRenderer("destroy-overlay");
                    }
                    let apiName = "data";
                    if (this.game.queueId === 450) {
                        apiName = "data2";
                    }
                    let intervalEOG = setInterval(() => {
                        this.callAPI("GET", "lol", lolConstants.LOL_EOG_STATS_BLOCK).then((data) => {
                            let tmpTeam = _.find(data.data.teams, {isPlayerTeam: true});
                            sendGA4Event("play_game_end", {
                                queueId: this.game.queueId,
                                gameId: data.data.gameId,
                                gameLength: data.data.gameLength,
                                skinId: data.data.localPlayer.skinTilePath.split(`/${data.data.localPlayer.championId}/`)[1].split(".")[0],
                                championId: data.data.localPlayer.championId,
                                result: tmpTeam.isWinningTeam === true ? "W" : "L"
                            });
                            this.broadcastIPC("eog", data.data);
                            this.callAPI("POST", apiName, "/opscore", data.data).then((response) => {
                                response.data.winningTeam = data.data.teams[0].isWinningTeam ? 100 : 200;
                                this.broadcastIPC("opscore", response.data);
                            });
                            clearInterval(intervalEOG);
                        }).catch((err) => {
                            console.log(err);
                        });
                    }, 1000);
                }
                clearInterval(this.liveClientDataInterval);
                this.game.championId = -1;
                this.game.queueId = -1;
                this.game.phase = "";
                this.game.isPlaying = false;
                this.config.isFront = false;
                this.game.positionSet = false;
                this.broadcastIPC("is-lol-game-live", false);
                this.broadcastIPC("lol-current-game-queue", -9999);
                this.app.window.show();
                break;
            case "None":
                this.game.championId = -1;
                this.game.queueId = -1;
                this.game.phase = "";
                this.game.isPlaying = false;
                this.config.isFront = false;
                this.game.positionSet = false;
                clearInterval(this.liveClientDataInterval);
                this.broadcastIPC("is-lol-game-live", false);
                this.broadcastIPC("lol-current-game-queue", -9999);
        }

        this.game.phase = data.phase;
    }

    lobby(data) {
        let firstPositionPreference = data.localMember.firstPositionPreference;
        if (firstPositionPreference !== "UNSELECTED") {
            this.game.lobbyPosition = firstPositionPreference;
        }

        if (data.gameConfig.queueId === 420 && firstPositionPreference !== "UNSELECTED") {
            if (firstPositionPreference === "FILL") {
                firstPositionPreference = "TOP";
            }
            this.broadcastIPC("is-solo-rank", {
                is420: true,
                position: lolConstants.OP_POSITION_MAP[firstPositionPreference]
            });
        } else {
            this.broadcastIPC("is-solo-rank", {
                is420: false,
                position: null
            });
        }
    }

    async champSelectionSession(data) {
        if (!this.game.isPlaying && !lolConstants.TFT_QUEUE_IDS.includes(this.game.queueId) && this.game.queueId !== 420) {
            this.game.isPlaying = true;

            if (process.platform !== "darwin") {
                this.app.window.showInactive();
            }

            let promises = [];
            let summoners = [];
            if (this.config.region.region !== "TENCENT") {
                data.myTeam.forEach((summoner) => {
                    promises.push(
                        this.callAPI("GET", "lol", `${lolConstants.LOL_GET_SUMMONER}/${summoner.summonerId}`).then((response) => {
                            summoners.push(response.data.displayName);
                        })
                    );
                });
                Promise.all(promises).then(() => {
                    this.callAPI("GET", "lol-api-summoner", `/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/summoners?name=${encodeURI(summoners.join(","))}`)
                        .then(async (res) => {
                            if (res.status === 200) {
                                if (res.data) {
                                    let summonerIds = [];
                                    res.data.data.map((summoner) => {
                                        summonerIds.push(summoner.summoner_id);
                                    });

                                    let tmpSummoners = [];
                                    if (summonerIds.length > 0) {
                                        for (let i = 0; i < summonerIds.length; i++) {
                                            let tmp = await this.callAPI("GET", "lol-api-summoner", `/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/summoners/${summonerIds[i]}/summary`)
                                                .catch(() => {return null;});
                                            if (tmp) {
                                                tmpSummoners.push(tmp.data.data);
                                            }
                                        }
                                        this.broadcastIPC("multisearch", tmpSummoners);
                                    }
                                }
                            }
                        });
                })
            }
        }

        let localPlayerCellId = data.localPlayerCellId;
        let me = _.find(data.myTeam, {cellId: localPlayerCellId});
        let hasChange = false;
        let myPick =  _.find(data.actions.flat(), {
            type: "pick",
            actorCellId: localPlayerCellId
        });

        if (me) {
            try {
                this.game.position = me.assignedPosition;
                if (this.game.queueId === 420 && !this.game.positionSet) {
                    this.game.positionSet = true;
                    this.broadcastIPC("is-solo-rank", {
                        is420: true,
                        position: lolConstants.OP_POSITION_MAP[me.assignedPosition.toUpperCase()]
                    });
                }
            } catch (_) {}

            if (me.championId !== 0 && me.championId !== this.game.championId) {
                hasChange = true;
                this.game.championId = me.championId;
            } else if (me.championPickIntent !== 0 && me.championPickIntent !== this.game.championId) {
                hasChange = true;
                this.game.championId = me.championPickIntent;
            } else if (myPick && myPick?.championId !== 0 && myPick?.championId !== this.game.championId && this.game.queueId !== -1) {
                hasChange = true;
                this.game.championId = myPick?.championId;
            }
        }

        if (hasChange && !lolConstants.TFT_QUEUE_IDS.includes(this.game.queueId)) {
            if (process.platform !== "darwin") {
                if (!this.config.isFront) {
                    this.config.isFront = true;
                    // TODO: 맨 첫 챔피언 픽일 때에는 "준비완료"를 누르면 앞으로 데스크톱앱 나오게 수정
                    // this.app.window.show();
                    this.app.window.showInactive();
                } else {
                    this.app.window.showInactive();
                }
            }
            let selectedRegion = await this.app.window.getLocalStorage("selected-region") ?? "kr";
            let tierFilter = await this.app.window.getLocalStorage("tier-filter") ?? "platinum_plus";
            let versionFilter = await this.app.window.getLocalStorage("version-filter") ?? "";
            this.getChampionData("", this.game.championId, this.game.queueId, true, selectedRegion, tierFilter, -1, versionFilter);
        }

        let enemyPickedChampions = [];
        data.theirTeam.forEach((enemy) => {
            if (enemy.championId !== 0) {
                enemyPickedChampions.push({
                    "id": enemy.championId,
                    "key": idToKey(enemy.championId)
                });
            }
        });
        if (enemyPickedChampions.length > 0) {
            this.broadcastIPC("enemyPicked", enemyPickedChampions);
        }
    }

    async getChampionData(position, championId = 0, queueId = 420,
                          isLive = true, region = "kr", tier = "platinum_plus",
                          targetChampion = -1, version = "") {
        this.game.perkPages = {
            "top": [],
            "jungle": [],
            "mid": [],
            "adc": [],
            "support": [],
            "urf": [],
            "aram": []
        };
        this.game.itemSets = {
            "top": {},
            "jungle": {},
            "mid": {},
            "adc": {},
            "support": {},
            "urf": {},
            "aram": {}
        };
        this.game.globalItemSets = {
            "top": {},
            "jungle": {},
            "mid": {},
            "adc": {},
            "support": {},
            "urf": {},
            "aram": {}
        };
        this.game.spellSets = [];

        let i18nLocale = await this.app.window.getLocalStorage("i18n");
        let isKR = i18nLocale === "kr";

        let mode = "ranked";
        if (queueId === 900 || queueId === 1900) {
            mode = "urf";
            tier = "gold_plus";
            version = "";
        } else if (queueId === 450) {
            mode = "aram";
            tier = "gold_plus";
            version = "";
        } else if (queueId === -1) {
            if (this.game.mapId === "ARAM") {
                this.game.queueId = 450;
                mode = "aram";
                tier = "gold_plus";
                version = "";
            }
        }

        let primaryLane = mode;
        let overviewAPI = `/api/${region}/champions/${mode}/${championId}`;
        let summaries = null;
        let liveOP = null;

        if (position === "") {
            summaries = await this.callAPI("GET", "lol-api-champion", `/api/${region}/champions/${mode}/${championId}/summaries?tier=${tier}&version=${version}`).catch(() => {
                return null;
            });
        }

        if (mode === "ranked") {
            if (summaries) {
                if (summaries && (summaries.data.data.is_rip || summaries.data.data.positions.length === 0)) {
                    primaryLane = "top";
                } else {
                    primaryLane = summaries.data.data.positions[0].name.toLowerCase();
                }
            }
            if (position) {
                primaryLane = position.toLowerCase();
            }
            overviewAPI += `/${primaryLane}?tier=${tier}&target_champion=${targetChampion === -1 ? "" : targetChampion}&version=${version}`;

            liveOP = await this.callAPI("GET", "s3", "/analytics/KR/champion_stats.json").catch(() => {return null;});
            if (liveOP) liveOP = liveOP.data;
        } else {
            overviewAPI += `/none?tier=${tier}&version=${version}`;
        }

        if (summaries || position) {
            // Edited By BlacK201
            // let tips = await this.callAPI("GET", "s3-980ti", `/tips/{0}/tips_${isKR ? "kr" : "en"}.json`.format(championId))
            //     .catch(() => {return null;});
            // if (tips) tips = tips.data;

            // let counters = await this.callAPI("GET", "s3", `/analytics/counter/${championId}/${primaryLane}.json`)
            //     .catch(() => {return null;});
            // if (counters) counters = counters.data;

            let overview = await this.callAPI("GET", "lol-api-champion", overviewAPI).catch(() => {return null;});
            if (overview) {
                overview = overview.data.data;
                if (isLive) {
                    // Edited By BlacK201
                    this.broadcastIPC("champions", {
                        queueId: queueId,
                        data: overview,
                        tips: null,
                        lane: primaryLane,
                        counters: null,
                        liveOP: liveOP,
                        assignedPosition: this.game.position,
                        soloRankTier: this.game.soloRank
                    });

                    // 오버레이 스킬
                    if (overview.skills.length > 0 && this.app.overlayWindow) {
                        this.app.overlayWindow.sendToRenderer("lol-skill-data", overview.skills[0].order);
                    }

                    // 자동 스펠 설정
                    let selectionBody = {};
                    if (overview.summoner_spells.length > 0) {
                        let flashIndex = overview.summoner_spells[0].ids[0] === 4 ? 0 : 1;
                        if (overview.summoner_spells[0].ids[0] !== 4 && overview.summoner_spells[0].ids[1] !== 4) {
                            flashIndex = 0;
                        }
                        selectionBody = {
                            "spell1Id": overview.summoner_spells[0].ids[1-flashIndex], // d
                            "spell2Id": overview.summoner_spells[0].ids[flashIndex] // f
                        }

                        if (this.config.spellLocation === "d") {
                            selectionBody = {
                                "spell1Id": overview.summoner_spells[0].ids[flashIndex], // d
                                "spell2Id": overview.summoner_spells[0].ids[1-flashIndex] // f
                            }
                        }
                        this.game.spellSets = [overview.summoner_spells[0].ids[flashIndex], overview.summoner_spells[0].ids[1-flashIndex]];
                    }

                    // 자동 룬 설정
                    overview.rune_pages.map((page, index) => {
                        if (index < 2) {
                            page.builds.map((build, i) => {
                                if (i < 2) {
                                    let tmp = {
                                        "autoModifiedSelections": [
                                            0
                                        ],
                                        "current": true,
                                        "id": 0,
                                        "isActive": true,
                                        "isDeletable": true,
                                        "isEditable": true,
                                        "isValid": true,
                                        "lastModified": 0,
                                        "name": `OP.GG ${primaryLane} ${this.app.i18n[i18nLocale].translation["champions"][championId]}`,
                                        "order": 0,
                                        "primaryStyleId": build.primary_page_id,
                                        "selectedPerkIds": [].concat(build.primary_rune_ids, build.secondary_rune_ids, build.stat_mod_ids),
                                        "subStyleId": build.secondary_page_id
                                    };

                                    console.log(tmp);
                                    this.game.perkPages[primaryLane].push(tmp);
                                }
                            })
                        }
                    });

                    // 자동 아이템 설정
                    let makeBlock = (type) => {
                        return {
                            "type": type,
                            "hideIfSummonerSpell": "",
                            "showIfSummonerSpell": "",
                            "items": []
                        };
                    };

                    let itemSet = {
                        "associatedChampions": championId === 0 ? [] : [championId],
                        "associatedMaps": [],
                        "blocks": [],
                        "map": "any",
                        "mode": "any",
                        "preferredItemSlots": [],
                        "sortrank": 1,
                        "priority":true,
                        "startedFrom": "blank",
                        "title": `OP.GG ${this.app.i18n[i18nLocale].translation["champions"][championId]}`,
                        "type": "custom",
                        "uid": v4()
                    };
                    let block = {};
                    let cnt = 0;
                    let title = "";

                    let globalItemSet = {
                        "title": `OP.GG ${this.app.i18n[i18nLocale].translation["champions"][championId]}`,
                        "type": "custom",
                        "map": "any",
                        "mode": "any",
                        "priority":true,
                        "sortrank": 1,
                        "blocks": [],
                        "championKey": ""
                    }

                    // 시작 아이템
                    if (overview.starter_items.length > 0) {
                        cnt = 0;
                        overview.starter_items.some((starter_item) => {
                            if (cnt === 2) return;
                            title = `${this.app.i18n[i18nLocale].translation.live.feature.champion["starter-item"]}`;
                            if (cnt === 0 && overview.skills.length > 0) {
                                title += ` - Lv 1~4 ${overview.skills[0].order[0]}>${overview.skills[0].order[1]}>${overview.skills[0].order[2]}>${overview.skills[0].order[3]}`;
                            }
                            block = makeBlock(title);
                            starter_item.ids.forEach((id) => {
                                let itemObject = {
                                    count: 1,
                                    id: id.toString()
                                }
                                block.items.push(itemObject);
                            });
                            itemSet.blocks.push(block);
                            globalItemSet.blocks.push(block);
                            cnt += 1;
                        });
                    }

                    // 신발
                    title = `${this.app.i18n[i18nLocale].translation.live.feature.champion["boots"]}`;
                    if (overview.skill_masteries.length > 0) {
                        title += ` - Skill Build ${overview.skill_masteries[0].ids[0]}>${overview.skill_masteries[0].ids[1]}>${overview.skill_masteries[0].ids[2]}`
                    }
                    block = makeBlock(title);
                    if (overview.boots.length > 0) {
                        cnt = 0;
                        overview.boots.some((boot) => {
                            if (cnt === 3) return;
                            let itemObject = {
                                count: 1,
                                id: boot.ids[0].toString()
                            }
                            block.items.push(itemObject);
                            cnt += 1;
                        });
                        itemSet.blocks.push(block);
                        globalItemSet.blocks.push(block);
                    }

                    // 추천 빌드
                    cnt = 0;
                    overview.core_items.forEach((coreItem) => {
                        if (cnt === 3) return;
                        block = makeBlock(`${this.app.i18n[i18nLocale].translation.live.feature.champion["recommend-build"]} - Pick:${(coreItem.pick_rate*100).toFixed(2)}, Win:${(coreItem.win/coreItem.play*100).toFixed(2)}`);
                        coreItem.ids.forEach((id) => {
                            id = this.itemBugHotfix(id);
                            let itemObject = {
                                count: 1,
                                id: id.toString()
                            }
                            block.items.push(itemObject);
                        })
                        itemSet.blocks.push(block);
                        globalItemSet.blocks.push(block);
                        cnt += 1;
                    });

                    let tmpItems = [];
                    cnt = 0;
                    block = makeBlock(this.app.i18n[i18nLocale].translation.live.feature.champion["core-items"]);
                    overview.core_items.some((core_item) => {
                        if (cnt === 10) return;
                        core_item.ids.some((id) => {
                            id = this.itemBugHotfix(id);
                            if (tmpItems.indexOf(id) === -1) {
                                tmpItems.push(id);
                                cnt += 1;
                                let itemObject = {
                                    count: 1,
                                    id: id.toString()
                                }
                                block.items.push(itemObject);
                            }
                        })
                    });
                    itemSet.blocks.push(block);
                    globalItemSet.blocks.push(block);

                    this.game.itemSets[primaryLane] = itemSet;
                    this.game.globalItemSets[primaryLane] = globalItemSet;

                    if (this.config.isSpellOn) {
                        let updateResult = await this.callAPI("PATCH", "lol", lolConstants.LOL_CHAMPSELECT_MY_SELECTION, selectionBody).catch(() => { return null; });
                        if (!updateResult) {
                            // 스펠 설정 오류 알림
                        }
                    }

                    if (this.config.isRuneOn) {
                        this.checkPerkPage(this.game.perkPages[primaryLane][0]);
                    }

                    if (this.config.isItemBuildOn) {
                        this.updateItemSet(this.game.itemSets[primaryLane], this.game.globalItemSets[primaryLane]);
                    }
                } else {
                    // Edited By BlacK201
                    let tips = await this.callAPI("GET", "s3-980ti", `/tips/{0}/tips_${isKR ? "kr" : "en"}.json`.format(championId))
                    .catch(() => {return null;});
                    if (tips) tips = tips.data;

                    let counters = await this.callAPI("GET", "s3", `/analytics/counter/${championId}/${primaryLane}.json`)
                        .catch(() => {return null;});
                    if (counters) counters = counters.data;
                    return {
                        queueId: queueId,
                        data: overview,
                        tips: tips,
                        lane: primaryLane,
                        counters: counters
                    };
                }
            }
            else {
                this.broadcastIPC("champions", null);
            }
        } else {
            this.broadcastIPC("champions", null);
        }
    }

    checkPerkPage(newPage) {
        if (newPage) {
            this.callAPI("GET", "lol", lolConstants.LOL_PERK_PAGES).then((response) => {
                let pageExists = false;
                response.data.some((page) => {
                    if (page.name.indexOf("OP.GG") !== -1) {
                        pageExists = true;
                        this.callAPI("DELETE", "lol", lolConstants.LOL_PERK_PAGE.format(page.id)).then((response) => {
                            this.updatePerkPage(newPage)
                        }).catch((err) => {
                            console.log(err);
                        });
                        return true;
                    }
                });

                if (!pageExists) {
                    this.updatePerkPage(newPage);
                }
            });
        }
    }

    updatePerkPage(page) {
        this.callAPI("POST", "lol", lolConstants.LOL_PERK_PAGES, page).then((_) => {})
            .catch((err) => {
                // if all rune pages are not available
                this.callAPI("GET", "lol", lolConstants.LOL_PERK_PAGES).then((response) => {
                    this.callAPI("DELETE", "lol", lolConstants.LOL_PERK_PAGE.format(response.data[0].id))
                        .then((_) => {this.updatePerkPage(page)})
                        .catch((_) => {});
                });
            });
    };

    updateItemSet(itemSet, globalItemSet) {
        if (this.game.summoner !== null) {
            this.callAPI("GET", "lol",
                lolConstants.LOL_ITEM_SETS.format(this.game.summoner.summonerId))
                .then((response) => {

                    let data = response.data;

                    let newItemSets = {
                        accountId: this.game.summoner.accountId,
                        timestamp: Date.now(),
                        itemSets: []
                    };

                    data.itemSets.forEach((d) => {
                        if (d.title.indexOf("OP.GG") === -1 && d.title !== "" && d.associatedChampions.length >= 0) {
                            newItemSets.itemSets.push(d);
                        }
                    });
                    newItemSets.itemSets.push(itemSet);

                    this.callAPI("PUT", "lol",
                        lolConstants.LOL_ITEM_SETS.format(this.game.summoner.summonerId), newItemSets);
                });

            if (this.game.fdItem) {
                fs.close(this.game.fdItem, (err) => {
                    if (err) return;
                    this.game.fdItem = null;
                });
            }
            fs.writeFile(path.join(this.app.game.lol.config.installDir, `Config/Global/Recommended/!opgg-0.json`), JSON.stringify(globalItemSet), (err) => {
                fs.open(path.join(this.app.game.lol.config.installDir, `Config/Global/Recommended/!opgg-0.json`), (err, fd) => {
                    this.game.fdItem = fd;
                });
            });
        }
    }

    removeItemSet(force=false) {
        fs.readdir(path.join(this.app.game.lol.config.installDir, `Config/Global/Recommended/`), (err, files) => {
            if (err) return;

            for (const file of files) {
                if (!file.includes("opgg") || force) {
                    if (this.game.fdItem) {
                        fs.close(this.game.fdItem, (err) => {
                            if (err) return;
                            this.game.fdItem = null;
                        });
                    }
                    fs.unlink(path.join(this.app.game.lol.config.installDir, `Config/Global/Recommended/`, file), (err) => {
                        if (err) return;
                    });
                }
            }
        });
    }

    updateSpellSet(key) {
        if (this.game.summoner !== null && this.game.queueId !== 1300 && this.game.queueId !== 1400) {
            try {
                let tmp = this.game.spellSets;
                let selectionBody = {
                    "spell1Id": tmp[1],
                    "spell2Id": tmp[0],
                };

                if (key === "d") {
                    selectionBody = {
                        "spell1Id": tmp[0],
                        "spell2Id": tmp[1],
                    };
                }

                this.callAPI("PATCH", "lol", lolConstants.LOL_CHAMPSELECT_MY_SELECTION, selectionBody);
            }
            catch (_) {}
        }
    }

    async getIngameData(summonerName) {
        // this.callAPI("GET", "opgg", encodeURI(`/app/summoner/spectator/index.json/summonerName=${summonerName}`)).then((data) => {
        //     this.broadcastIPC("ingame", data.data);
        // }).catch((error) => {
        //     // console.log(error);
        // });

        let opgg = await this.callAPI("GET", "lol-api-summoner", `/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/summoners?name=${encodeURI(summonerName)}`).catch(() => {return null});
        if (!opgg) return null;

        this.callAPI("GET", "lol-api-summoner", encodeURI(`/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/spectates/${opgg.data.data[0].summoner_id}`)).then((data) => {
            this.broadcastIPC("ingame", data.data);
        }).catch((_) => {

        })
    }

    async renewal(arg) {
        let opgg = await this.callAPI("GET", "lol-api-summoner", `/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/summoners?name=${encodeURI(arg)}`).catch(() => {return null});
        if (!opgg) return null;

        return await this.callAPI("POST", "lol-api-summoner", `/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/summoners/${opgg.data.data[0].summoner_id}/renewal`).then((res) => {
            return res.data;
        }).catch(() => {
            return null;
        });
    }

    async getMyPage(arg) {
        try {
            let i18nLocale = await this.app.window.getLocalStorage("i18n");
            try {
                let summoner = await this.callAPI("GET", "lol", `${lolConstants.LOL_GET_SUMMONER}?${encodeURI(`name=${arg}`)}`).catch(() => {
                    return null
                });
                if (summoner) {
                    summoner = summoner.data;
                    let response = await this.callAPI("GET", "lol", `${lolConstants.LOL_RANKED_STATS}/${summoner.puuid}`).catch(() => {
                        return null
                    });
                    if (response) {
                        let ranked = response.data;
                        let response2 = await this.callAPI("GET", "lol", lolConstants.LOL_CAREER_STATS_SUMMONER_GAMES.format(summoner.puuid)).catch(() => {
                            return null
                        });
                        if (response2) {
                            let opgg = await this.callAPI("GET", "lol-api-summoner", `/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/summoners?name=${encodeURI(summoner.displayName)}`).catch(() => {
                                return null
                            });
                            // let opgg = await callAPI("GET", "lol-api-summoner", `/api/${newRegionMap[regionConfig.region]}/summoners?name=${encodeURI("디알엑스 제트")}`).catch((err) => {return null});
                            if (opgg) {
                                let opggSummoner = await this.callAPI("GET", "lol-api-summoner", `/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/summoners/${opgg.data.data[0].summoner_id}?hl=${lolConstants.LOCALE_MAP[i18nLocale]}`).catch(() => {
                                    return null
                                });
                                if (opggSummoner) {
                                    opggSummoner = opggSummoner.data.data;
                                    if (opggSummoner.lp_histories) {
                                        for (let i = 0; i < opggSummoner.lp_histories.length; i++) {
                                            let tmpDate = new Date(opggSummoner.lp_histories[i].created_at);
                                            let lpHistory = opggSummoner.lp_histories[i];
                                            lpHistory.created_at = `${('0' + (tmpDate.getMonth() + 1)).slice(-2)}.${('0' + tmpDate.getDate()).slice(-2)}`;
                                            if (lpHistory.tier_info) {
                                                lpHistory.tier = lpHistory.tier_info.tier[0] + lpHistory.tier_info.division + " " + lpHistory.tier_info.lp + "LP";
                                            } else {
                                                lpHistory.tier = "";
                                            }
                                        }
                                    }

                                    let games = await this.callAPI("GET", "lol-api-summoner", `/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/summoners/${opgg.data.data[0].summoner_id}/games?limit=20&hl=${lolConstants.LOCALE_MAP[i18nLocale]}`, null, {}, true).catch(() => {
                                        return null
                                    });
                                    if (games) {
                                        return {
                                            career: response2.data,
                                            summoner: summoner,
                                            ranked: ranked,
                                            opgg: opggSummoner,
                                            games: games.data.data
                                        }
                                    }

                                    return {
                                        career: response2.data,
                                        summoner: summoner,
                                        ranked: ranked,
                                        opgg: opggSummoner,
                                        games: []
                                    }
                                }
                            }

                            return {
                                career: response2.data,
                                summoner: summoner,
                                ranked: ranked,
                                opgg: null,
                                games: []
                            }
                        }
                        return {
                            career: null,
                            summoner: summoner,
                            ranked: ranked,
                            opgg: null,
                            games: []
                        }
                    }
                    return {
                        career: null,
                        summoner: summoner,
                        ranked: null,
                        opgg: null,
                        games: []
                    }
                }

                return null;
            } catch (e) {
                return null;
            }
        } catch (_) {return null;}
    }

    itemBugHotfix(id) {
        switch (id) {
            case 3042: // 무라마나 -> 마나무네
                id = 3004;
                break;
            case 3040: // 대천사의 포옹 => 대천사의 지팡이
                id = 3003;
                break;
            default:
                break;
        }

        return id;
    }

    async championRecommendation(seasonId) {
        if (this.game.summoner) {
            let opgg = await this.callAPI(
                "GET",
                "lol-api-summoner",
                `/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/summoners?name=${encodeURI(this.game.summoner.displayName)}`
            ).catch(() => {
                return null
            });
            if (!opgg) return false;

            let mostChampion = await this.callAPI(
                "GET",
                "lol-api-summoner",
                `/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/summoners/${opgg.data.data[0].summoner_id}/most-champions/rank?game_type=RANKED&season_id=${seasonId}`
            ).catch(() => {
                return null
            });
            if (!mostChampion) return false;
            return {
                mostChampion: mostChampion.data.data
            }
        }
        return false;
    }

    ipc() {
        ipcMain.on("test1", () => {
            nodeStorage.setItem("test1", "true");
        });

        ipcMain.on("current-summoner", (event) => {
            event.returnValue = this.game.summoner;
        });

        ipcMain.handle("current-summoner", () => {
            return this.game.summoner;
        });

        ipcMain.handle("is-lol-running", () => {
            return this.isGameRunning;
        });

        ipcMain.on("update-perk-page", (event, arg) => {
            try {
                if (this.config.isRuneOn || arg["clicked"]) {
                    if (this.game.perkPages[arg["lane"]].length > 0) {
                        this.checkPerkPage(this.game.perkPages[arg["lane"]][arg["page"]]);
                    }
                }
            } catch (e) {}
        });

        ipcMain.on("update-item-set", (event, arg) => {
            if (this.config.isItemBuildOn) {
                this.updateItemSet(this.game.itemSets[arg], this.game.globalItemSets[arg]);
            }
        });

        ipcMain.on("update-spell-set", (event, arg) => {
            try {
                if (this.config.isSpellOn) {
                    this.updateSpellSet(arg);
                }
            } catch(e) {}
        });

        ipcMain.on("update-champion-lane", (event, arg) => {
            this.getChampionData(arg[0], arg[1], arg[2], true, arg[4], arg[5], -1, arg[6]);
        });

        ipcMain.handle("get-champion-data", async (event, arg) => {
            return this.getChampionData(arg[0], arg[1], arg[2], arg[3], arg[4], arg[5], arg[6], arg[7]);
        });

        ipcMain.handle("get-combos", () => {
            return this.api.combos;
        });

        ipcMain.on("autorune", (event, arg) => {
            this.config.isRuneOn = arg;
        });

        ipcMain.on("autoitem", (event, arg) => {
            this.config.isItemBuildOn = arg;
        });

        ipcMain.on("autoaccept", (event, arg) => {
            this.config.isAutoAcceptOn = arg;
        });

        ipcMain.on("spell", (event, arg) => {
            this.config.spellLocation = arg;
        });

        ipcMain.on("isSpell", (event, arg) => {
            this.config.isSpellOn = arg;
        });

        ipcMain.on("isOverlay", (event, arg) => {
            this.config.isOverlayOn = arg;
        });

        ipcMain.on("openSummonerPage", (event, arg) => {
            if (arg) {
                if (arg === true) {
                    arg = this.game.summoner.displayName;
                }
                shell.openExternal(`https://www.op.gg/summoners/${this.config.opggRegion}/${arg}`);
            }
        });

        const ENCRYPTION_KEY = "OPGG_SECRET_KEY";
        const encrypt = (summonerId, puuid) => {
            try {
                const salt = enc.Hex.parse(summonerId);
                const iv = enc.Hex.parse(puuid);
                const timestamp = new Date().getTime().toString();
                const keySize = 128;
                const key = PBKDF2(ENCRYPTION_KEY, salt, { keySize: keySize / 32 });
                const encrypted = AES.encrypt(timestamp, key, { iv });
                return encodeURIComponent(encrypted.ciphertext.toString());
            } catch (e) {
                return null;
            }
        };

        ipcMain.handle("verificationURL", (event, arg) => {
            let opggSummoner = nodeStorage.getItem("opgg-summoner") ?? null;
            if (!opggSummoner) return null;
            opggSummoner = JSON.parse(opggSummoner);

            const timestamp = encrypt(opggSummoner?.summoner_id, opggSummoner?.puuid);

            // https://www.lol-nextjs-stage-u2swjya6q.op.gg/
            // https://www.op.gg/
            let url = `https://www.op.gg/summoners/${this.config.opggRegion}/${encodeURIComponent(
                String(this.game.summoner.displayName)
            )}/auth/${timestamp}`;

            return url;
        });

        ipcMain.on("openChampionPage", (event, arg) => {
            let mode = (this.game.queueId === 900 || this.game.queueId === 1900) ? "urf" : (this.game.queueId === 450 ? "aram" : "champions");
            if (arg["lane"] === "aram" || arg["lane"] === "urf") {
                shell.openExternal(`https://www.op.gg/modes/${arg["lane"]}/${arg["key"].toLowerCase()}/build`);
            } else {
                shell.openExternal(`https://www.op.gg/champions/${arg["key"].toLowerCase()}/${arg["lane"]}/build?region=${this.config.opggRegion}`);
            }
        });

        ipcMain.on("reloadIngameData", (event, arg) => {
            this.getIngameData(this.game.summoner.displayName);
        });

        ipcMain.handle("lol-renewal", async (event, arg) => {
            return await this.renewal(arg);
        });

        ipcMain.handle("mypage", async (event, arg) => {
            return await this.getMyPage(arg);
        });

        ipcMain.handle("champion-recommendation", async (event, arg) => {
            return await this.championRecommendation(arg);
        })

        ipcMain.on("overlay-setting-changed", (event, arg) => {
            this.broadcastIPC("overlay-setting-changed", arg);
        });

        ipcMain.on("lol-champion-refresh", async (event, arg) => {
            let championSelect = await this.callAPI("GET", "lol", lolConstants.LOL_CHAMPSELECT_SESSION).catch((_) => {return null;});
            if (championSelect) {
                let data = championSelect.data;
                let localPlayerCellId = data.localPlayerCellId;
                let me = _.find(data.myTeam, {cellId: localPlayerCellId});
                let myPick =  _.find(data.actions.flat(), {
                    type: "pick",
                    actorCellId: localPlayerCellId
                });

                if (me) {
                    if (me.championId !== 0) {
                        this.game.championId = me.championId;
                    } else if (me.championPickIntent !== 0) {
                        this.game.championId = me.championPickIntent;
                    } else if (myPick.championId !== 0) {
                        this.game.championId = myPick.championId;
                    }
                }

                let selectedRegion = await this.app.window.getLocalStorage("selected-region") ?? "kr";
                let tierFilter = await this.app.window.getLocalStorage("tier-filter") ?? "platinum_plus";
                let versionFilter = await this.app.window.getLocalStorage("version-filter") ?? "";
                this.getChampionData("", this.game.championId, this.game.queueId, true, selectedRegion, tierFilter, -1, versionFilter);
            }
        });

        ipcMain.handle("ingame-lcu", async () => {
            let liveClientData = await this.callAPI("GET", "liveclientdata", "/allgamedata").catch((_) => {return null;});
            let gameFlow = await this.callAPI("GET", "lol", lolConstants.LOL_GAMEFLOW_SESSION).catch((_) => {return null;});
            let summoners = [];
            let tmpSummoners = [];
            if (!liveClientData || !gameFlow) return {gameFlow: null, summoners: null};

            gameFlow.data.gameData.playerChampionSelections2 = [];
            liveClientData.data.allPlayers.forEach((player) => {
                summoners.push(player.summonerName);
                let championId = keyToId(player.rawChampionName.split("game_character_displayname_")[1]);
                let spell1Id = spellKeyToId[player.summonerSpells.summonerSpellOne.rawDisplayName.split("GeneratedTip_SummonerSpell_")[1].split("_DisplayName")[0]];
                let spell2Id = spellKeyToId[player.summonerSpells.summonerSpellTwo.rawDisplayName.split("GeneratedTip_SummonerSpell_")[1].split("_DisplayName")[0]];

                gameFlow.data.gameData.playerChampionSelections2.push({
                    championId: championId,
                    selectedSkinIndex: 0,
                    spell1Id: spell1Id,
                    spell2Id: spell2Id,
                    summonerInternalName: player.summonerName
                });
            });

            let summonersResult = await this.callAPI("GET", "lol-api-summoner", `/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/summoners?name=${encodeURI(summoners.join(","))}`);
            if (summonersResult.status === 200) {
                if (summonersResult.data) {
                    let summonerIds = [];
                    summonersResult.data.data.map((summoner) => {
                        summonerIds.push(summoner.summoner_id);
                    });

                    if (summonerIds.length > 0) {
                        for (let i = 0; i < summonerIds.length; i++) {
                            let tmp = await this.callAPI("GET", "lol-api-summoner", `/api/${lolConstants.RIOT_REGION_MAP[this.config.region.region]}/summoners/${summonerIds[i]}/summary`)
                                .catch(() => {
                                    return null;
                                });
                            if (tmp) {
                                tmpSummoners.push(tmp.data.data);
                            }
                        }
                    }
                }
            }

            return {
                gameFlow: gameFlow.data,
                summoners: tmpSummoners
            }
        });

        ipcMain.on("tft-team-comps-selected-row", (event, data) => {
            if (this.app.overlayWindow !== null) {
                this.app.overlayWindow.sendToRenderer("tft-team-comps-selected-row", data);
            }
        });

        ipcMain.on("set-percentage", (event, data) => {
            if (data) {
                ipcMain.emit("ad-detach", "off", "off");
            } else {
                ipcMain.emit("ad-detach", "on", "on");
            }
        });

        ipcMain.on("setRuneFromDeeplink", async (event, data) => {
            if (this.isGameRunning) {
                let i18nLocale = await this.app.window.getLocalStorage("i18n");
                this.checkPerkPage({
                    "autoModifiedSelections": [
                        0
                    ],
                    "current": true,
                    "id": 0,
                    "isActive": true,
                    "isDeletable": true,
                    "isEditable": true,
                    "isValid": true,
                    "lastModified": 0,
                    "name": `OP.GG ${this.app.i18n[i18nLocale].translation["imported-rune"]}`,
                    "order": 0,
                    "primaryStyleId": data?.primaryStyleId,
                    "selectedPerkIds": data?.selectedPerkIds,
                    "subStyleId": data?.subStyleId
                });
            }
        });

        ipcMain.on("remove-item-set", (event, data) => {
            this.removeItemSet(true);
        });

        ipcMain.handle("rso-profile", async (event, data) => {
            if (!this.config.region) return null;

            let region = lolConstants.RIOT_REGION_MAP[this.config.region.region];
            let opgg = await this.callAPI("GET", "lol-api-summoner", `/api/${region}/summoners?name=${encodeURI(this.game.summoner.displayName)}`).catch(() => null);
            if (!opgg) return null;
            let summonerId = opgg.data.data[0].summoner_id;
            this.game.opggSummonerId = opgg.data.data[0].summoner_id;

            let rso = await this.callAPI("GET", "lol-api-summoner", `/api/${region}/summoners/${summonerId}/profile`, null, {}, true).catch(() => null);
            if (!rso) return null;

            return rso.data;
        });

        ipcMain.handle("rso-accounts", async (event, data) => {
            let riotProfiles = await this.callAPI("GET", "lol-api-summoner", `/api/member/summoners`, null, {}, true).catch(() => null);
            if (!riotProfiles) return null;
            let value = 0; // Not Linked

            riotProfiles = riotProfiles.data?.data;
            let isLinked = !!_.find(riotProfiles, {
                summoner_id: this.game.opggSummonerId
            });

            if (riotProfiles?.length === 0) {
            } else if (riotProfiles?.length >= 1 && isLinked) {
                value = 1;
            } else if (riotProfiles?.length >= 1) {
                value = 2;
            }

            return value;
        });

        ipcMain.handle("rso-profile-put", async (event, data) => {
            if (!this.config.region) return null;

            let region = lolConstants.RIOT_REGION_MAP[this.config.region.region];
            let opgg = await this.callAPI("GET", "lol-api-summoner", `/api/${region}/summoners?name=${encodeURI(this.game.summoner.displayName)}`).catch(() => null);
            if (!opgg) return null;
            let summonerId = opgg.data.data[0].summoner_id;
            let put = null;

            let isSuccess = false;

            if (data.type === "cover") {
                // {
                //     "cover_champion_id": 11,
                //     "cover_champion_skin_id": 22
                // }
                let put = await this.callAPI("PUT", "lol-api-summoner", `/api/${region}/summoners/${summonerId}/cover-images`, data.data, {}, true).catch(() => null);
                if (!put) return null;
                isSuccess = true;
            } else if (data.type === "word") {
                // {
                //     "content": "3333"
                // }
                let put = await this.callAPI("PUT", "lol-api-summoner", `/api/${region}/summoners/${summonerId}/word`, data.data, {}, true).catch(error => error.response);
                if (put.status !== 200) return put.status;
                isSuccess = true;
            } else if (data.type === "esports") {
                // {
                //     "team_id": 662
                // }
                let put = await this.callAPI("PUT", "lol-api-summoner", `/api/${region}/summoners/${summonerId}/favorite-esport-team`, data.data, {}, true).catch(() => null);
                if (!put) return null;
                isSuccess = true;
            } else if (data.type === "memo") {
                // {
                //     "content": "정글 차이"
                // }
                let put = await this.callAPI("PUT", "lol-api-summoner", `/api/${region}/summoners/${summonerId}/games/${data.gameId}/memos`, data.data, {}, true).catch(() => null);
                if (!put) return null;
                isSuccess = true;
            }

            if (isSuccess) {
                this.broadcastIPC("set-rso-profile", false);
                return put?.data;
            }
        });

        ipcMain.handle("rso-profile-delete", async (event, data) => {
            if (!this.config.region) return null;

            let region = lolConstants.RIOT_REGION_MAP[this.config.region.region];
            let opgg = await this.callAPI("GET", "lol-api-summoner", `/api/${region}/summoners?name=${encodeURI(this.game.summoner.displayName)}`).catch(() => null);
            if (!opgg) return null;
            let summonerId = opgg.data.data[0].summoner_id;
            let put = null;

            let isSuccess = false;

            if (data.type === "cover") {
                let put = await this.callAPI("DELETE", "lol-api-summoner", `/api/${region}/summoners/${summonerId}/cover-images`, null, {}, true).catch(() => null);
                if (!put) return null;
                isSuccess = true;
            } else if (data.type === "word") {
                let put = await this.callAPI("DELETE", "lol-api-summoner", `/api/${region}/summoners/${summonerId}/word`, null, {}, true).catch(() => null);
                if (!put) return null;
                isSuccess = true;
            } else if (data.type === "esports") {
                let put = await this.callAPI("DELETE", "lol-api-summoner", `/api/${region}/summoners/${summonerId}/favorite-esport-team`, null, {}, true).catch(() => null);
                if (!put) return null;
                isSuccess = true;
            } else if (data.type === "memo") {
                let put = await this.callAPI("DELETE", "lol-api-summoner", `/api/${region}/summoners/${summonerId}/games/${data.gameId}/memos`, null, {}, true).catch(() => null);
                if (!put) return null;
                isSuccess = true;
            }

            if (isSuccess) {
                this.broadcastIPC("set-rso-profile", false);
                return put?.data;
            }
        });

        ipcMain.handle("get-region-league", (event, data) => {
            if (!this.config.region) return null;
            return lolConstants.LEAGUE_REGION_MAP[this.config.region.region] ?? null;
        });
    }
}

module.exports = LoL;