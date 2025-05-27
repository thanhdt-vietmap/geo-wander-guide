
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isSidebarOpen: boolean;
  isPlaceDetailCollapsed: boolean;
  showDirections: boolean;
}

const initialState: UIState = {
  isSidebarOpen: false,
  isPlaceDetailCollapsed: false,
  showDirections: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setPlaceDetailCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isPlaceDetailCollapsed = action.payload;
    },
    setShowDirections: (state, action: PayloadAction<boolean>) => {
      state.showDirections = action.payload;
    },
  },
});

export const { setSidebarOpen, toggleSidebar, setPlaceDetailCollapsed, setShowDirections } = uiSlice.actions;
export default uiSlice.reducer;
