import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setLanguage } from '../store/slices/uiSlice';

/**
 * Hook to synchronize language between Redux store and i18next
 */
export const useLanguageSync = () => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector((state) => state.ui.language);

  useEffect(() => {
    // Initialize i18n language from Redux store
    if (currentLanguage && i18n.language !== currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  useEffect(() => {
    // Sync Redux store when i18n language changes (e.g., from browser detection)
    const handleLanguageChange = (lng: string) => {
      if ((lng === 'vi' || lng === 'en') && lng !== currentLanguage) {
        dispatch(setLanguage(lng));
      }
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [dispatch, currentLanguage, i18n]);
};