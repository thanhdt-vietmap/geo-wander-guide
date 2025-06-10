import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setLanguage } from '../store/slices/uiSlice';
import { Button } from './ui/button';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector((state) => state.ui.language);

  const handleLanguageChange = (language: 'vi' | 'en') => {
    dispatch(setLanguage(language));
    i18n.changeLanguage(language);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-white shadow-sm hover:shadow-md"
              >
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {currentLanguage === 'vi' ? 'VI' : 'EN'}
                </span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => handleLanguageChange('vi')}
              className={`cursor-pointer ${currentLanguage === 'vi' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              <span className="mr-2">🇻🇳</span>
              {t('language.vietnamese')}
              <span className="ml-auto text-xs text-gray-400">Ctrl+Shift+V</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleLanguageChange('en')}
              className={`cursor-pointer ${currentLanguage === 'en' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              <span className="mr-2">🇺🇸</span>
              {t('language.english')}
              <span className="ml-auto text-xs text-gray-400">Ctrl+Shift+E</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>
          <p>{t('language.switch')} (Ctrl+Shift+L)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LanguageSwitcher;
