import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="bg-white p-2 rounded-xl shadow-sm">
        <Globe size={16} className="text-indigo-600" />
      </div>
      <div className="flex gap-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
              i18n.language === lang.code
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
}
