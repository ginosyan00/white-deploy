# Ameria Bank Integration - Implementation Steps (Հերթականություն)

## 📚 STEP 0: Նախապատրաստական փուլ (Documentation Review)

### ✅ Step 0.1: Կարդալ Specification-ը
**Ֆայլ:** `AMERIA_BANK_INTEGRATION_SPECIFICATION.md`

**Ինչ պետք է անել:**
- [ ] Կարդալ ամբողջ specification-ը
- [ ] Հասկանալ payment flow-ը (Steps 1-12)
- [ ] Հասկանալ API endpoints-ները
- [ ] Հասկանալ callback mechanism-ը

**Կարևոր է:** Այս ֆայլը հանդիսանում է **SOURCE OF TRUTH** - ամեն ինչ պետք է կատարվի ըստ այս specification-ի:

**Վերցվածք:** ~30 րոպե

---

### ✅ Step 0.2: Կարդալ Tasks List-ը
**Ֆայլ:** `AMERIA_BANK_INTEGRATION_TASKS.md`

**Ինչ պետք է անել:**
- [ ] Կարդալ բոլոր հայտնաբերված խնդիրները
- [ ] Հասկանալ, թե ինչ պետք է ուղղել
- [ ] Նշել հիմնական problem areas-ները

**Վերցվածք:** ~20 րոպե

---

### ✅ Step 0.3: Կարդալ PHP → TS Conversion Guide-ը
**Ֆայլ:** `AMERIA_PHP_TO_TS_CONVERSION.md`

**Ինչ պետք է անել:**
- [ ] Կարդալ օգտակար information-ը PHP կոդից
- [ ] Նայել working examples-ները
- [ ] Հասկանալ error codes mapping-ը

**Վերցվածք:** ~15 րոպե

---

## 🔧 PHASE 1: Fix ameria-client.ts (Ամենակարևորը)

### ✅ Step 1: Fix API Endpoints
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts`

**Ինչ պետք է անել:**

1. [ ] **Fix baseUrl construction**
   ```typescript
   // ❌ WRONG (if exists):
   this.baseUrl = testMode 
     ? 'https://servicestest.ameriabank.am/VPOS/api/VPOS'
     : 'https://services.ameriabank.am/VPOS/api/VPOS';
   
   // ✅ CORRECT:
   this.baseUrl = testMode 
     ? 'https://servicestest.ameriabank.am/VPOS'
     : 'https://services.ameriabank.am/VPOS';
   ```

2. [ ] **Fix InitPayment endpoint**
   ```typescript
   // ❌ WRONG:
   const response = await fetch(`${this.baseUrl}/InitPayment`, {
   
   // ✅ CORRECT:
   const response = await fetch(`${this.baseUrl}/api/VPOS/InitPayment`, {
   ```

3. [ ] **Fix GetPaymentDetails endpoint**
   ```typescript
   // ❌ WRONG:
   const response = await fetch(`${this.baseUrl}/GetPaymentDetails`, {
   
   // ✅ CORRECT:
   const response = await fetch(`${this.baseUrl}/api/VPOS/GetPaymentDetails`, {
   ```

4. [ ] **Fix other endpoints** (ConfirmPayment, CancelPayment, RefundPayment)
   - Ավելացնել `/api/VPOS/` prefix բոլոր endpoint-ներին

**Reference:** 
- Specification: Section 2.2 (API Endpoints)
- PHP Code: Line 688, 698 in `main.php`

---

### ✅ Step 2: Fix InitPayment Request Structure
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts`

**Ինչ պետք է անել:**

1. [ ] **Change ReturnURL → BackURL**
   ```typescript
   // ❌ WRONG:
   interface InitPaymentRequest {
     ReturnURL: string;
   }
   
   // ✅ CORRECT:
   interface InitPaymentRequest {
     BackURL: string;
   }
   ```

2. [ ] **Fix ClientID field name** (if needed)
   ```typescript
   // ✅ CORRECT:
   interface InitPaymentRequest {
     ClientID: string;  // Not ClientId
     Username: string;
     Password: string;
     OrderID: number | string;  // integer per docs
     Amount: number;
     Currency: string;
     Description: string;
     BackURL: string;  // Not ReturnURL
     Opaque?: string;
     CardHolderID?: string;
     Timeout?: number;
   }
   ```

3. [ ] **Fix initPayment method parameters**
   - Փոխել `returnUrl` → `backUrl` (եթե այդպես է անվանված)
   - Ավելացնել `lang` parameter (optional, default: 'en')

**Reference:**
- Specification: Section 4.3 (Request Body)
- PHP Code: Lines 670-681 in `main.php`

---

### ✅ Step 3: Fix InitPayment Response Handling
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts`

**Ինչ պետք է անել:**

1. [ ] **Fix response interface**
   ```typescript
   // ❌ WRONG:
   interface InitPaymentResponse {
     RespCode: string;
     RespMessage: string;
   }
   
   // ✅ CORRECT:
   interface InitPaymentResponse {
     PaymentID: string;
     ResponseCode: number;  // integer, 1 = success
     ResponseMessage: string;  // "OK" for success
   }
   ```

2. [ ] **Fix success check**
   ```typescript
   // ❌ WRONG:
   if (data.RespCode === "00") { ... }
   
   // ✅ CORRECT:
   if (data.ResponseCode === 1 && data.ResponseMessage === "OK") {
     return data;
   }
   throw new Error(data.ResponseMessage || 'Payment initialization failed');
   ```

**Reference:**
- Specification: Section 4.6 (Response Structure), 4.7 (Success Criteria)
- PHP Code: Line 696 in `main.php`

---

### ✅ Step 4: Fix GetPaymentDetails Request
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts`

**Ինչ պետք է անել:**

1. [ ] **Remove ClientID from request** (if exists)
   ```typescript
   // ❌ WRONG:
   {
     ClientID: this.config.clientId,
     Username: this.config.username,
     Password: this.config.password,
     PaymentID: paymentId
   }
   
   // ✅ CORRECT:
   {
     Username: this.config.username,
     Password: this.config.password,
     PaymentID: paymentId
   }
   ```

2. [ ] **Fix response interface**
   - `ResponseCode` = string ("00" = success)
   - `PaymentState` = string ("Successful" = success)
   - `OrderStatus` = number (0-6)

**Reference:**
- Specification: Section 6.3 (Request Body)
- PHP Code: Lines 1292-1296 in `main.php`

---

### ✅ Step 5: Fix GetPaymentDetails Success Check
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts`

**Ինչ պետք է անել:**

1. [ ] **Fix success criteria**
   ```typescript
   // ❌ WRONG:
   if (data.ResponseCode === "0" || data.PaymentState === "Approved") { ... }
   
   // ✅ CORRECT:
   // Payment is successful when:
   // - ResponseCode === "00"
   // - PaymentState === "Successful"
   // - OrderStatus === 2
   ```

**Reference:**
- Specification: Section 6.6 (Success Criteria)
- PHP Code: Line 1307 in `main.php`

---

### ✅ Step 6: Fix Payment URL Construction
**Ֆայլ:** `apps/web/lib/services/payments/ameria-client.ts`

**Ինչ պետք է անել:**

1. [ ] **Fix getPaymentUrl method**
   ```typescript
   // ❌ WRONG:
   getPaymentUrl(paymentId: string): string {
     return `${this.baseUrl}/Payments/Pay?PaymentID=${paymentId}`;
   }
   
   // ✅ CORRECT:
   getPaymentUrl(paymentId: string, lang: string = 'en'): string {
     const paymentBaseUrl = this.config.testMode
       ? 'https://servicestest.ameriabank.am/VPOS'
       : 'https://services.ameriabank.am/VPOS';
     
     return `${paymentBaseUrl}/Payments/Pay?id=${paymentId}&lang=${lang}`;
   }
   ```

**Reference:**
- Specification: Section 4.8 (Payment URL Construction)
- PHP Code: Line 703 in `main.php`

---

## 🔧 PHASE 2: Fix ameria-payment.service.ts

### ✅ Step 7: Fix Status Validation Logic
**Ֆայլ:** `apps/web/lib/services/payments/ameria-payment.service.ts`

**Ինչ պետք է անել:**

1. [ ] **Fix handleCallback status check**
   ```typescript
   // ❌ WRONG:
   if (paymentDetails.RespCode === "0" || paymentDetails.PaymentState === "Approved") {
   
   // ✅ CORRECT:
   if (
     paymentDetails.ResponseCode === "00" &&
     paymentDetails.PaymentState === "Successful" &&
     paymentDetails.OrderStatus === 2
   ) {
     // Payment successful
   }
   ```

2. [ ] **Add OrderStatus mapping**
   ```typescript
   // Add mapping function based on OrderStatus codes:
   // 0 = payment_started (pending)
   // 1 = payment_approved (processing/on-hold for two-stage)
   // 2 = payment_deposited (completed)
   // 3 = payment_void (cancelled)
   // 4 = payment_refunded (refunded)
   // 6 = payment_declined (failed)
   ```

**Reference:**
- Specification: Section 6.7 (OrderStatus Codes), 7.4 (Status Mapping)
- PHP Code: Lines 190-206 in `main.php`

---

### ✅ Step 8: Fix initializePayment Method
**Ֆայլ:** `apps/web/lib/services/payments/ameria-payment.service.ts`

**Ինչ պետք է անել:**

1. [ ] **Ensure Opaque field is set correctly**
   ```typescript
   // ✅ CORRECT:
   const result = await client.initPayment({
     orderId: order.id,
     amount: order.total,
     currency: order.currency,
     description: `Order #${order.id}`,
     opaque: order.id,  // Store order ID in Opaque
     lang: 'en',  // or get from config/i18n
     backUrl: config.returnUrl,  // Not returnUrl
   });
   ```

**Reference:**
- Specification: Section 4.3 (Opaque field)
- PHP Code: Line 679 in `main.php`

---

## 🔧 PHASE 3: Fix Callback Handler

### ✅ Step 9: Fix Callback Route Parameter Extraction
**Ֆայլ:** `apps/web/app/api/v1/payments/ameria/callback/route.ts`

**Ինչ պետք է անել:**

1. [ ] **Fix GET handler parameter extraction**
   ```typescript
   // ✅ CORRECT parameter names (with typo!):
   const orderID = searchParams.get('orderID');      // Bank's order ID
   const paymentID = searchParams.get('paymentID');  // Payment ID
   const responseCode = searchParams.get('resposneCode'); // Note: typo in API!
   const currency = searchParams.get('currency');
   const opaque = searchParams.get('Opaque');        // Your order ID
   ```

2. [ ] **Add validation**
   ```typescript
   if (!paymentID || !opaque) {
     return NextResponse.redirect(new URL('/checkout?error=invalid_callback', req.url));
   }
   ```

**Reference:**
- Specification: Section 5.2 (BackURL Callback Parameters)
- PHP Code: Lines 1291-1292 in `main.php`

---

### ✅ Step 10: Ensure GetPaymentDetails is Always Called
**Ֆայլ:** `apps/web/app/api/v1/payments/ameria/callback/route.ts`

**Ինչ պետք է անել:**

1. [ ] **Always verify via API** (NEVER trust URL parameters alone)
   ```typescript
   // ❌ WRONG:
   if (responseCode === '00') {
     // Trust URL parameter and mark as paid
   }
   
   // ✅ CORRECT:
   // Always call GetPaymentDetails regardless of URL parameter
   const result = await ameriaPaymentService.handleCallback({
     PaymentID: paymentID,
     Opaque: opaque,
   });
   
   // handleCallback internally calls GetPaymentDetails to verify
   ```

2. [ ] **Update handleCallback to always verify**
   - Ensure it calls `client.getPaymentDetails()`
   - Never trusts URL parameters

**Reference:**
- Specification: Section 5.4 (Critical Security Requirement)
- PHP Code: Lines 1298-1302 in `main.php`

---

### ✅ Step 11: Fix Error Handling in Callback
**Ֆայլ:** `apps/web/app/api/v1/payments/ameria/callback/route.ts`

**Ինչ պետք է անել:**

1. [ ] **Add proper error handling**
   ```typescript
   try {
     const result = await ameriaPaymentService.handleCallback({...});
     
     if (result.success) {
       return NextResponse.redirect(
         new URL(`/orders/${result.orderId}?payment=success`, req.url)
       );
     } else {
       return NextResponse.redirect(
         new URL(`/orders/${result.orderId}?payment=failed`, req.url)
       );
     }
   } catch (error) {
     console.error('Payment callback error:', error);
     return NextResponse.redirect(
       new URL('/checkout?error=payment_error', req.url)
     );
   }
   ```

**Reference:**
- Specification: Section 7.5 (Error Handling)

---

## 🔧 PHASE 4: Configuration and Admin

### ✅ Step 12: Update Configuration Service (if needed)
**Ֆայլ:** `apps/web/lib/services/payments/payment-config.service.ts`

**Ինչ պետք է անել:**

1. [ ] **Ensure returnUrl is properly named**
   - Check if it should be `backUrl` instead
   - Update interfaces if needed

2. [ ] **Add lang field to config** (optional)
   - For payment page language selection

---

### ✅ Step 13: Test Configuration Validation
**Ֆայլ:** `apps/web/app/api/v1/admin/payments/validate/route.ts`

**Ինչ պետք է անել:**

1. [ ] **Ensure testConnection works correctly**
   - Should test with actual API call
   - Should use correct endpoints

---

## 🧪 PHASE 5: Testing

### ✅ Step 14: Test InitPayment
**Ինչ պետք է անել:**

1. [ ] **Test with test credentials**
   - Call InitPayment API
   - Verify response structure
   - Verify PaymentID is returned
   - Verify success criteria works

2. [ ] **Test error cases**
   - Invalid credentials
   - Missing parameters
   - Invalid amount

**Tools:**
- Postman / curl
- Test credentials from bank

---

### ✅ Step 15: Test Payment Flow (End-to-End)
**Ինչ պետք է անել:**

1. [ ] **Complete payment flow test**
   - Create order
   - Initiate payment
   - Redirect to bank's page
   - Complete payment
   - Return to callback
   - Verify order status updated

2. [ ] **Test callback handling**
   - Simulate callback with test parameters
   - Verify GetPaymentDetails is called
   - Verify order status is correct

---

### ✅ Step 16: Test Edge Cases
**Ինչ պետք է անել:**

1. [ ] **Test duplicate callbacks**
   - Customer returns multiple times
   - Ensure idempotency

2. [ ] **Test failed payments**
   - Payment declined
   - Verify error handling

3. [ ] **Test network errors**
   - GetPaymentDetails fails
   - Verify graceful handling

---

## 📝 PHASE 6: Documentation and Cleanup

### ✅ Step 17: Update Code Comments
**Ինչ պետք է անել:**

1. [ ] **Add JSDoc comments** to all functions
2. [ ] **Document error cases**
3. [ ] **Add inline comments** for complex logic

---

### ✅ Step 18: Update README/Progress
**Ինչ պետք է անել:**

1. [ ] **Update PROGRESS.md** with completed tasks
2. [ ] **Document any issues found during testing**
3. [ ] **Update configuration guide** if needed

---

## ✅ Completion Checklist

### Core Integration
- [ ] Step 1: Fix API Endpoints ✅
- [ ] Step 2: Fix InitPayment Request ✅
- [ ] Step 3: Fix InitPayment Response ✅
- [ ] Step 4: Fix GetPaymentDetails Request ✅
- [ ] Step 5: Fix GetPaymentDetails Success Check ✅
- [ ] Step 6: Fix Payment URL ✅
- [ ] Step 7: Fix Status Validation ✅
- [ ] Step 8: Fix initializePayment ✅
- [ ] Step 9: Fix Callback Parameters ✅
- [ ] Step 10: Ensure API Verification ✅
- [ ] Step 11: Fix Error Handling ✅

### Configuration
- [ ] Step 12: Update Config Service ✅
- [ ] Step 13: Test Validation ✅

### Testing
- [ ] Step 14: Test InitPayment ✅
- [ ] Step 15: Test Full Flow ✅
- [ ] Step 16: Test Edge Cases ✅

### Documentation
- [ ] Step 17: Update Comments ✅
- [ ] Step 18: Update Progress ✅

---

## 🎯 Quick Reference

### Critical Files to Modify (in order):
1. `apps/web/lib/services/payments/ameria-client.ts` (Steps 1-6)
2. `apps/web/lib/services/payments/ameria-payment.service.ts` (Steps 7-8)
3. `apps/web/app/api/v1/payments/ameria/callback/route.ts` (Steps 9-11)

### Key Specifications:
- **InitPayment Success:** `ResponseCode === 1 && ResponseMessage === "OK"`
- **GetPaymentDetails Success:** `ResponseCode === "00" && PaymentState === "Successful" && OrderStatus === 2`
- **BackURL:** Not ReturnURL!
- **Parameter name:** `resposneCode` (with typo in API)

### Testing Priority:
1. First: InitPayment API call
2. Second: Payment URL redirect
3. Third: Callback handling
4. Fourth: End-to-end flow

---

**Սկսել Step 0-ից (Documentation Review) և հետո անցնել Step 1-ին!**





