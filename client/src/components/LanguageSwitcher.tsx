import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setLanguage } from '../store/slices/uiSlice';
import VietnameseFlag from './icons/VietnameseFlag';
import AmericanFlag from './icons/AmericanFlag';

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector((state) => state.ui.language);

  const handleLanguageChange = (language: 'vi' | 'en') => {
    dispatch(setLanguage(language));
    i18n.changeLanguage(language);
  };

  return (
    <div className="relative flex items-center bg-white rounded-3xl shadow-md border border-gray-200 p-1">
      {/* Background slider */}
      <div
        className={`absolute top-1 bottom-1 bg-[#344054] rounded-[32px] transition-all duration-300 ease-in-out shadow-sm`}
        style={{
          width: '52px',
          left: currentLanguage === 'vi' ? '4px' : '56px'
        }}
      />
      
      {/* Language buttons */}
      <div className="relative flex">
        <button
          onClick={() => handleLanguageChange('vi')}
          className={`relative flex items-center justify-center gap-1 px-2 py-1.5 text-sm transition-all duration-300 z-10 rounded-[32px]`}
          style={{
            fontFamily: 'Nunito Sans',
            fontWeight: currentLanguage === 'vi' ? 500 : 400,
            fontSize: '14px',
            lineHeight: '18px',
            color: currentLanguage === 'vi' ? '#FFFFFF' : '#616368',
            width: '52px'
          }}
        >
          <VietnameseFlag className="text-xs" />
          <span>VI</span>
        </button>
        <button
          onClick={() => handleLanguageChange('en')}
          className={`relative flex items-center justify-center gap-1 px-2 py-1.5 text-sm transition-all duration-300 z-10 rounded-[32px]`}
          style={{
            fontFamily: 'Nunito Sans',
            fontWeight: currentLanguage === 'en' ? 500 : 400,
            fontSize: '14px', 
            lineHeight: '18px',
            color: currentLanguage === 'en' ? '#FFFFFF' : '#616368',
            width: '52px'
          }}
        >
          <AmericanFlag className="text-xs" />
          <span>EN</span>
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
