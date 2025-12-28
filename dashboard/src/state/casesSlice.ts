// src/state/casesSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type RiskCategory = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface CaseSummary {
  caseId: string;
  patientId: string;
  displayName: string; // e.g. "F • 68" or similar
  riskCategory: RiskCategory;
  strokeProbability: number; // 0–1
  lvoProbability: number; // 0–1
  minutesSinceOnset: number | null;
  isActive: boolean;
}

export interface CasesState {
  items: CaseSummary[];
  selectedCaseId: string | null;
  isLoading: boolean;
}

const initialState: CasesState = {
  items: [],
  selectedCaseId: null,
  isLoading: false,
};

const casesSlice = createSlice({
  name: "cases",
  initialState,
  reducers: {
    setCases(state, action: PayloadAction<CaseSummary[]>) {
      state.items = action.payload;
      if (!state.selectedCaseId && action.payload.length > 0) {
        state.selectedCaseId = action.payload[0].caseId;
      }
    },
    selectCase(state, action: PayloadAction<string>) {
      state.selectedCaseId = action.payload;
    },
    setCasesLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    upsertCase(state, action: PayloadAction<CaseSummary>) {
      const incoming = action.payload;
      const index = state.items.findIndex((c) => c.caseId === incoming.caseId);
      if (index >= 0) {
        state.items[index] = incoming;
      } else {
        state.items.unshift(incoming);
      }
      if (!state.selectedCaseId) {
        state.selectedCaseId = incoming.caseId;
      }
    },
    clearCases(state) {
      state.items = [];
      state.selectedCaseId = null;
    },
  },
});

export const { setCases, selectCase, setCasesLoading, upsertCase, clearCases } =
  casesSlice.actions;

export default casesSlice.reducer;
