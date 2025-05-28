
import { configureStore } from '@reduxjs/toolkit';
import mapReducer from './slices/mapSlice';
import uiReducer from './slices/uiSlice';
import locationReducer from './slices/locationSlice';

export const store = configureStore({
  reducer: {
    map: mapReducer,
    ui: uiReducer,
    location: locationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['map/setMapRef'],
        ignoredPaths: ['map.mapRef'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
