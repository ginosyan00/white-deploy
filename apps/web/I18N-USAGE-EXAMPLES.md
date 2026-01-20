# i18n Օգտագործման Օրինակներ

## 📚 Բովանդակություն

1. [Client Components-ում օգտագործում](#client-components)
2. [Server Components-ում օգտագործում](#server-components)
3. [Ապրանքների թարգմանություններ](#product-translations)
4. [Ատրիբուտների թարգմանություններ](#attribute-translations)
5. [Բոլոր ֆունկցիաների օրինակներ](#all-functions)

---

## 🎯 Client Components-ում օգտագործում

### ✅ Ամենահեշտ ձև - `useTranslation()` Hook

```tsx
'use client';

import { useTranslation } from '../lib/i18n';

export function MyComponent() {
  // Hook-ը ավտոմատ կառավարում է լեզուն և memoization-ը
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('home.hero_title')}</h1>
      <button>{t('common.buttons.addToCart')}</button>
      <p>{t('common.messages.loading')}</p>
    </div>
  );
}
```

### 📝 Ամբողջական օրինակ - Button Component

```tsx
'use client';

import { useTranslation } from '../lib/i18n';

export function AddToCartButton({ productId }: { productId: string }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    // ... add to cart logic
    setLoading(false);
  };

  return (
    <button 
      onClick={handleClick}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      {loading ? t('common.messages.adding') : t('common.buttons.addToCart')}
    </button>
  );
}
```

### 🏠 Home Page Component (FeaturesSection-ի նման)

```tsx
'use client';

import { useTranslation } from '../lib/i18n';

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section>
      <h2>{t('home.features_title')}</h2>
      <p>{t('home.features_subtitle')}</p>
      
      <div>
        <h3>{t('home.feature_fast_delivery_title')}</h3>
        <p>{t('home.feature_fast_delivery_description')}</p>
      </div>
    </section>
  );
}
```

---

## 🖥️ Server Components-ում օգտագործում

Server Components-ում չի կարելի օգտագործել hooks, ուստի օգտագործում ենք ֆունկցիաները ուղղակիորեն:

```tsx
import { t } from '../lib/i18n';
import { getStoredLanguage } from '../lib/language';

export default async function ServerPage() {
  // Server-side-ում ստանում ենք լեզուն
  const lang = getStoredLanguage(); // կամ 'en' | 'hy'

  return (
    <div>
      <h1>{t(lang, 'home.hero_title')}</h1>
      <p>{t(lang, 'home.hero_subtitle')}</p>
    </div>
  );
}
```

---

## 🛍️ Ապրանքների թարգմանություններ

### `getProductText()` - Ապրանքի տեքստեր ստանալու համար

```tsx
'use client';

import { useTranslation } from '../lib/i18n';

export function ProductPage({ productId }: { productId: string }) {
  const { getProductText, t } = useTranslation();

  // Ստանում ենք ապրանքի վերնագիրը
  const title = getProductText(productId, 'title');
  
  // Ստանում ենք կարճ նկարագրությունը
  const shortDesc = getProductText(productId, 'shortDescription');
  
  // Ստանում ենք երկար նկարագրությունը (HTML-ով)
  const longDesc = getProductText(productId, 'longDescription');

  return (
    <div>
      <h1>{title || 'Product Title'}</h1>
      <p>{shortDesc}</p>
      <div dangerouslySetInnerHTML={{ __html: longDesc }} />
      <button>{t('product.addToCart')}</button>
    </div>
  );
}
```

### `products.json` ֆայլի կառուցվածք

```json
{
  "product-123": {
    "title": "Product Title in English",
    "shortDescription": "Short description",
    "longDescription": "<p>Long description with <strong>HTML</strong></p>"
  },
  "product-456": {
    "title": "Another Product",
    "shortDescription": "Another short description",
    "longDescription": "<p>Another long description</p>"
  }
}
```

---

## 🎨 Ատրիբուտների թարգմանություններ

### `getAttributeLabel()` - Ատրիբուտների պիտակներ

```tsx
'use client';

import { useTranslation } from '../lib/i18n';

export function ColorSelector({ colors }: { colors: string[] }) {
  const { getAttributeLabel, t } = useTranslation();

  return (
    <div>
      <label>{t('product.color')}:</label>
      <div className="flex gap-2">
        {colors.map((color) => (
          <button
            key={color}
            style={{ backgroundColor: getColorValue(color) }}
            title={getAttributeLabel('color', color)}
          >
            {getAttributeLabel('color', color)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SizeSelector({ sizes }: { sizes: string[] }) {
  const { getAttributeLabel, t } = useTranslation();

  return (
    <div>
      <label>{t('product.size')}:</label>
      <div className="flex gap-2">
        {sizes.map((size) => (
          <button key={size}>
            {getAttributeLabel('size', size)}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### `attributes.json` ֆայլի կառուցվածք

```json
{
  "color": {
    "red": "Red",
    "blue": "Blue",
    "green": "Green",
    "black": "Black",
    "white": "White"
  },
  "size": {
    "xs": "XS",
    "s": "S",
    "m": "M",
    "l": "L",
    "xl": "XL"
  }
}
```

---

## 🔧 Բոլոր ֆունկցիաների օրինակներ

### 1. `t()` - Հիմնական թարգմանություն

```tsx
// Client Component-ում
const { t } = useTranslation();
const text = t('common.buttons.addToCart'); // "Add to Cart" կամ "Ավելացնել զամբյուղ"

// Server Component-ում
import { t } from '../lib/i18n';
import { getStoredLanguage } from '../lib/language';
const lang = getStoredLanguage();
const text = t(lang, 'common.buttons.addToCart');
```

### 2. `getProductText()` - Ապրանքի տեքստեր

```tsx
// Client Component-ում
const { getProductText } = useTranslation();
const title = getProductText('product-123', 'title');
const description = getProductText('product-123', 'longDescription');

// Server Component-ում
import { getProductText } from '../lib/i18n';
const title = getProductText('en', 'product-123', 'title');
```

### 3. `getAttributeLabel()` - Ատրիբուտների պիտակներ

```tsx
// Client Component-ում
const { getAttributeLabel } = useTranslation();
const colorLabel = getAttributeLabel('color', 'red'); // "Red" կամ "Կարմիր"
const sizeLabel = getAttributeLabel('size', 'xl'); // "XL"

// Server Component-ում
import { getAttributeLabel } from '../lib/i18n';
const colorLabel = getAttributeLabel('en', 'color', 'red');
```

---

## 📋 Translation Keys-ի կառուցվածք

### `common.json` - Գլոբալ UI տարրեր

```json
{
  "buttons": {
    "addToCart": "Add to Cart",
    "submit": "Submit",
    "cancel": "Cancel"
  },
  "navigation": {
    "home": "Home",
    "products": "Products"
  },
  "messages": {
    "loading": "Loading...",
    "error": "Error occurred"
  }
}
```

**Օգտագործում:**
```tsx
t('common.buttons.addToCart')
t('common.navigation.home')
t('common.messages.loading')
```

### `home.json` - Home էջի տեքստեր

```json
{
  "hero_title": "Welcome to Shop",
  "hero_subtitle": "Discover amazing products",
  "hero_button_products": "PRODUCTS",
  "features_title": "We Provide High Quality Goods"
}
```

**Օգտագործում:**
```tsx
t('home.hero_title')
t('home.hero_subtitle')
t('home.features_title')
```

### `product.json` - Product էջի պիտակներ

```json
{
  "addToCart": "Add to Cart",
  "outOfStock": "Out of Stock",
  "selectColor": "Please select color",
  "selectSize": "Please select size"
}
```

**Օգտագործում:**
```tsx
t('product.addToCart')
t('product.outOfStock')
t('product.selectColor')
```

---

## 🎯 Գործնական օրինակ - Product Card

```tsx
'use client';

import { useTranslation } from '../lib/i18n';
import { formatPrice } from '../lib/currency';

export function ProductCard({ product }: { product: Product }) {
  const { t, getProductText, getAttributeLabel } = useTranslation();
  const [currency] = useState(getStoredCurrency());

  // Ստանում ենք ապրանքի թարգմանված վերնագիրը
  const title = getProductText(product.id, 'title') || product.title;

  return (
    <div className="product-card">
      <img src={product.image} alt={title} />
      <h3>{title}</h3>
      <p>{formatPrice(product.price, currency)}</p>
      
      {/* Գույնի ցուցադրում */
      {product.color && (
        <span>
          {t('product.color')}: {getAttributeLabel('color', product.color)}
        </span>
      )}
      
      {/* Չափի ցուցադրում */
      {product.size && (
        <span>
          {t('product.size')}: {getAttributeLabel('size', product.size)}
        </span>
      )}
      
      <button>
        {product.inStock 
          ? t('common.buttons.addToCart')
          : t('product.outOfStock')
        }
      </button>
    </div>
  );
}
```

---

## 🚀 Լավագույն պրակտիկաներ

### ✅ DO (Արեք)

```tsx
// ✅ Օգտագործեք useTranslation hook-ը client components-ում
const { t } = useTranslation();
const text = t('common.buttons.addToCart');

// ✅ Ստուգեք, որ key-ը գոյություն ունի
const title = getProductText(productId, 'title') || fallbackTitle;

// ✅ Օգտագործեք consistent namespace structure
t('common.buttons.addToCart')  // ✅
t('home.hero_title')          // ✅
t('product.addToCart')        // ✅
```

### ❌ DON'T (Մի արեք)

```tsx
// ❌ Մի օգտագործեք hooks server components-ում
export default async function ServerPage() {
  const { t } = useTranslation(); // ❌ Error!
}

// ❌ Մի օգտագործեք hardcoded տեքստեր
<button>Add to Cart</button> // ❌

// ❌ Մի օգտագործեք անհամապատասխան key structure
t('buttons.addToCart') // ❌ (պետք է լինի 'common.buttons.addToCart')
```

---

## 🔄 Լեզվի փոփոխություն

`useTranslation()` hook-ը ավտոմատ կառավարում է լեզվի փոփոխությունները: Երբ օգտատերը փոխում է լեզուն, բոլոր կոմպոնենտները ավտոմատ թարմացվում են:

```tsx
// Լեզուն փոխվում է localStorage-ում
setStoredLanguage('hy'); // Դա ավտոմատ reload է անում էջը

// useTranslation hook-ը ավտոմատ ստանում է նոր լեզուն
const { t } = useTranslation(); // ավտոմատ օգտագործում է 'hy'
```

---

## 📝 Ամփոփում

1. **Client Components** → օգտագործեք `useTranslation()` hook
2. **Server Components** → օգտագործեք `t(lang, path)` ֆունկցիան
3. **Ապրանքների տեքստեր** → օգտագործեք `getProductText()`
4. **Ատրիբուտների պիտակներ** → օգտագործեք `getAttributeLabel()`
5. **Translation keys** → հետևեք `namespace.category.key` կառուցվածքին

---

## 🆘 Օգնություն

Եթե հարցեր ունեք, նայեք:
- `lib/i18n.ts` - ֆունկցիաների սկզբնական կոդ
- `lib/i18n.README.md` - մանրամասն documentation
- `locales/en/` և `locales/hy/` - թարգմանությունների ֆայլեր





