
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlaceDetails } from '@/types';

interface LocationState {
  selectedPlace: PlaceDetails | null;
  locationInfo: PlaceDetails | null;
  startingPlace: PlaceDetails | null;
}

const initialState: LocationState = {
  selectedPlace: null,
  locationInfo: null,
  startingPlace: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setSelectedPlace: (state, action: PayloadAction<PlaceDetails | null>) => {
      state.selectedPlace = action.payload;
    },
    setLocationInfo: (state, action: PayloadAction<PlaceDetails | null>) => {
      state.locationInfo = action.payload;
    },
    setStartingPlace: (state, action: PayloadAction<PlaceDetails | null>) => {
      state.startingPlace = action.payload;
    },
    clearAllLocations: (state) => {
      state.selectedPlace = null;
      state.locationInfo = null;
      state.startingPlace = null;
    },
  },
});

export const { setSelectedPlace, setLocationInfo, setStartingPlace, clearAllLocations } = locationSlice.actions;
export default locationSlice.reducer;
