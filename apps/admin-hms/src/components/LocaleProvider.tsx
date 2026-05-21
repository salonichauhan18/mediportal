import { createContext, useContext, type ReactNode } from 'react';
import { format } from 'date-fns';
import { enUS, hi, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface LocaleContextType {
  formatDate: (date: Date | string, formatStr?: string) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  regionalSettings: {
    currency: string;
    taxName: string;
    taxRate: number;
  };
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children, branchSettings }: { children: ReactNode, branchSettings?: any }) {
  const { i18n } = useTranslation();

  // Fallback settings if branch settings are missing
  const settings = branchSettings || {
    currency: 'INR',
    taxName: 'GST',
    taxRate: 18,
    timezone: 'Asia/Kolkata'
  };

  const getFnsLocale = () => {
    switch (i18n.language) {
      case 'hi': return hi;
      case 'es': return es;
      default: return enUS;
    }
  };

  const formatDate = (date: Date | string, formatStr: string = 'PP') => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, formatStr, { locale: getFnsLocale() });
  };

  const formatCurrency = (amount: number, currency: string = settings.currency) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <LocaleContext.Provider value={{ formatDate, formatCurrency, regionalSettings: settings }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
};
