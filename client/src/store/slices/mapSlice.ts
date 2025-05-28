
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MapLayerType } from '@/components/MapLayerSelector';
import type { MapViewRef } from '@/components/MapView';

interface MapState {
  currentLayer: MapLayerType;
  mapRef: MapViewRef | null;
  contextMenu: {
    isOpen: boolean;
    x: number;
    y: number;
    lng: number;
    lat: number;
  } | null;
}

const initialState: MapState = {
  currentLayer: 'vector',
  mapRef: null,
  contextMenu: null,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setCurrentLayer: (state, action: PayloadAction<MapLayerType>) => {
      state.currentLayer = action.payload;
    },
    setMapRef: (state, action: PayloadAction<MapViewRef | null>) => {
      state.mapRef = action.payload;
    },
    setContextMenu: (state, action: PayloadAction<MapState['contextMenu']>) => {
      state.contextMenu = action.payload;
    },
    closeContextMenu: (state) => {
      if (state.contextMenu) {
        state.contextMenu.isOpen = false;
      }
    },
  },
});

export const { setCurrentLayer, setMapRef, setContextMenu, closeContextMenu } = mapSlice.actions;
export default mapSlice.reducer;
