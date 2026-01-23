# Ameria Bank Payment Integration - Technical Specification

**Version:** 1.0  
**Date:** 2024  
**Source:** Official Ameria Bank vPOS 3.1 Documentation

---

## 1. Overview

This specification defines the complete integration requirements for Ameria Bank payment gateway based on the official vPOS 3.1 API documentation located in the `@ameria/` folder.

**Key Principle:** Ameria Bank does NOT use server-to-server callbacks. The payment flow relies on user redirect and subsequent API status verification.

---

## 2. API Endpoints

### 2.1 Base URLs

**Test Environment:**
- API Base: `https://servicestest.ameriabank.am/VPOS`
- Payment Page: `https://servicestest.ameriabank.am/VPOS/Payments/Pay`

**Production Environment:**
- API Base: `https://services.ameriabank.am/VPOS`
- Payment Page: `https://services.ameriabank.am/VPOS/Payments/Pay`

### 2.2 API Endpoints

All API endpoints use REST protocol with JSON format:

1. **InitPayment:** `{BASE_URL}/api/VPOS/InitPayment`
2. **GetPaymentDetails:** `{BASE_URL}/api/VPOS/GetPaymentDetails`
3. **ConfirmPayment:** `{BASE_URL}/api/VPOS/ConfirmPayment`
4. **CancelPayment:** `{BASE_URL}/api/VPOS/CancelPayment`
5. **RefundPayment:** `{BASE_URL}/api/VPOS/RefundPayment`

---

## 3. Payment Flow

### 3.1 Complete Payment Flow Diagram

```
1. Customer initiates checkout
   ↓
2. System creates order with status "pending"
   ↓
3. System calls InitPayment API
   ↓
4. Ameria Bank returns PaymentID
   ↓
5. System redirects customer to Ameria Bank payment page
   ↓
6. Customer enters card details and completes payment on bank's page
   ↓
7. Ameria Bank processes payment
   ↓
8. Ameria Bank redirects customer to BackURL (GET request with parameters)
   ↓
9. System receives callback parameters from URL
   ↓
10. System MUST call GetPaymentDetails API to verify payment status
    ↓
11. System updates order status based on verified payment status
    ↓
12. System redirects customer to success/failure page
```

**Critical:** There are NO server-to-server callbacks. Ameria Bank only redirects the user back to your BackURL.

---

## 4. InitPayment Request

### 4.1 Endpoint

**POST** `{BASE_URL}/api/VPOS/InitPayment`

### 4.2 Request Headers

```
Content-Type: application/json; charset=utf-8
```

### 4.3 Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ClientID` | string | Yes | Merchant identifier (provided by bank) |
| `Username` | string | Yes | Merchant username (provided by bank) |
| `Password` | string | Yes | Merchant password (provided by bank) |
| `OrderID` | integer | Yes | Order number (must be unique) |
| `Amount` | decimal | Yes | Payment amount |
| `Currency` | string | No | Transaction currency (ISO code). Default: `051` (AMD). Supported: `051` (AMD), `978` (EUR), `840` (USD), `643` (RUB) |
| `Description` | string | Yes | Transaction description |
| `BackURL` | string | No | URL where customer will be redirected after payment |
| `Opaque` | string | No | Additional data (recommended: store your order ID here) |
| `CardHolderID` | string | No | Identifier for binding transactions (required only for card binding) |
| `Timeout` | integer | No | Session duration in seconds. Maximum: 1200 seconds (20 minutes). Default: 1200 |

### 4.4 OrderID Rules

**According to documentation:**
- OrderID must be an integer
- OrderID must be unique
- **Requires clarification:** Whether OrderID can be reused after cancellation/expiration
- **Requires clarification:** Maximum length/range of OrderID

**Note:** Documentation mentions error code `01: "Order already exists"` - this suggests OrderID uniqueness is enforced.

### 4.5 Request Example

```json
{
  "ClientID": "merchant-client-id",
  "Username": "merchant-username",
  "Password": "merchant-password",
  "OrderID": 12345,
  "Amount": 1000.00,
  "Currency": "051",
  "Description": "Order #12345",
  "BackURL": "https://yourdomain.com/api/payment/ameriabank/callback",
  "Opaque": "order-id-12345",
  "Timeout": 1200
}
```

### 4.6 Response Structure

**Success Response:**
```json
{
  "PaymentID": "15C8E0DE-F082-4785-883E-A5FADB093BE2",
  "ResponseCode": 1,
  "ResponseMessage": "OK"
}
```

**Error Response:**
Response contains `ResponseCode` (integer) and `ResponseMessage` (string). See error codes section.

### 4.7 Success Criteria

Payment initialization is successful when:
- `ResponseCode === 1`
- `ResponseMessage === "OK"`
- `PaymentID` is present and not empty

### 4.8 Payment URL Construction

After successful InitPayment, redirect customer to:

```
{BASE_PAYMENT_URL}/Payments/Pay?id={PaymentID}&lang={lang}
```

Where:
- `id` = PaymentID from InitPayment response
- `lang` = Interface language: `am` (Armenian), `ru` (Russian), `en` (English)

**Example:**
```
https://servicestest.ameriabank.am/VPOS/Payments/Pay?id=15C8E0DE-F082-4785-883E-A5FADB093BE2&lang=en
```

---

## 5. Customer Redirect and Callback Handling

### 5.1 User Redirect Flow

1. Customer is redirected to Ameria Bank payment page
2. Customer enters card details on bank's page
3. Bank processes payment (including 3D Secure if required)
4. Bank redirects customer back to `BackURL` via GET request

### 5.2 BackURL Callback Parameters

**HTTP Method:** GET  
**URL Format:** `{BackURL}?orderID={orderID}&paymentID={paymentID}&resposneCode={code}&currency={currency}&Opaque={opaque}`

**Note:** Parameter name is `resposneCode` (with typo) as per documentation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderID` | string | Yes | Order ID in Ameria Bank system (NOT your order ID) |
| `paymentID` | string | Yes | Payment ID (same as PaymentID from InitPayment response) |
| `resposneCode` | string | Yes | Response code (`"00"` = success, others = error) |
| `currency` | string | Yes | Transaction currency |
| `Opaque` | string | Yes | Additional data (your order ID if you passed it in InitPayment) |

### 5.3 Callback URL Example

```
https://yourdomain.com/api/payment/ameriabank/callback?orderID=105&paymentID=15C8E0DE-F082-4785-883E-A5FADB093BE2&resposneCode=00&currency=051&Opaque=order-id-12345
```

### 5.4 Critical Security Requirement

**DO NOT trust callback URL parameters alone.** Parameters in URL can be manipulated.

**Required Action:** Always verify payment status by calling `GetPaymentDetails` API after receiving callback.

---

## 6. GetPaymentDetails API

### 6.1 Endpoint

**POST** `{BASE_URL}/api/VPOS/GetPaymentDetails`

### 6.2 Request Headers

```
Content-Type: application/json; charset=utf-8
```

### 6.3 Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `PaymentID` | string | Yes | Payment ID from callback or InitPayment response |
| `Username` | string | Yes | Merchant username |
| `Password` | string | Yes | Merchant password |

**Important:** `ClientID` is NOT required in GetPaymentDetails request (unlike InitPayment).

### 6.4 Request Example

```json
{
  "PaymentID": "15C8E0DE-F082-4785-883E-A5FADB093BE2",
  "Username": "merchant-username",
  "Password": "merchant-password"
}
```

### 6.5 Response Structure

| Field | Type | Description |
|-------|------|-------------|
| `ResponseCode` | string | Operation response code (`"00"` = success) |
| `PaymentState` | string | Payment state (see PaymentState values) |
| `OrderStatus` | integer | Order status code (see OrderStatus codes) |
| `Amount` | decimal | Transaction amount |
| `ApprovedAmount` | decimal | Amount blocked on customer's card |
| `DepositedAmount` | decimal | Amount deposited to merchant account |
| `Currency` | string | Transaction currency |
| `OrderID` | integer | Order ID in bank system |
| `Opaque` | string | Additional data (your order ID) |
| `PaymentID` | string | Payment ID |
| `CardNumber` | string | Masked card number (e.g., `****1234`) |
| `ClientName` | string | Cardholder name |
| `ClientEmail` | string | Cardholder email |
| `DateTime` | string | Transaction date/time |
| `ApprovalCode` | string | Transaction authorization code |
| `rrn` | string | Transaction code |
| `TransactionID` | string | Transaction identifier |
| `MerchantId` | string | Merchant identifier |
| `TerminalId` | string | Terminal identifier |
| `Description` | string | Transaction description |
| `TrxnDescription` | string | Transaction description |
| `PaymentType` | integer | Payment type (5=MainRest/Arca, 6=Binding, 7=PayPal) |
| `PrimaryRC` | string | Primary response code |
| `ExpDate` | string | Card expiration date |
| `ProcessingIP` | string | IP address |
| `RefundedAmount` | decimal | Refunded amount |
| `CardHolderID` | string | Card binding identifier |
| `BindingID` | string | Binding identifier |
| `ActionCode` | string | Action code |
| `ExchangeRate` | decimal | Exchange rate |
| `MDOrderID` | string | Payment system identifier |

### 6.6 Success Criteria

Payment is successful when:
- `ResponseCode === "00"`
- `PaymentState === "Successful"`
- `OrderStatus === 2` (payment_deposited)

### 6.7 OrderStatus Codes

According to documentation (Table 2):

| OrderStatus | PaymentState | Description |
|-------------|--------------|-------------|
| 0 | payment_started | Order registered but not paid |
| 1 | payment_approved | Pre-authorization completed (for two-stage payments) |
| 2 | payment_deposited | Payment successfully deposited |
| 3 | payment_void | Authorization cancelled |
| 4 | payment_refunded | Refund transaction completed |
| 5 | payment_autoauthorized | Authorization initiated via issuer bank ACS |
| 6 | payment_declined | Authorization declined |

### 6.8 Response Example

**Successful Payment:**
```json
{
  "ResponseCode": "00",
  "PaymentState": "Successful",
  "OrderStatus": 2,
  "Amount": 1000.00,
  "ApprovedAmount": 1000.00,
  "DepositedAmount": 1000.00,
  "Currency": "051",
  "OrderID": 105,
  "PaymentID": "15C8E0DE-F082-4785-883E-A5FADB093BE2",
  "Opaque": "order-id-12345",
  "CardNumber": "****1234",
  "ClientName": "John Doe",
  "ClientEmail": "john@example.com",
  "DateTime": "2024-01-15 10:30:00",
  "ApprovalCode": "123456",
  "rrn": "123456789012",
  "TransactionID": "TXN123456"
}
```

---

## 7. Callback Handler Implementation

### 7.1 Required Steps

1. Extract parameters from callback URL (GET request)
2. Validate that required parameters are present (`paymentID`, `Opaque`)
3. **MUST:** Call GetPaymentDetails API to verify payment status
4. Map payment status to order status
5. Update order in database
6. Redirect customer to appropriate page (success/failure)

### 7.2 Parameter Extraction

Extract from URL query parameters:
- `orderID` - Bank's order ID (for reference only)
- `paymentID` - Payment ID (required for GetPaymentDetails)
- `resposneCode` - Response code from URL (do NOT trust this alone)
- `currency` - Transaction currency
- `Opaque` - Your order ID (use this to find order in database)

### 7.3 Status Verification

**Always call GetPaymentDetails API** using the `paymentID` from callback URL.

**Do NOT rely on `resposneCode` from URL alone** - it can be manipulated.

### 7.4 Status Mapping

Map GetPaymentDetails response to order status:

| GetPaymentDetails Result | Order Status |
|-------------------------|--------------|
| `ResponseCode === "00"` AND `PaymentState === "Successful"` AND `OrderStatus === 2` | `paid` / `completed` |
| `ResponseCode === "00"` AND `OrderStatus === 1` | `processing` / `on-hold` (two-stage payment) |
| `ResponseCode !== "00"` OR `OrderStatus === 3` OR `OrderStatus === 6` | `failed` / `cancelled` |
| `OrderStatus === 4` | `refunded` |

### 7.5 Error Handling

If GetPaymentDetails API call fails:
- Log the error
- Set order status to `pending` or keep current status
- **Requires clarification:** Should we retry GetPaymentDetails or mark order as failed?

---

## 8. Additional Operations

### 8.1 ConfirmPayment (Two-Stage Payments)

**Endpoint:** POST `{BASE_URL}/api/VPOS/ConfirmPayment`

**Use Case:** For two-stage payments when OrderStatus = 1 (pre-authorized). Confirms and finalizes the payment.

**Request:**
```json
{
  "PaymentID": "payment-id",
  "Username": "merchant-username",
  "Password": "merchant-password",
  "Amount": 1000.00
}
```

**Success:** `ResponseCode === "00"`

**Note:** Two-stage payments are optional. Default flow is single-stage (immediate payment).

### 8.2 CancelPayment

**Endpoint:** POST `{BASE_URL}/api/VPOS/CancelPayment`

**Use Case:** Cancel a payment within 72 hours after payment completion.

**Request:**
```json
{
  "PaymentID": "payment-id",
  "Username": "merchant-username",
  "Password": "merchant-password"
}
```

**Success:** `ResponseCode === "00"`

**Limitation:** Can only cancel payments within 72 hours after payment.

### 8.3 RefundPayment

**Endpoint:** POST `{BASE_URL}/api/VPOS/RefundPayment`

**Use Case:** Refund all or part of a completed payment.

**Request:**
```json
{
  "PaymentID": "payment-id",
  "Username": "merchant-username",
  "Password": "merchant-password",
  "Amount": 500.00
}
```

**Success:** `ResponseCode === "00"`

**Note:** Amount cannot exceed the original transaction amount.

---

## 9. Error Codes

### 9.1 Response Codes

According to documentation (Table 1), common response codes:

| ResponseCode | Description |
|--------------|-------------|
| `00` | Payment successfully completed |
| `01` | Order with the given number is already registered |
| `02` | Order declined due to errors in payment details |
| `03` | Unknown (forbidden) currency |
| `04` | Required parameter of the request is missing |
| `05` | Error in request parameters |
| `06` | Unregistered OrderId |
| `07` | System Error |
| `20` | Incorrect Username and Password |
| `30` | Incorrect Order ID |
| `50` | Payment sum error |
| `500` | Unknown error |
| `510` | Incorrect parameters |
| `513` | Do not have Refund operation permission |
| `514` | Do not have Reverse operation permission |
| `520` | Overtime error |
| `550` | System Error |
| `560` | Operation failed |

**Full error codes list:** See Table 1 in documentation (lines 2612-3038 in vPOS_Arm_3.1.md)

### 9.2 Error Handling Requirements

- Log all error responses with full details
- Map error codes to user-friendly messages
- **Requires clarification:** Should error messages be displayed to customers or only logged?

---

## 10. Test Mode vs Production Mode

### 10.1 Behavior

According to documentation, test mode and production mode work identically:
- Same API structure
- Same request/response format
- Same callback mechanism
- Only difference: URLs and credentials

### 10.2 BackURL Domain Restrictions

**Test Mode:** Can use any domain including:
- `http://localhost:3000`
- `https://test.yourdomain.com`
- `https://yourproject.vercel.app`
- Any temporary domain

**Production Mode:** Can use any domain including:
- `https://yourdomain.com`
- Any valid HTTPS domain

**Important:** No domain registration required with Ameria Bank. BackURL works immediately.

### 10.3 Credentials

- Test mode uses test credentials (provided by bank)
- Production mode uses live credentials (provided by bank)
- Different ClientID, Username, Password for each mode

---

## 11. Implementation Requirements

### 11.1 Required API Calls

1. **InitPayment** - Initialize payment
2. **GetPaymentDetails** - Verify payment status (called from callback handler)

### 11.2 Optional API Calls

1. **ConfirmPayment** - For two-stage payments
2. **CancelPayment** - Cancel payment
3. **RefundPayment** - Process refunds

### 11.3 Required Data Storage

Store the following for each payment:
- `PaymentID` - From InitPayment response (required for GetPaymentDetails)
- `OrderID` - Your internal order ID
- Payment amount, currency, status
- Timestamps (created, completed, failed)

### 11.4 Idempotency

- Customer may return to callback URL multiple times
- Check order status before updating to avoid duplicate processing
- Use GetPaymentDetails to verify actual payment status

### 11.5 Order Identification

**Recommended approach:**
- Store your order ID in `Opaque` field during InitPayment
- Use `Opaque` from callback URL to find order in database
- `orderID` from callback is bank's internal ID (for reference only)

---

## 12. Security Considerations

### 12.1 Critical Requirements

1. **Never trust callback URL parameters alone**
   - Always verify via GetPaymentDetails API
   - URL parameters can be manipulated

2. **Secure credential storage**
   - Store credentials encrypted
   - Never expose credentials in client-side code

3. **Validate all inputs**
   - Validate amount, currency, order ID
   - Sanitize all callback parameters

4. **Logging and auditing**
   - Log all payment operations
   - Store API responses for audit trail
   - Log errors with full context

### 12.2 HTTPS Requirement

**Production:** BackURL must use HTTPS.

**Test:** HTTP (localhost) is acceptable for testing.

---

## 13. Edge Cases and Clarifications Required

### 13.1 Requires Clarification from Documentation

1. **OrderID format:** Maximum length, allowed characters, reuse rules
2. **Timeout handling:** What happens if customer doesn't complete payment within Timeout period?
3. **Duplicate OrderID:** Exact behavior when OrderID already exists
4. **GetPaymentDetails retry:** Should we retry if API call fails?
5. **Pending payments:** How long should we keep orders in "pending" status?
6. **Payment URL expiration:** Does PaymentID expire? If yes, after how long?
7. **Currency validation:** Which currencies are supported besides AMD, EUR, USD, RUB?
8. **Amount precision:** Decimal places allowed for Amount field
9. **Description length:** Maximum length for Description field
10. **Opaque field:** Maximum length, allowed characters

### 13.2 Edge Cases to Handle

1. Customer closes browser before returning to callback
2. Network timeout during GetPaymentDetails call
3. Multiple simultaneous callback requests for same payment
4. Payment completed but callback URL never called (customer didn't return)
5. GetPaymentDetails returns unexpected ResponseCode

**Recommendation:** Implement background job/cron to check status of pending payments periodically.

---

## 14. Response Code Reference

### 14.1 InitPayment Success

- `ResponseCode: 1`
- `ResponseMessage: "OK"`

### 14.2 GetPaymentDetails Success

- `ResponseCode: "00"`
- `PaymentState: "Successful"`
- `OrderStatus: 2`

### 14.3 Common Error Scenarios

| Scenario | ResponseCode | Action |
|----------|--------------|--------|
| Invalid credentials | `20` | Log error, disable payment method |
| Order already exists | `01` | Generate new OrderID and retry |
| Invalid amount | `50` | Validate amount format before request |
| System error | `07`, `550`, `560` | Retry request or mark as failed |
| Missing parameter | `04` | Validate all required fields |

---

## 15. Testing Requirements

### 15.1 Test Scenarios

1. **Successful payment flow:**
   - InitPayment → Get PaymentID → Redirect → Complete payment → Callback → Verify → Update order

2. **Failed payment flow:**
   - InitPayment → Get PaymentID → Redirect → Payment declined → Callback → Verify failure → Update order

3. **Callback without payment:**
   - Simulate callback URL with fake parameters → Verify GetPaymentDetails returns error → Do not update order

4. **Multiple callbacks:**
   - Customer returns multiple times → Verify idempotency → Only process once

5. **Network failure:**
   - GetPaymentDetails fails → Handle gracefully → Do not update order incorrectly

### 15.2 Test Credentials

Test credentials must be obtained from Ameria Bank.

**Note:** Documentation does not specify how to obtain test credentials. Contact bank directly.

---

## 16. Implementation Checklist

### Phase 1: Core Integration

- [ ] Implement InitPayment API call
- [ ] Implement Payment URL construction and redirect
- [ ] Implement callback handler (GET endpoint)
- [ ] Implement GetPaymentDetails API call
- [ ] Implement status mapping logic
- [ ] Implement order status update

### Phase 2: Error Handling

- [ ] Implement error code handling
- [ ] Implement logging for all API calls
- [ ] Implement error response parsing
- [ ] Implement user-friendly error messages

### Phase 3: Additional Features

- [ ] Implement ConfirmPayment (if two-stage payments needed)
- [ ] Implement CancelPayment
- [ ] Implement RefundPayment
- [ ] Implement background status checking for pending payments

### Phase 4: Testing

- [ ] Test successful payment flow
- [ ] Test failed payment flow
- [ ] Test callback idempotency
- [ ] Test error scenarios
- [ ] Test with test credentials

---

## 17. API Request/Response Examples

### 17.1 Complete Flow Example

**Step 1: InitPayment**
```json
POST https://servicestest.ameriabank.am/VPOS/api/VPOS/InitPayment
Content-Type: application/json; charset=utf-8

{
  "ClientID": "test-client-id",
  "Username": "test-username",
  "Password": "test-password",
  "OrderID": 12345,
  "Amount": 1500.50,
  "Currency": "051",
  "Description": "Order #12345",
  "BackURL": "https://yourdomain.com/api/payment/ameriabank/callback",
  "Opaque": "order-12345",
  "Timeout": 1200
}

Response:
{
  "PaymentID": "15C8E0DE-F082-4785-883E-A5FADB093BE2",
  "ResponseCode": 1,
  "ResponseMessage": "OK"
}
```

**Step 2: Redirect Customer**
```
Redirect to: https://servicestest.ameriabank.am/VPOS/Payments/Pay?id=15C8E0DE-F082-4785-883E-A5FADB093BE2&lang=en
```

**Step 3: Callback Received**
```
GET https://yourdomain.com/api/payment/ameriabank/callback?orderID=105&paymentID=15C8E0DE-F082-4785-883E-A5FADB093BE2&resposneCode=00&currency=051&Opaque=order-12345
```

**Step 4: Verify Payment**
```json
POST https://servicestest.ameriabank.am/VPOS/api/VPOS/GetPaymentDetails
Content-Type: application/json; charset=utf-8

{
  "PaymentID": "15C8E0DE-F082-4785-883E-A5FADB093BE2",
  "Username": "test-username",
  "Password": "test-password"
}

Response:
{
  "ResponseCode": "00",
  "PaymentState": "Successful",
  "OrderStatus": 2,
  "Amount": 1500.50,
  "DepositedAmount": 1500.50,
  "Currency": "051",
  "PaymentID": "15C8E0DE-F082-4785-883E-A5FADB093BE2",
  "Opaque": "order-12345",
  "CardNumber": "****1234",
  "ClientName": "John Doe",
  "TransactionID": "TXN123456"
}
```

---

## 18. Summary

### 18.1 Key Points

1. **No server-to-server callbacks** - Only user redirect to BackURL
2. **Always verify via GetPaymentDetails** - Never trust URL parameters alone
3. **BackURL can be any domain** - No registration required, localhost works for testing
4. **Test and production work identically** - Only URLs and credentials differ
5. **Payment verification is mandatory** - Must call GetPaymentDetails after callback

### 18.2 Critical Fields

- **InitPayment:** Use `BackURL` (not ReturnURL), store order ID in `Opaque`
- **GetPaymentDetails:** Do NOT include `ClientID` in request
- **Callback:** Parameter name is `resposneCode` (with typo)
- **Success:** InitPayment: `ResponseCode === 1`, GetPaymentDetails: `ResponseCode === "00"` AND `PaymentState === "Successful"`

---

**Document Status:** Final specification based on official Ameria Bank vPOS 3.1 documentation  
**Last Updated:** 2024  
**Source Files:** `ameria/vPOS_Arm_3.1.md`, `ameria/AMERIABANK_COMPLETE_ANALYSIS.md`, `ameria/AMERIABANK_ARCA_CALLBACK_AND_DOMAINS.md`







