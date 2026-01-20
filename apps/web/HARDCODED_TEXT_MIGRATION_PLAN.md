# Hardcoded Text Migration Plan

## Նպատակ
Տեղափոխել բոլոր hardcoded տեքստերը `web/app` հատվածից locales համակարգ, որպեսզի լեզվի փոփոխությունը ամբողջ կայքում ճիշտ աշխատի։

## Գտնված Hardcoded Տեքստեր

### 1. `app/products/page.tsx`
- ❌ `"Loading filters..."` (line 195, 230)
- ❌ `"Previous"` (line 212)
- ❌ `"Next"` (line 214)
- ❌ `"Page {page} of {totalPages}"` (line 213)
- ❌ `"No products found"` (line 220)

**Լուծում:**
- Ավելացնել `common.pagination.previous`, `common.pagination.next`, `common.pagination.pageOf`, `common.messages.loadingFilters`, `common.messages.noProductsFound`

### 2. `app/products/[slug]/page.tsx`
- ❌ `"Previous thumbnail"` (aria-label, line 781)
- ❌ `"Next thumbnail"` (aria-label, line 811)
- ❌ `"Fullscreen image"` (aria-label, line 859)
- ❌ `"✕"` (close button text, line 1172)

**Լուծում:**
- Ավելացնել `common.ariaLabels.previousThumbnail`, `common.ariaLabels.nextThumbnail`, `common.ariaLabels.fullscreenImage`, `common.buttons.close`

### 3. `app/categories/page.tsx`
- ❌ `"Loading categories..."` (line 100)
- ❌ `"Categories"` (line 108)
- ❌ `"Select product categories to find what you're looking for."` (line 109-110)
- ❌ `"No categories found"` (line 115)
- ❌ `"products"` (line 129)

**Լուծում:**
- Ստեղծել `categories.json` namespace
- Ավելացնել `categories.title`, `categories.description`, `categories.loading`, `categories.empty`, `categories.productsCount`

### 4. `app/orders/[number]/page.tsx`
- ❌ `"Order Not Found"` (line 154)
- ❌ `"The order you are looking for does not exist."` (line 155)
- ❌ `"Continue Shopping"` (line 157)
- ❌ `"Order #{order.number}"` (line 188)
- ❌ `"Placed on {date}"` (line 190)
- ❌ `"Order Status"` (line 199)
- ❌ `"Payment: {status}"` (line 205)
- ❌ `"Fulfillment: {status}"` (line 208)
- ❌ `"Order Items"` (line 215)
- ❌ `"Shipping Address"` (line 300)
- ❌ `"Phone: {phone}"` (line 314)
- ❌ `"Order Summary"` (line 323)
- ❌ `"Subtotal"` (line 328)
- ❌ `"Discount"` (line 333)
- ❌ `"Shipping"` (line 338)
- ❌ `"Tax"` (line 342)
- ❌ `"Total"` (line 347)
- ❌ `"Loading totals..."` (line 353)
- ❌ `"View Cart"` (line 365)
- ❌ `"Color:"` (line 264)
- ❌ `"Size:"` (line 279)
- ❌ `"SKU: {sku}"` (line 286)
- ❌ `"Quantity: {qty} × {price} = {total}"` (line 288)

**Լուծում:**
- Ստեղծել `orders.json` namespace
- Ավելացնել բոլոր անհրաժեշտ keys

### 5. `app/not-found.tsx`
- Ստուգել hardcoded տեքստերի առկայությունը

### 6. Այլ էջեր
- Ստուգել `app/admin/**` բոլոր էջերը
- Ստուգել բոլոր components-ները `components/` դիրեկտորիայում

## Գործողությունների Ցանկ

### Փուլ 1: Locale Keys-երի ավելացում
1. ✅ Ավելացնել `common.json`-ում:
   - `pagination.previous`
   - `pagination.next`
   - `pagination.pageOf`
   - `messages.loadingFilters`
   - `messages.noProductsFound`
   - `ariaLabels.previousThumbnail`
   - `ariaLabels.nextThumbnail`
   - `ariaLabels.fullscreenImage`
   - `buttons.close`

2. ✅ Ստեղծել `categories.json`:
   - `title`
   - `description`
   - `loading`
   - `empty`
   - `productsCount`

3. ✅ Ստեղծել `orders.json`:
   - `notFound.title`
   - `notFound.description`
   - `title`
   - `placedOn`
   - `orderStatus.title`
   - `orderStatus.payment`
   - `orderStatus.fulfillment`
   - `orderItems.title`
   - `shippingAddress.title`
   - `shippingAddress.phone`
   - `orderSummary.title`
   - `orderSummary.subtotal`
   - `orderSummary.discount`
   - `orderSummary.shipping`
   - `orderSummary.tax`
   - `orderSummary.total`
   - `orderSummary.loadingTotals`
   - `buttons.continueShopping`
   - `buttons.viewCart`
   - `itemDetails.color`
   - `itemDetails.size`
   - `itemDetails.sku`
   - `itemDetails.quantity`

### Փուլ 2: Կոդի փոփոխություն
1. `app/products/page.tsx` - փոխարինել բոլոր hardcoded տեքստերը
2. `app/products/[slug]/page.tsx` - փոխարինել aria-labels և այլ տեքստեր
3. `app/categories/page.tsx` - փոխարինել բոլոր hardcoded տեքստերը
4. `app/orders/[number]/page.tsx` - փոխարինել բոլոր hardcoded տեքստերը
5. Ստուգել և փոխարինել մնացած էջերում

### Փուլ 3: Թարգմանություններ
1. Ավելացնել բոլոր նոր keys-երը `locales/hy/` ֆայլերում
2. Ավելացնել բոլոր նոր keys-երը `locales/ru/` ֆայլերում

### Փուլ 4: Վերջնական ստուգում
1. Գտնել բոլոր hardcoded տեքստերը grep-ով
2. Ստուգել բոլոր էջերը ձեռքով
3. Ստուգել components-ները

## Նշումներ
- Բոլոր փոփոխությունները պետք է լինեն backward compatible
- Fallback values պետք է լինեն բոլոր translations-ում
- Console.log messages-ները կարող են մնալ (դրանք developer-ների համար են)

## Հաջորդ քայլեր
1. Սպասել օգտատիրոջ հաստատմանը
2. Սկսել փուլ 1-ից (locale keys-երի ավելացում)
3. Շարունակել փուլ 2-ով (կոդի փոփոխություն)
4. Ավարտել փուլ 3-ով (թարգմանություններ)
5. Կատարել վերջնական ստուգում



