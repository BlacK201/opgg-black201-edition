module.exports = Object.freeze({
    LOL_CHAMPION_INFO: "/lol-champions/v1/inventories/{0}/champions/{1}",
    LOL_CHAMPSELECT_MY_SELECTION: "/lol-champ-select/v1/session/my-selection",
    LOL_CHAMPSELECT_SESSION: "/lol-champ-select/v1/session",
    LOL_CHAT_CONFIG: "/lol-chat/v1/config",
    LOL_CURRENT_SUMMONER: "/lol-summoner/v1/current-summoner",
    LOL_EOG_STATS_BLOCK: "/lol-end-of-game/v1/eog-stats-block",
    LOL_FRIEND_REQUEST: "/lol-chat/v1/friend-requests",
    LOL_GAMEFLOW_META_PLAYER_STATUS: "/lol-gameflow/v1/gameflow-metadata/player-status",
    LOL_GAMEFLOW_SESSION: "/lol-gameflow/v1/session",
    LOL_GET_SUMMONER: "/lol-summoner/v1/summoners",
    LOL_ITEM_SETS: "/lol-item-sets/v1/item-sets/{0}/sets",
    LOL_LOBBY_INVITATION: "/lol-lobby/v2/lobby/invitations",
    LOL_PERK_PAGE: "/lol-perks/v1/pages/{0}",
    LOL_PERK_PAGES: "/lol-perks/v1/pages",
    LOL_RANKED_STATS: "/lol-ranked/v1/ranked-stats",
    LOL_REGION_LOCALE: "/riotclient/region-locale",
    LOL_CAREER_STATS_SUMMONER_GAMES: "/lol-career-stats/v1/summoner-games/{0}",
    LOL_PRESHUTDOWN_BEGIN: "/riotclient/pre-shutdown/begin",
    LOL_INSTALL_DIR: "/data-store/v1/install-dir",
    LOL_GAME_SETTINGS: "/lol-game-settings/v1/game-settings",

    OPGG_DESKTOP_APP_S3: "https://opgg-desktop-data.akamaized.net",
    OPGG_980TI_S3: "https://test980ti.s3.ap-northeast-2.amazonaws.com",

    DEFAULT_LEAGUE_DIRECTORY: "C:\\Riot Games\\League of Legends",

    TRANSFORM_CHAMPION_IDS: [
        76,     // 니달리
        126,    // 제이스
        350,    // 유미
        43,     // 카르마
        60      // 엘리스
    ],
    TFT_QUEUE_IDS: [
        1090, // 노말
        1100, // 랭겜
        1110, // ???
        1120, // 노말 초고속
        1130, // 랭겜 초고속
        1140, // 일반 더블 업
        1150, // 더블업 베타
        1160  // 더블업 랭크
    ],
    BOT_QUEUE_IDS: [
        830,
        840,
        850
    ],
    RIFT_QUEUE_IDS: [
        // 400,         // 노말 - 드래프트
        420,            // 솔랭
        // 430,         // 노말 - 블라인드
        440,            // 자랭,
        -1              // 커스텀 - 테스트
    ],
    GARENAS: ["SG", "ID", "PH", "TW", "VN", "TH"],

    OPGG_RIOT_REGION_MAP: {
        "KR": "www",
        "JP": "jp",
        "NA": "na",
        "EUW": "euw",
        "EUNE": "eune",
        "OCE": "oce",
        "BR": "br",
        "LAS": "las",
        "LAN": "lan",
        "RU": "ru",
        "TR": "tr",
        "SG": "sg", // Garena
        "ID": "id", // Garena
        "PH": "ph", // Garena
        "TW": "tw", // Garena
        "VN": "vn", // Garena
        "TH": "th", // Garena
        "LA1": "lan",
        "LA2": "las",
        "OC1": "oce"
    },
    RIOT_REGION_MAP: {
        "KR": "KR",
        "NA": "NA",
        "EUW": "EUW",
        "BR": "BR",
        "LA1": "LAN",
        "LA2": "LAS",
        "EUNE": "EUNE",
        "JP": "JP",
        "OC1": "OCE",
        "TR": "TR",
        "RU": "RU",

        "TENCENT": "KR",

        "PBE": "KR",

        // GARENA
        "TW": "KR",
        "VN": "KR",
        "SG": "KR",
        "PH": "KR",
        "TH": "KR",
        "ID": "KR"
    },
    LOCALE_MAP: {
        "de": "de_DE",
        "kr": "ko_KR",
        "en": "en_US",
        "es": "es_ES",
        "fr": "fr_FR",
        "ja": "ja_JP",
        "pl": "pl_PL",
        "pt": "pt_BR",
        "ru": "ru_RU",
        "sc": "zh_CN",
        "tc": "zh_TW",
        "tr": "tr_TR"
    },
    SERVICE_AVAILABLE: {
        "KR": true,
        "NA": true,
        "EUW": true,
        "BR": true,
        "LA1": true,
        "LA2": true,
        "EUNE": true,
        "JP": true,
        "OC1": true,
        "TR": true,
        "RU": true,

        "TENCENT": false,

        "PBE": false,

        // GARENA
        "TW": false,
        "VN": false,
        "SG": false,
        "PH": false,
        "TH": false,
        "ID": false,
    }
});