import React from 'react';
import { useLanguageSync } from '../hooks/useLanguageSync';

interface LanguageSyncProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that ensures language synchronization between Redux and i18next
 */
const LanguageSyncProvider: React.FC<LanguageSyncProviderProps> = ({ children }) => {
  useLanguageSync();
  return <>{children}</>;
};

export default LanguageSyncProvider;
