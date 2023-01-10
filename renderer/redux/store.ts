import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import logger from "redux-logger";
import reducer, { RootState } from "./reducer";

// useSelector hook 대신 사용
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector

const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) => {
        if(process.env.NODE_ENV !== "production") {
            return getDefaultMiddleware().concat(logger);
        }
        return getDefaultMiddleware();
    },
    devTools: process.env.NODE_ENV !== "production"
})

if (process.env.NODE_ENV === 'development' && module.hot) {
    module.hot.accept('./reducer', () => {
        const newRootReducer = require('./reducer').default
        store.replaceReducer(newRootReducer)
    })
}

export default store;
