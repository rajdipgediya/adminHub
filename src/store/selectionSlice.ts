import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserRole, UserStatus } from "@/types";

interface SelectionState {
  selectedUserIds: number[];
  /** Local overrides applied by bulk actions (DummyJSON writes are not persisted). */
  userOverrides: Record<number, { role?: UserRole; status?: UserStatus }>;
}

const initialState: SelectionState = { selectedUserIds: [], userOverrides: {} };

const selectionSlice = createSlice({
  name: "selection",
  initialState,
  reducers: {
    toggleUser(state, action: PayloadAction<number>) {
      const id = action.payload;
      state.selectedUserIds = state.selectedUserIds.includes(id)
        ? state.selectedUserIds.filter((x) => x !== id)
        : [...state.selectedUserIds, id];
    },
    setUsersSelected(state, action: PayloadAction<{ ids: number[]; selected: boolean }>) {
      const { ids, selected } = action.payload;
      const set = new Set(state.selectedUserIds);
      ids.forEach((id) => (selected ? set.add(id) : set.delete(id)));
      state.selectedUserIds = [...set];
    },
    clearSelection(state) {
      state.selectedUserIds = [];
    },
    applyUserOverride(
      state,
      action: PayloadAction<{ ids: number[]; patch: { role?: UserRole; status?: UserStatus } }>,
    ) {
      for (const id of action.payload.ids) {
        state.userOverrides[id] = { ...state.userOverrides[id], ...action.payload.patch };
      }
    },
  },
});

export const { toggleUser, setUsersSelected, clearSelection, applyUserOverride } =
  selectionSlice.actions;
export default selectionSlice.reducer;
