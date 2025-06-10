import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setLanguage } from '../store/slices/uiSlice';

/**
 * Hook for handling keyboard shortcuts related to language switching
 */
export const useLanguageShortcuts = () => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector((state) => state.ui.language);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+L to toggle language
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        const newLanguage = currentLanguage === 'vi' ? 'en' : 'vi';
        dispatch(setLanguage(newLanguage));
        i18n.changeLanguage(newLanguage);
      }
      
      // Ctrl+Shift+V for Vietnamese
      if (event.ctrlKey && event.shiftKey && event.key === 'V') {
        event.preventDefault();
        if (currentLanguage !== 'vi') {
          dispatch(setLanguage('vi'));
          i18n.changeLanguage('vi');
        }
      }
      
      // Ctrl+Shift+E for English
      if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        if (currentLanguage !== 'en') {
          dispatch(setLanguage('en'));
          i18n.changeLanguage('en');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentLanguage, dispatch, i18n]);
};
