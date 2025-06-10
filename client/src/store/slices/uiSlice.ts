
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isSidebarOpen: boolean;
  isPlaceDetailCollapsed: boolean;
  isDirectionCollapsed: boolean;
  showDirections: boolean;
  language: 'vi' | 'en';
}

const initialState: UIState = {
  isSidebarOpen: false,
  isPlaceDetailCollapsed: false,
  isDirectionCollapsed: false,
  showDirections: false,
  language: 'vi',
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
    setDirectionCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isDirectionCollapsed = action.payload;
    },
    setShowDirections: (state, action: PayloadAction<boolean>) => {
      state.showDirections = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'vi' | 'en'>) => {
      state.language = action.payload;
    },
  },
});

export const { setSidebarOpen, toggleSidebar, setPlaceDetailCollapsed, setDirectionCollapsed, setShowDirections, setLanguage } = uiSlice.actions;
export default uiSlice.reducer;
