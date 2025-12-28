// src/state/store.ts
import { configureStore } from "@reduxjs/toolkit";
import casesReducer from "./casesSlice";

export const store = configureStore({
  reducer: {
    cases: casesReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

// Infer types for use with hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
