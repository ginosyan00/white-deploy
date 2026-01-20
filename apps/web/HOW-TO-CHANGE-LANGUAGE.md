# Ինչպես փոխել լեզուն

## 🎯 Ամենապարզ ձև

### 1. Օգտագործեք `setStoredLanguage()` ֆունկցիան

```tsx
'use client';

import { setStoredLanguage } from '../lib/language';

export function MyComponent() {
  const changeToArmenian = () => {
    setStoredLanguage('hy'); // Էջը ավտոմատ reload կլինի
  };

  const changeToEnglish = () => {
    setStoredLanguage('en'); // Էջը ավտոմատ reload կլինի
  };

  return (
    <div>
      <button onClick={changeToArmenian}>Հայերեն</button>
      <button onClick={changeToEnglish}>English</button>
    </div>
  );
}
```

## 🎨 Լեզվի փոխարկիչ կոմպոնենտ

### Օգտագործեք `LanguageSwitcher` կոմպոնենտը

```tsx
'use client';

import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function Header() {
  return (
    <header>
      {/* ... այլ բովանդակություն ... */}
      <LanguageSwitcher />
    </header>
  );
}
```

### Կամ օգտագործեք `SimpleLanguageSwitcher`-ը (մինիմալ տարբերակ)

```tsx
'use client';

import { SimpleLanguageSwitcher } from '../components/LanguageSwitcher';

export function Footer() {
  return (
    <footer>
      <SimpleLanguageSwitcher />
    </footer>
  );
}
```

## 📝 Ամբողջական օրինակ

### Custom Language Switcher

```tsx
'use client';

import { useState, useEffect } from 'react';
import { getStoredLanguage, setStoredLanguage, LANGUAGES, type LanguageCode } from '../lib/language';
import { useTranslation } from '../lib/i18n';

export function CustomLanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(getStoredLanguage());
  const { t } = useTranslation();

  useEffect(() => {
    const handleLanguageUpdate = () => {
      setCurrentLang(getStoredLanguage());
    };

    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, []);

  const handleChange = (langCode: LanguageCode) => {
    if (langCode !== currentLang) {
      setStoredLanguage(langCode);
      // setStoredLanguage ավտոմատ reload է անում էջը
    }
  };

  return (
    <select
      value={currentLang}
      onChange={(e) => handleChange(e.target.value as LanguageCode)}
      className="px-3 py-2 border rounded-lg"
    >
      {Object.entries(LANGUAGES).map(([code, lang]) => (
        <option key={code} value={code}>
          {lang.nativeName} ({lang.name})
        </option>
      ))}
    </select>
  );
}
```

## 🔧 Օգտագործում Header-ում

### Header-ում ավելացնել լեզվի փոխարկիչ

```tsx
'use client';

import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function Header() {
  return (
    <header className="flex items-center justify-between">
      {/* Logo */}
      <div>Logo</div>

      {/* Navigation */}
      <nav>...</nav>

      {/* Language & Currency */}
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        {/* Currency switcher */}
      </div>
    </header>
  );
}
```

## 📋 Հասանելի լեզուներ

Ներկայումս աջակցվող լեզուներ:

- **en** - English (Անգլերեն)
- **hy** - Հայերեն (Armenian)
- **ru** - Русский (Russian) - *չունի թարգմանություններ, fallback to en*
- **ka** - ქართული (Georgian) - *չունի թարգմանություններ, fallback to en*

## ⚙️ Ինչպես է աշխատում

1. **`setStoredLanguage(lang)`** - Պահպանում է լեզուն `localStorage`-ում
2. **Dispatch event** - Ուղարկում է `language-updated` event
3. **Page reload** - Էջը ավտոմատ reload է լինում
4. **`useTranslation()` hook** - Ավտոմատ ստանում է նոր լեզուն

## 🎯 Օրինակ - Button-ով

```tsx
'use client';

import { setStoredLanguage, type LanguageCode } from '../lib/language';

export function LanguageButtons() {
  const languages: LanguageCode[] = ['en', 'hy'];

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => setStoredLanguage(lang)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {lang === 'en' ? 'English' : 'Հայերեն'}
        </button>
      ))}
    </div>
  );
}
```

## 🎨 Օրինակ - Dropdown Menu-ով

```tsx
'use client';

import { useState } from 'react';
import { getStoredLanguage, setStoredLanguage, LANGUAGES, type LanguageCode } from '../lib/language';

export function LanguageDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = getStoredLanguage();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-100 rounded-lg"
      >
        {LANGUAGES[currentLang].nativeName} ▼
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 bg-white border rounded-lg shadow-lg">
          {Object.entries(LANGUAGES).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => {
                setStoredLanguage(code as LanguageCode);
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## ⚠️ Կարևոր նշումներ

1. **Ավտոմատ reload** - `setStoredLanguage()` ավտոմատ reload է անում էջը
2. **localStorage** - Լեզուն պահվում է `localStorage`-ում
3. **Event listener** - `useTranslation()` hook-ը ավտոմատ լսում է `language-updated` event-ը
4. **Server-side** - Server components-ում լեզուն ստանում ենք `getStoredLanguage()`-ով

## 🚀 Արագ սկսել

1. Import արեք `LanguageSwitcher`-ը
2. Տեղադրեք այն ձեր Header-ում կամ Footer-ում
3. Պատրաստ է! 🎉

```tsx
import { LanguageSwitcher } from '../components/LanguageSwitcher';

// Ձեր կոմպոնենտում
<LanguageSwitcher />
```

