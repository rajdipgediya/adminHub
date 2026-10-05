import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BookingStatus, TransactionType, UserRole, UserStatus } from "@/types";

export type DateRange = "all" | "7d" | "30d" | "90d";
export type UserSort = "joined" | "name" | "lastActive";
export type AmountRange = "all" | "lt100" | "100to1000" | "gt1000";

export interface FiltersState {
  users: {
    search: string;
    role: UserRole | "All";
    status: UserStatus | "All";
    sort: UserSort;
    page: number;
  };
  transactions: {
    search: string;
    dateRange: DateRange;
    type: TransactionType | "All";
    amount: AmountRange;
    page: number;
  };
  bookings: {
    search: string;
    dateRange: DateRange;
    status: BookingStatus | "All";
    service: string;
    page: number;
  };
  dashboardPage: number;
}

const initialState: FiltersState = {
  users: { search: "", role: "All", status: "All", sort: "joined", page: 1 },
  transactions: { search: "", dateRange: "all", type: "All", amount: "all", page: 1 },
  bookings: { search: "", dateRange: "all", status: "All", service: "All", page: 1 },
  dashboardPage: 1,
};

type Section = "users" | "transactions" | "bookings";

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    // Changing any filter sends that section back to page 1.
    setUserFilters(state, action: PayloadAction<Partial<Omit<FiltersState["users"], "page">>>) {
      Object.assign(state.users, action.payload, { page: 1 });
    },
    setTransactionFilters(
      state,
      action: PayloadAction<Partial<Omit<FiltersState["transactions"], "page">>>,
    ) {
      Object.assign(state.transactions, action.payload, { page: 1 });
    },
    setBookingFilters(
      state,
      action: PayloadAction<Partial<Omit<FiltersState["bookings"], "page">>>,
    ) {
      Object.assign(state.bookings, action.payload, { page: 1 });
    },
    setPage(state, action: PayloadAction<{ section: Section; page: number }>) {
      state[action.payload.section].page = action.payload.page;
    },
    resetFilters(state, action: PayloadAction<Section>) {
      Object.assign(state[action.payload], initialState[action.payload]);
    },
    setDashboardPage(state, action: PayloadAction<number>) {
      state.dashboardPage = action.payload;
    },
  },
});

export const {
  setUserFilters,
  setTransactionFilters,
  setBookingFilters,
  setPage,
  resetFilters,
  setDashboardPage,
} = filtersSlice.actions;
export default filtersSlice.reducer;
