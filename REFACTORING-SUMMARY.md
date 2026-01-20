# Product Variant Refactoring Summary

## 📋 Նկարագրություն

Այս refactoring-ը վերակառուցում է Product-ի variant համակարգը, որպեսզի օգտագործի Attribute/AttributeValue մոդելները AttributeValue ID-ների միջոցով, փոխարենը string-based attributeKey/value համակարգի:

## ✅ Կատարված փոփոխություններ

### 1. Database Schema Updates

#### ProductAttribute Junction Table
- **Նոր մոդել**: `ProductAttribute`
- **Նպատակ**: Կապում է Product-ները իրենց Attribute-ների հետ
- **Fields**: `id`, `productId`, `attributeId`
- **Unique constraint**: `[productId, attributeId]`

#### ProductVariantOption Updates
- **Ավելացված relation**: `attributeValue` (AttributeValue-ի հետ)
- **Backward compatibility**: Պահպանված են `attributeKey` և `value` fields-ները
- **Index**: Ավելացված է `valueId` index

#### Product Model Updates
- **Ավելացված relation**: `productAttributes` (ProductAttribute-ների հետ)

#### Attribute & AttributeValue Updates
- **Attribute**: Ավելացված է `productAttributes` relation
- **AttributeValue**: Ավելացված է `variantOptions` relation

### 2. Business Logic Updates

#### Variant Generator Utility (`apps/web/lib/utils/variant-generator.ts`)
- **`generateAttributeCombinations()`**: Գեներացնում է AttributeValue-ների բոլոր հնարավոր կոմբինացիաները
- **`getProductAttributeValues()`**: Ստանում է Product-ի AttributeValue-ները
- **`findOrCreateAttributeValue()`**: Գտնում կամ ստեղծում է AttributeValue-ը attribute key-ով և value string-ով
- **`generateVariantsFromAttributes()`**: Գեներացնում է variants-ները Product-ի attributes-ներից

#### Admin Service Updates (`apps/web/lib/services/admin.service.ts`)
- **`createProduct()`**: Թարմացված է, որպեսզի օգտագործի AttributeValue ID-ները
- **`updateProduct()`**: Թարմացված է, որպեսզի օգտագործի AttributeValue ID-ները
- **Backward compatibility**: Պահպանված է հին format-ի աջակցությունը (attributeKey/value)

#### Products Service Updates (`apps/web/lib/services/products.service.ts`)
- **`findAll()`**: Թարմացված է, որպեսզի include-ի AttributeValue relations
- **`findBySlug()`**: Թարմացված է, որպեսզի include-ի AttributeValue relations և productAttributes
- **Color extraction**: Թարմացված է, որպեսզի աշխատի և՛ նոր, և՛ հին format-ների հետ
- **Variant options mapping**: Թարմացված է, որպեսզի աջակցի և՛ AttributeValue ID-ներին, և՛ string values-ին

### 3. Backward Compatibility

Պահպանված է ամբողջական backward compatibility:
- Հին format-ի variant-ները (attributeKey/value) շարունակում են աշխատել
- Նոր variant-ները կարող են օգտագործել AttributeValue ID-ները
- Երկու format-ները կարող են գոյակցել նույն Product-ում

## 🔄 Migration Plan

### Step 1: Database Migration
```bash
cd packages/db
npx prisma migrate dev --name add_product_attributes
```

### Step 2: Data Migration (Optional)
Գոյություն ունեցող տվյալների համար migration script-ը կփոխակերպի:
- String-based attributeKey/value → AttributeValue ID
- Ստեղծել ProductAttribute relations

### Step 3: Testing
- Ստուգել Product-ների ստեղծումը
- Ստուգել Variant-ների գեներացումը
- Ստուգել Product page-ի աշխատանքը
- Ստուգել Cart-ի աշխատանքը

## 📝 Հաջորդ քայլեր

1. ✅ Database Schema - COMPLETED
2. ✅ Business Logic - COMPLETED
3. ✅ Frontend Updates (Product Page, Admin Form) - COMPLETED
4. ✅ Migration Script - COMPLETED
5. ⏳ Testing & Validation

## 🎯 Արդյունք

- ✅ Product-ը պահում է միայն id, title, description, image
- ✅ Price և stock-ը հեռացված են Product-ից
- ✅ Attribute-ները գլոբալ են (Color, Size, etc.)
- ✅ Variant-ները կապված են AttributeValue-ների հետ
- ✅ Cart-ը օգտագործում է variantId
- ✅ Backward compatibility պահպանված է

## ⚠️ Նշումներ

- Migration script-ը պետք է աշխատի աստիճանաբա
- Հին format-ի variant-ները կարող են մնալ, մինչև migration-ը ավարտվի
- Նոր Product-ները կարող են օգտագործել նոր format-ը

