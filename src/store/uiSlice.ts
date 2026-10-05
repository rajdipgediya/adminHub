import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type DashboardTab = "Overview" | "Analytics" | "Reports" | "Settings";
export type RevenueRange = "7D" | "1M" | "3M" | "6M" | "1Y";

interface UiState {
  mobileNavOpen: boolean;
  dashboardTab: DashboardTab;
  revenueRange: RevenueRange;
  settings: {
    emailAlerts: boolean;
    weeklyDigest: boolean;
    compactTables: boolean;
  };
}

const initialState: UiState = {
  mobileNavOpen: false,
  dashboardTab: "Overview",
  revenueRange: "6M",
  settings: { emailAlerts: true, weeklyDigest: false, compactTables: false },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
    setDashboardTab(state, action: PayloadAction<DashboardTab>) {
      state.dashboardTab = action.payload;
    },
    setRevenueRange(state, action: PayloadAction<RevenueRange>) {
      state.revenueRange = action.payload;
    },
    toggleSetting(state, action: PayloadAction<keyof UiState["settings"]>) {
      state.settings[action.payload] = !state.settings[action.payload];
    },
  },
});

export const { setMobileNavOpen, setDashboardTab, setRevenueRange, toggleSetting } =
  uiSlice.actions;
export default uiSlice.reducer;
