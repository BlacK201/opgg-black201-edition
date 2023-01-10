import { combineReducers } from "@reduxjs/toolkit";

import common from "./slices/common";
import apm from "./slices/apm";

const rootReducer = combineReducers({
    common,
    apm
});

export type RootState = ReturnType<typeof rootReducer>

export default rootReducer
