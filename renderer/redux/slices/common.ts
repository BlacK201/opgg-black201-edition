import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {appModeType, championDataType, combosDataType, patchnotesDataType, commonState, ingameDataType, multisearchDataType, tipChampionDataType } from "./common.d"
import {getSettingInLocalStorage} from "../../lib";
import {isNMP} from "../../utils/nmp";

const initialState: commonState = {
    // clientStatus: "OFFLINE",
    summonerName: "",
    thumbnailUrl: require("../../../assets/images/icon-mypage.svg"),
    multisearch: [],
    champion: null,
    championOverview: null,
    ingame: null,
    eog: null,
    combos: null,
    patchnotes: null,
    isAdminWarning: false,
    isAPMSetting: getSettingInLocalStorage("apm"),
    appMode: (localStorage.getItem("app_mode") || "login") as appModeType,
    tipChampions: [null, null, null, null, null],
    rankedChampion: null,
    aramChampion: null,
    urfChampion: null,
    currentChampion: null,
    currentLane: null,
    scale: null,
    feedbackIsOpen: false,
    isErrorOpen: false,
    playwireAdsIsOpen: false,
    opscoreFeedbackIsOpen: false,
    opscoreFeedbackSent: false,
    spellSettingIsOpen: false,
    overlaySettingIsOpen: false,
    perkTabIndex: 1,
    perkPage: 1,
    isGarena: false,
    opscore: null,
    mypage: null,
    championStatistics: null,
    isSettingOpen: false,
    clientLogin: null,
    isLoLGameLive: false,
    lolCurrentGameQueue: -9999,
    isAutoRune: getSettingInLocalStorage("autorune"),
    isAutoSpell: isNMP ? localStorage.getItem("isSpell") === "true" : getSettingInLocalStorage("isSpell"),
    isAutoAccept: getSettingInLocalStorage("autoaccept"),
    region: localStorage.getItem("region") ?? "KR",
    hasError: false,
    april: !(localStorage.getItem("april") === "false")
}

const issuesDisplaySlice = createSlice({
    name: 'common',
    initialState,
    reducers: {
        // setClientStatus(state, action: PayloadAction<string>) {
        //     state.clientStatus = action.payload.toUpperCase();
        // },
        setSummonerInfo(state, action: PayloadAction<{displayName: string|null, profileIconId: number|null}>) {
            const { displayName, profileIconId } = action.payload
            state.summonerName = displayName
            state.thumbnailUrl = `https://opgg-static.akamaized.net/images/profile_icons/profileIcon${profileIconId}.jpg?image=q_auto&v=1518361200`
        },
        setMultisearch(state, action: PayloadAction<multisearchDataType[]>) {
            state.multisearch = action.payload
        },
        setChampion(state, action: PayloadAction<championDataType>) {
            state.champion = action.payload
        },
        setChampionOverview(state, action) {
          state.championOverview = action.payload
        },
        setIngame(state, action: PayloadAction<ingameDataType>) {
            state.ingame = action.payload
        },
        setEOG(state, action: PayloadAction<any>) {
            state.eog = action.payload
        },
        setCombos(state, action: PayloadAction<combosDataType>) {
            state.combos = action.payload
        },
        setPatchnotes(state, action: PayloadAction<patchnotesDataType>) {
            state.patchnotes = action.payload
        },
        setIsAdminWarning(state, action: PayloadAction<boolean>) {
            state.isAdminWarning = action.payload
        },
        setAPMSetting(state, action: PayloadAction<boolean>) {
            state.isAPMSetting = action.payload
        },
        setAppMode(state, action: PayloadAction<appModeType>) {
            state.appMode = action.payload;
        },
        setTipChampion(state, action: PayloadAction<tipChampionDataType[]>) {
            state.tipChampions = [null, null, null, null, null].map((item, i) => {
                if(action.payload[i]) {
                    return action.payload[i]
                }else {
                    return null;
                }
            });
        },
        setStatisticsChampion(state, action) {
            const { type, data } = action.payload;
            if (type === 0) // ranked
                state.rankedChampion = data;
            else if (type === 1) // aram
                state.aramChampion = data;
            else if (type === 2) // urf
                state.urfChampion = data;
        },
        setCurrentChampion(state, action) {
            state.currentChampion = action.payload
        },
        setCurrentLane(state, action) {
            state.currentLane = action.payload
        },
        setScale(state, action) {
            state.scale = action.payload
        },
        setFeedbackIsOpen(state, action) {
            state.feedbackIsOpen = action.payload
        },
        setIsErrorOpen(state, action) {
            state.isErrorOpen = action.payload
        },
        setPlaywireAdsIsOpen(state, action) {
            state.playwireAdsIsOpen = action.payload
        },
        setOpscoreFeedbackIsOpen(state, action) {
            state.opscoreFeedbackIsOpen = action.payload
        },
        setOpscoreFeedbackSent(state, action) {
            state.opscoreFeedbackSent = action.payload
        },
        setSpellSettingIsOpen(state, action) {
            state.spellSettingIsOpen = action.payload
        },
        setOverlaySettingIsOpen(state, action) {
            state.overlaySettingIsOpen = action.payload
        },
        setPerkTabIndex(state, action) {
            state.perkTabIndex = action.payload
        },
        setPerkPage(state, action) {
            state.perkPage = action.payload
        },
        setIsGarena(state, action) {
            state.isGarena = action.payload
        },
        setOpScore(state, action) {
            state.opscore = action.payload
        },
        setMypage(state, action) {
            state.mypage = action.payload
        },
        setChampionStatistics(state, action) {
            state.championStatistics = action.payload
        },
        setIsSettingOpen(state, action) {
            state.isSettingOpen = action.payload
        },
        setClientLogin(state, action) {
            state.clientLogin = action.payload
        },
        setIsLoLGameLive(state, action) {
            state.isLoLGameLive = action.payload
        },
        setLoLCurrentGameQueue(state, action) {
            state.lolCurrentGameQueue = action.payload
        },
        setIsAutoRune(state, action) {
            state.isAutoRune = action.payload
        },
        setIsAutoSpell(state, action) {
            state.isAutoSpell = action.payload
        },
        setIsAutoAccept(state, action) {
            state.isAutoAccept = action.payload
        },
        setRegion(state, action) {
            state.region = action.payload
        },
        setHasError(state, action) {
            state.hasError = action.payload
        },
        setApril(state, action) {
            state.april = action.payload
        }
    }
})

export const {
    // setClientStatus,
    setSummonerInfo,
    setMultisearch,
    setChampion,
    setChampionOverview,
    setIngame,
    setEOG,
    setCombos,
    setPatchnotes,
    setIsAdminWarning,
    setAPMSetting,
    setAppMode,
    setTipChampion,
    setStatisticsChampion,
    setCurrentChampion,
    setCurrentLane,
    setScale,
    setFeedbackIsOpen,
    setIsErrorOpen,
    setPlaywireAdsIsOpen,
    setOpscoreFeedbackIsOpen,
    setOpscoreFeedbackSent,
    setSpellSettingIsOpen,
    setOverlaySettingIsOpen,
    setPerkTabIndex,
    setPerkPage,
    setIsGarena,
    setOpScore,
    setMypage,
    setChampionStatistics,
    setIsSettingOpen,
    setClientLogin,
    setIsLoLGameLive,
    setLoLCurrentGameQueue,
    setIsAutoRune,
    setIsAutoSpell,
    setIsAutoAccept,
    setRegion,
    setHasError,
    setApril
} = issuesDisplaySlice.actions

export default issuesDisplaySlice.reducer
