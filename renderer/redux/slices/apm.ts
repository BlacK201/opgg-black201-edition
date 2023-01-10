import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { apmDataType } from "./apm.d"

const initialState: apmDataType = {
    apm: 0,
    lastAPM: Number(localStorage.getItem("lastAPM")) || 0,
    apmChampion: localStorage.getItem("lastChampion") || "",
    apmChampionId: localStorage.getItem("lastChampionId") || ""

}

const issuesDisplaySlice = createSlice({
    name: 'common',
    initialState,
    reducers: {
        setAPM(state, action: PayloadAction<number>) {
            state.apm = action.payload;
        },
        setLastAPM(state, action: PayloadAction<number>) {
            state.lastAPM = action.payload;
        },
        setApmChampion(state, action: PayloadAction<string>) {
            state.apmChampion = action.payload;
        },
        setApmChampionId(state, action: PayloadAction<string>) {
            state.apmChampionId = action.payload;
        },
    }
})

export const {
    setAPM,
    setLastAPM,
    setApmChampion,
    setApmChampionId
} = issuesDisplaySlice.actions

export default issuesDisplaySlice.reducer
