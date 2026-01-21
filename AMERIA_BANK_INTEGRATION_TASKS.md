# Ameria Bank Integration - Task List (Ամբողջական)

## 📋 Ներածություն

Այս ֆայլը պարունակում է բոլոր task-երը Ameria Bank-ի ինտեգրման համար։ 
Ուսումնասիրվել են բոլոր հիմնական ֆայլերը և հայտնաբերվել են բոլոր խնդիրները։

---

## 🔍 Ուսումնասիրված ֆայլեր

### Հիմնական ֆայլեր
1. ✅ `apps/web/lib/services/payments/ameria-client.ts` - API client
2. ✅ `apps/web/lib/services/payments/ameria-payment.service.ts` - Payment service
3. ✅ `apps/web/lib/services/payments/payment-config.service.ts` - Configuration service
4. ✅ `apps/web/app/api/v1/payments/ameria/callback/route.ts` - Callback handler
5. ✅ `apps/web/app/api/v1/payments/ameria/verify/route.ts` - Verify endpoint
6. ✅ `apps/web/app/api/v1/admin/payments/config/route.ts` - Admin config
7. ✅ `apps/web/app/api/v1/admin/payments/validate/route.ts` - Validation endpoint
8. ✅ `apps/web/lib/services/orders.service.ts` - Order service integration
9. ✅ `apps/web/app/checkout/page.tsx` - Checkout page
10. ✅ `ameria/vPOS_Arm_3.1.md` - Official documentation
11. ✅ `ameria/AMERIABANK_COMPLETE_ANALYSIS.md` - Analysis document
12. ✅ `ameria/AMERIABANK_ARCA_CALLBACK_AND_DOMAINS.md` - Callback documentation

### Աջակցող ֆայլեր
- ✅ `apps/web/app/admin/payments/page.tsx` - Admin UI
- ✅ `apps/web/locales/**/checkout.json` - Translations
- ✅ `apps/web/locales/**/admin.json` - Admin translations

---

## ❌ Գտնված խնդիրներ

### 1. **ameria-client.ts** - Քրիտիկական խնդիրներ

#### ❌ Խնդիր 1.1: Սխալ API Endpoint
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts:110`
**Ներկա:** 
```typescript
const response = await fetch(`${this.baseUrl}/InitPayment`, {
```
**Պետք է լինի:**
```typescript
const response = await fetch(`${this.baseUrl}/api/VPOS/InitPayment`, {
```
**Լրացուցիչ:** Base URL-ը պետք է լինի `https://servicestest.ameriabank.am/VPOS` (առանց `/api/VPOS`)

#### ❌ Խնդիր 1.2: Սխալ BackURL պարամետր
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts:24,104`
**Ներկա:** 
```typescript
ReturnURL: string;
// ...
ReturnURL: this.config.returnUrl,
```
**Պետք է լինի:**
```typescript
BackURL: string;
// ...
BackURL: this.config.returnUrl,
```
**Նշում:** Ըստ փաստաթղթի պետք է օգտագործել `BackURL`, ոչ `ReturnURL`

#### ❌ Խնդիր 1.3: Սխալ GetPaymentDetails API endpoint
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts:160`
**Ներկա:**
```typescript
const response = await fetch(`${this.baseUrl}/GetPaymentDetails`, {
```
**Պետք է լինի:**
```typescript
const response = await fetch(`${this.baseUrl}/api/VPOS/GetPaymentDetails`, {
```

#### ❌ Խնդիր 1.4: Սխալ GetPaymentDetails request structure
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts:152-157`
**Ներկա:**
```typescript
const request = {
  ClientId: this.config.clientId,
  Username: this.config.username,
  Password: this.config.password,
  PaymentID: paymentId,
};
```
**Պետք է լինի:** (ըստ փաստաթղթի պետք է միայն `Username`, `Password`, `PaymentID`)
```typescript
const request = {
  Username: this.config.username,
  Password: this.config.password,
  PaymentID: paymentId,
};
```

#### ❌ Խնդիր 1.5: Սխալ Payment URL format
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts:337-342`
**Ներկա:**
```typescript
getPaymentUrl(paymentId: string): string {
  const paymentBaseUrl = this.config.testMode
    ? 'https://servicestest.ameriabank.am/VPOS/Payments/Pay'
    : 'https://services.ameriabank.am/VPOS/Payments/Pay';
  
  return `${paymentBaseUrl}?PaymentID=${paymentId}`;
}
```
**Պետք է լինի:** (ըստ փաստաթղթի պետք է `id` և `lang`)
```typescript
getPaymentUrl(paymentId: string, lang: string = 'en'): string {
  const paymentBaseUrl = this.config.testMode
    ? 'https://servicestest.ameriabank.am/VPOS/Payments/Pay'
    : 'https://services.ameriabank.am/VPOS/Payments/Pay';
  
  return `${paymentBaseUrl}?id=${paymentId}&lang=${lang}`;
}
```

#### ❌ Խնդիր 1.6: Սխալ InitPayment response codes
**Ֆայլ:** `apps/web/lib/services/payments/ameria-payment.service.ts:125`
**Ներկա:**
```typescript
if (initResponse.RespCode !== "0" || !initResponse.PaymentID) {
```
**Պետք է լինի:** (ըստ փաստաթղթի `ResponseCode: 1` = success)
```typescript
if (initResponse.ResponseCode !== 1 || !initResponse.PaymentID) {
```

#### ❌ Խնդիր 1.7: Սխալ RefundPayment API endpoint
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts:213`
**Ներկա:**
```typescript
const response = await fetch(`${this.baseUrl}/RefundPayment`, {
```
**Պետք է լինի:**
```typescript
const response = await fetch(`${this.baseUrl}/api/VPOS/RefundPayment`, {
```

#### ❌ Խնդիր 1.8: Սխալ CancelPayment API endpoint
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts:262`
**Ներկա:**
```typescript
const response = await fetch(`${this.baseUrl}/CancelPayment`, {
```
**Պետք է լինի:**
```typescript
const response = await fetch(`${this.baseUrl}/api/VPOS/CancelPayment`, {
```

#### ❌ Խնդիր 1.9: Base URL configuration
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts:69-77`
**Ներկա:**
```typescript
this.baseUrl = config.testMode
  ? 'https://servicestest.ameriabank.am/VPOS'
  : 'https://services.ameriabank.am/VPOS';
```
**Լրացուցիչ:** Base URL-ը ճիշտ է, բայց endpoint-ներում պետք է ավելացնել `/api/VPOS`

---

### 2. **ameria-payment.service.ts** - Քրիտիկական խնդիրներ

#### ❌ Խնդիր 2.1: Սխալ InitPayment response handling
**Ֆայլ:** `apps/web/lib/services/payments/ameria-payment.service.ts:125`
**Ներկա:**
```typescript
if (initResponse.RespCode !== "0" || !initResponse.PaymentID) {
```
**Պետք է լինի:**
```typescript
if (initResponse.ResponseCode !== 1 || !initResponse.PaymentID) {
```
**Լրացուցիչ:** Պետք է ստուգել `ResponseCode === 1` և `ResponseMessage === "OK"`

#### ❌ Խնդիր 2.2: Սխալ GetPaymentDetails response codes
**Ֆայլ:** `apps/web/lib/services/payments/ameria-payment.service.ts:260-262`
**Ներկա:**
```typescript
const isSuccess = paymentDetails.RespCode === "0" || 
                 paymentDetails.PaymentState === "Approved" ||
                 paymentDetails.ResponseCode === "00";
```
**Պետք է լինի:** (ըստ փաստաթղթի)
```typescript
const isSuccess = paymentDetails.ResponseCode === "00" && 
                 paymentDetails.PaymentState === "Successful";
```

#### ❌ Խնդիր 2.3: Սխալ callback parameters handling
**Ֆայլ:** `apps/web/lib/services/payments/ameria-payment.service.ts:219`
**Ներկա:** Callback-ում սպասում են `PaymentID`
**Պետք է լինի:** Callback-ում գալիս են `paymentID`, `orderID`, `resposneCode` (չափանիշ opечатка), `Opaque`

#### ❌ Խնդիր 2.4: Missing OrderID from callback
**Ֆայլ:** `apps/web/lib/services/payments/ameria-payment.service.ts:210-336`
**Խնդիր:** Callback handler-ը չի օգտագործում `Opaque` պարամետրը order-ը գտնելու համար
**Պետք է լինի:** Պետք է օգտագործել `Opaque` պարամետրը (որտեղ պահվում է order ID)

---

### 3. **callback/route.ts** - Քրիտիկական խնդիրներ

#### ❌ Խնդիր 3.1: Callback parameters mapping
**Ֆայլ:** `apps/web/app/api/v1/payments/ameria/callback/route.ts:46-52`
**Ներկա:** Պարզապես փոխանցում են բոլոր params
**Պետք է լինի:** Պետք է map անել `resposneCode` → `responseCode`, `paymentID` → `PaymentID`

#### ❌ Խնդիր 3.2: Missing Opaque parameter
**Ֆայլ:** `apps/web/app/api/v1/payments/ameria/callback/route.ts`
**Խնդիր:** Callback-ում չի փոխանցվում `Opaque` պարամետրը service-ին

---

### 4. **payment-config.service.ts** - Interface issues

#### ❌ Խնդիր 4.1: returnUrl vs BackURL naming
**Ֆայլ:** `apps/web/lib/services/payments/payment-config.service.ts:20`
**Ներկա:**
```typescript
returnUrl: string;
```
**Պետք է լինի:** Interface-ը կարող է մնալ `returnUrl`, բայց client-ում պետք է map անել `BackURL`

---

### 5. **Interface/Type Definitions** - Type mismatches

#### ❌ Խնդիր 5.1: InitPaymentResponse interface
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts:29-34`
**Ներկա:**
```typescript
interface InitPaymentResponse {
  PaymentID?: string;
  RespCode: string;
  RespMessage: string;
  OrderID?: string;
}
```
**Պետք է լինի:** (ըստ փաստաթղթի)
```typescript
interface InitPaymentResponse {
  PaymentID?: string;
  ResponseCode: number; // 1 = success
  ResponseMessage: string; // "OK" = success
}
```

#### ❌ Խնդիր 5.2: PaymentDetailsResponse interface
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts:36-49`
**Ներկա:** Interface-ը պարունակում է սխալ field names
**Պետք է լինի:** Պետք է համապատասխանեցնել փաստաթղթին

---

### 6. **InitPayment Request** - Missing parameters

#### ❌ Խնդիր 6.1: Missing lang parameter
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts:83-89`
**Ներկա:** `initPayment` function-ը չի ստանում `lang` parameter
**Պետք է լինի:** Պետք է ավելացնել `lang` parameter (am/ru/en)

#### ❌ Խնդիր 6.2: Missing Currency code format
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts:102`
**Ներկա:** Currency-ը փոխանցվում է որպես string
**Պետք է լինի:** Currency-ը պետք է լինի ISO code (051=AMD, 978=EUR, 840=USD, 643=RUB)

---

## ✅ Task List (Բոլոր task-երը)

### Phase 1: Critical Fixes (Քրիտիկական ուղղումներ)

- [ ] **Task 1.1:** Fix InitPayment API endpoint
  - Ֆայլ: `ameria-client.ts:110`
  - Փոխել `${this.baseUrl}/InitPayment` → `${this.baseUrl}/api/VPOS/InitPayment`

- [ ] **Task 1.2:** Fix ReturnURL → BackURL
  - Ֆայլ: `ameria-client.ts:24,104`
  - Փոխել `ReturnURL` → `BackURL` request-ում

- [ ] **Task 1.3:** Fix GetPaymentDetails API endpoint
  - Ֆայլ: `ameria-client.ts:160`
  - Փոխել endpoint-ը `/api/VPOS/GetPaymentDetails`

- [ ] **Task 1.4:** Fix GetPaymentDetails request structure
  - Ֆայլ: `ameria-client.ts:152-157`
  - Հեռացնել `ClientId` field-ը

- [ ] **Task 1.5:** Fix Payment URL format
  - Ֆայլ: `ameria-client.ts:337-342`
  - Փոխել `?PaymentID=` → `?id=` և ավելացնել `&lang=`

- [ ] **Task 1.6:** Fix InitPayment response codes
  - Ֆայլ: `ameria-payment.service.ts:125`
  - Փոխել `RespCode !== "0"` → `ResponseCode !== 1`

- [ ] **Task 1.7:** Fix RefundPayment API endpoint
  - Ֆայլ: `ameria-client.ts:213`
  - Փոխել endpoint-ը `/api/VPOS/RefundPayment`

- [ ] **Task 1.8:** Fix CancelPayment API endpoint
  - Ֆայլ: `ameria-client.ts:262`
  - Փոխել endpoint-ը `/api/VPOS/CancelPayment`

### Phase 2: Response Handling Fixes (Response-ների մշակում)

- [ ] **Task 2.1:** Fix InitPaymentResponse interface
  - Ֆայլ: `ameria-client.ts:29-34`
  - Փոխել `RespCode: string` → `ResponseCode: number`
  - Հեռացնել `OrderID` field-ը

- [ ] **Task 2.2:** Fix PaymentDetailsResponse interface
  - Ֆայլ: `ameria-client.ts:36-49`
  - Համապատասխանեցնել փաստաթղթին

- [ ] **Task 2.3:** Fix GetPaymentDetails success check
  - Ֆայլ: `ameria-payment.service.ts:260-262`
  - Փոխել success check-ը `ResponseCode === "00" && PaymentState === "Successful"`

### Phase 3: Callback Handling (Callback-ների մշակում)

- [ ] **Task 3.1:** Fix callback parameters mapping
  - Ֆայլ: `callback/route.ts:46-52`
  - Map անել `resposneCode` → `responseCode`
  - Map անել `paymentID` → `PaymentID`
  - Map անել `orderID` → `OrderID`

- [ ] **Task 3.2:** Add Opaque parameter handling
  - Ֆայլ: `callback/route.ts` և `ameria-payment.service.ts`
  - Callback-ում ստանալ `Opaque` պարամետրը
  - Օգտագործել `Opaque` order-ը գտնելու համար

- [ ] **Task 3.3:** Fix callback order lookup
  - Ֆայլ: `ameria-payment.service.ts:237-245`
  - Նախ փորձել գտնել order `Opaque`-ով
  - Եթե չի գտնվում, փորձել `PaymentID`-ով

### Phase 4: Request Parameters (Request պարամետրեր)

- [ ] **Task 4.1:** Add lang parameter to initPayment
  - Ֆայլ: `ameria-client.ts:83-89`
  - Ավելացնել `lang?: string` parameter
  - Default value: `'en'`

- [ ] **Task 4.2:** Add lang to InitPayment request
  - Ֆայլ: `ameria-client.ts:97-107`
  - Ավելացնել `lang` field request-ում

- [ ] **Task 4.3:** Ensure Currency format
  - Ֆայլ: `ameria-client.ts`, `payment-config.service.ts`
  - Վստահել, որ Currency-ը ISO code format-ով է (051, 978, 840, 643)

- [ ] **Task 4.4:** Pass lang to getPaymentUrl
  - Ֆայլ: `ameria-payment.service.ts:186`
  - Ավելացնել `lang` parameter `getPaymentUrl` call-ին

### Phase 5: Error Handling (Սխալների մշակում)

- [ ] **Task 5.1:** Add proper error logging
  - Բոլոր ֆայլեր
  - Ավելացնել մանրամասն error logging

- [ ] **Task 5.2:** Handle API error responses
  - Ֆայլ: `ameria-client.ts`
  - Ավելացնել error response handling

- [ ] **Task 5.3:** Add validation for callback parameters
  - Ֆայլ: `callback/route.ts`
  - Ստուգել, որ բոլոր required parameters-ները կան

### Phase 6: Testing & Documentation (Թեստավորում և փաստաթղթավորում)

- [ ] **Task 6.1:** Create test cases
  - Ստեղծել test cases բոլոր API calls-ի համար

- [ ] **Task 6.2:** Test InitPayment flow
  - Թեստավորել payment initialization

- [ ] **Task 6.3:** Test Callback flow
  - Թեստավորել callback handling

- [ ] **Task 6.4:** Test GetPaymentDetails
  - Թեստավորել payment status verification

- [ ] **Task 6.5:** Update documentation
  - Թարմացնել inline comments
  - Ավելացնել usage examples

---

## 📝 Լրացուցիչ նշումներ

### Անվտանգություն
- ✅ Password encryption արդեն կա `payment-config.service.ts`-ում
- ⚠️ Պետք է ստուգել, որ `ENCRYPTION_KEY` ապահովված է production-ում

### Configuration
- ✅ Configuration storage արդեն կա Settings table-ում
- ⚠️ Պետք է ստուգել, որ `returnUrl` ճիշտ է կարգավորված

### Testing
- ⚠️ Պետք է ստանալ test credentials Ameria Bank-ից
- ⚠️ Test mode-ը պետք է աշխատի localhost-ով

---

## 🎯 Առաջնահերթություն

1. **Phase 1** - Քրիտիկական ուղղումներ (առաջին հերթին)
2. **Phase 2** - Response handling
3. **Phase 3** - Callback handling
4. **Phase 4** - Request parameters
5. **Phase 5** - Error handling
6. **Phase 6** - Testing

---

## 📊 Ստատիստիկա

- **Ընդհանուր task-եր:** 33
- **Քրիտիկական:** 8 (Phase 1)
- **Կարևոր:** 13 (Phase 2-3)
- **Լրացուցիչ:** 12 (Phase 4-6)

---

**Ստեղծվել է:** 2024
**Վերջին թարմացում:** 2024





