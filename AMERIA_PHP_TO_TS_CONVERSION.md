# PHP → TypeScript փոխարկում - Ameria Bank Integration

## 📋 Ներածություն

Այս փաստաթուղթը ցույց է տալիս, թե ինչ օգտակար բաներ կարող ենք վերցնել PHP կոդերից և փոխարկել TypeScript:

---

## ✅ Օգտակար բաներ PHP կոդերից

### 1. **Callback Handler** (`main.php:1285-1361`) ⭐⭐⭐⭐⭐

**Շատ կարևոր!** Այս կոդը ցույց է տալիս ճիշտ callback handling:

```php
public function webhook_ameriabank_response()
{
    $order = wc_get_order(sanitize_text_field($_GET['opaque']));
    $args = [
        "PaymentID" => sanitize_text_field($_GET['paymentID']),
        "Username" => $this->user_name,
        "Password" => $this->password,
    ];

    $response = wp_remote_post($this->api_url . 'api/VPOS/GetPaymentDetails', [
        'headers' => array('Content-Type' => 'application/json; charset=utf-8'),
        'body' => json_encode($args),
        'method' => 'POST'
    ]);

    if (!is_wp_error($response)) {
        $body = json_decode($response['body']);
        
        if ($body->ResponseCode == '00') {
            // Success
            $order->update_status($this->successOrderStatus);
        } else {
            // Error handling with translated messages
        }
    }
}
```

**Ինչ սովորեցինք:**
- ✅ Callback-ում ստանում ենք `$_GET['opaque']` - order ID
- ✅ Callback-ում ստանում ենք `$_GET['paymentID']` - payment ID
- ✅ **Միշտ** ստուգում ենք status-ը `GetPaymentDetails` API-ով
- ✅ Success = `ResponseCode == '00'`
- ✅ `GetPaymentDetails` request-ում **Չկա** `ClientID`, միայն `Username`, `Password`, `PaymentID`

---

### 2. **InitPayment Request** (`main.php:670-714`) ⭐⭐⭐⭐⭐

**Շատ կարևոր!** Այս կոդը ցույց է տալիս ճիշտ InitPayment request:

```php
$args = [
    "ClientID" => $this->clientID,
    "Amount" => $amount,
    "OrderID" => ($this->testmode == true) ? rand(1000000, 2346000) : $order_id,
    "BackURL" => get_site_url() . '/wc-api/ameriabank_response',
    "Username" => $this->user_name,
    "Password" => $this->password,
    "Description" => '',
    "Currency" => $this->currency_code,
    "Opaque" => $order_id,  // ⭐ Order ID պահում ենք Opaque-ում
    "language" => $this->language,
];

$response = wp_remote_post($this->api_url . 'api/VPOS/InitPayment', [
    'headers' => array('Content-Type' => 'application/json; charset=utf-8'),
    'body' => json_encode($args),
    'method' => 'POST'
]);

if ($body->ResponseCode == 1 && $body->ResponseMessage === "OK") {
    // Redirect to payment page
    return $this->api_url . "/Payments/Pay?id=" . $body->PaymentID . "&lang=" . $this->language;
}
```

**Ինչ սովորեցինք:**
- ✅ **BackURL** (ոչ ReturnURL!) օգտագործում ենք
- ✅ Endpoint: `api/VPOS/InitPayment`
- ✅ `Opaque` field-ում պահում ենք order ID
- ✅ Success = `ResponseCode == 1 && ResponseMessage === "OK"`
- ✅ Payment URL: `/Payments/Pay?id={PaymentID}&lang={lang}`

---

### 3. **OrderStatus Codes** (`main.php:154-211`) ⭐⭐⭐⭐

**Շատ օգտակար!** OrderStatus codes-երի mapping:

```php
if ($body->OrderStatus == 1) {
    // Two-stage payment: Approved (blocked)
    $order->update_status($this->successOrderStatus);
}
if ($body->OrderStatus == 2) {
    // Successfully paid
    $order->update_status($this->successOrderStatus);
}
if ($body->OrderStatus == 3) {
    // Cancelled
    $order->update_status('cancelled');
}
if ($body->OrderStatus == 4) {
    // Refunded
    $order->update_status('refund');
}
if ($body->OrderStatus == 6) {
    // Failed
    $order->update_status('cancelled');
}
```

**Ինչ սովորեցինք:**
- `1` = Approved (two-stage payment)
- `2` = Successfully paid
- `3` = Cancelled
- `4` = Refunded
- `6` = Failed

---

### 4. **Error Codes** (`errorCodes.php`) ⭐⭐⭐⭐⭐

**Շատ օգտակար!** Բոլոր error codes-երի թարգմանությունները:

```php
$bankErrorCodesByDiffLanguageAmeria = [
    'am' => [
        '00' => 'Վճարումը հաջողությամբ իրականացվել է:',
        '01' => 'Նշված համարով պատվերն արդեն գրանցված է համակարգում:',
        // ... ավելի շատ codes
    ],
    'ru' => [...],
    'en' => [...],
];
```

**Ինչ սովորեցինք:**
- Կարող ենք ստեղծել TypeScript enum/object error codes-երի համար
- Support բազմալեզու error messages

---

### 5. **ConfirmPayment** (`main.php:287-334`) ⭐⭐⭐

**Օգտակար!** Two-stage payment confirmation:

```php
public function confirmPayment($order_id, $new_status)
{
    $PaymentID = get_post_meta($order_id, 'PaymentID', true);
    $amount = ($this->testmode == true) ? 10.0 : floatval($order->get_total());
    $args = [
        'PaymentID' => $PaymentID,
        'Username' => $this->user_name,
        'Password' => $this->password,
        'Amount' => $amount,
    ];
    
    $response = wp_remote_post($this->api_url . 'api/VPOS/ConfirmPayment', [
        'headers' => array('Content-Type' => 'application/json; charset=utf-8'),
        'body' => json_encode($args),
        'method' => 'POST'
    ]);
    
    if ($body->ResponseCode == '00') {
        // Success
    }
}
```

---

### 6. **CancelPayment** (`main.php:342-398`) ⭐⭐⭐

**Օգտակար!** Payment cancellation (72 ժամվա ընթացքում):

```php
public function cancelPayment($order_id, $old_status = '')
{
    if ($hourDiff < 72) {
        $args = [
            'PaymentID' => $PaymentID,
            'Username' => $this->user_name,
            'Password' => $this->password,
        ];
        
        $response = wp_remote_post($this->api_url . 'api/VPOS/CancelPayment', [
            // ...
        ]);
    }
}
```

---

### 7. **RefundPayment** (`main.php:416-451`) ⭐⭐⭐

**Օգտակար!** Refund logic:

```php
public function process_refund($order_id, $amount = null, $reason = '')
{
    $args = [
        'PaymentID' => $PaymentID,
        'Username' => $this->user_name,
        'Password' => $this->password,
        'Amount' => $amount,
    ];
    
    $response = wp_remote_post($this->api_url . 'api/VPOS/RefundPayment', [
        // ...
    ]);
    
    if ($body->ResponseCode == '00') {
        // Success
    }
}
```

---

### 8. **Currency Mapping** (`main.php:22`) ⭐⭐⭐

**Օգտակար!** Currency codes mapping:

```php
private $currencies = [
    'AMD' => '051', 
    'RUB' => '643', 
    'USD' => '840', 
    'EUR' => '978', 
    'SEK' => '752'
];
```

---

### 9. **Payment URL Construction** (`main.php:703`) ⭐⭐⭐⭐⭐

**Շատ կարևոր!** Payment URL format:

```php
return $this->api_url . "/Payments/Pay?id=" . $body->PaymentID . "&lang=" . $this->language;
```

**Ինչ սովորեցինք:**
- URL format: `/Payments/Pay?id={PaymentID}&lang={lang}`
- `lang` parameter-ը կարևոր է!

---

## 🔄 TypeScript փոխարկում

### 1. Error Codes Service

**Ստեղծել:** `apps/web/lib/services/payments/ameria-error-codes.ts`

```typescript
export const AmeriaErrorCodes = {
  am: {
    '00': 'Վճարումը հաջողությամբ իրականացվել է:',
    '01': 'Նշված համարով պատվերն արդեն գրանցված է համակարգում:',
    // ... ավելի շատ codes
  },
  ru: {
    '00': 'Платеж успешно завершен',
    // ...
  },
  en: {
    '00': 'Payment successfully completed',
    // ...
  },
} as const;

export function getErrorMessage(
  code: string, 
  language: 'am' | 'ru' | 'en' = 'en'
): string {
  return AmeriaErrorCodes[language]?.[code] || 
         AmeriaErrorCodes.en[code] || 
         `Unknown error code: ${code}`;
}
```

---

### 2. OrderStatus Enum

**Ստեղծել:** `apps/web/lib/services/payments/ameria-types.ts`

```typescript
export enum AmeriaOrderStatus {
  REGISTERED = 0,      // payment_started
  APPROVED = 1,        // payment_approved (two-stage)
  DEPOSITED = 2,       // payment_deposited (success)
  CANCELLED = 3,       // payment_void
  REFUNDED = 4,        // payment_refunded
  AUTO_AUTHORIZED = 5, // payment_autoauthorized
  FAILED = 6,          // payment_declined
}

export function mapOrderStatusToPaymentStatus(
  orderStatus: number
): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' {
  switch (orderStatus) {
    case AmeriaOrderStatus.APPROVED:
    case AmeriaOrderStatus.DEPOSITED:
      return 'completed';
    case AmeriaOrderStatus.CANCELLED:
      return 'cancelled';
    case AmeriaOrderStatus.REFUNDED:
      return 'refunded';
    case AmeriaOrderStatus.FAILED:
      return 'failed';
    default:
      return 'pending';
  }
}
```

---

### 3. Currency Mapping

**Ավելացնել:** `apps/web/lib/services/payments/ameria-client.ts`

```typescript
export const AMERIA_CURRENCY_CODES: Record<string, string> = {
  'AMD': '051',
  'RUB': '643',
  'USD': '840',
  'EUR': '978',
  'SEK': '752',
  'GBP': '826',
};

export function getCurrencyCode(currency: string): string {
  return AMERIA_CURRENCY_CODES[currency] || '051'; // Default to AMD
}
```

---

### 4. Updated Callback Handler

**Թարմացնել:** `apps/web/app/api/v1/payments/ameria/callback/route.ts`

```typescript
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  
  // Extract callback parameters (PHP-ից սովորեցինք)
  const orderId = searchParams.get('Opaque'); // ⭐ order ID
  const paymentID = searchParams.get('paymentID'); // ⭐ payment ID
  const responseCode = searchParams.get('resposneCode'); // ⭐ (typo in API)
  const opaque = searchParams.get('Opaque');
  
  if (!paymentID || !opaque) {
    return NextResponse.redirect(new URL('/checkout?error=invalid_callback', req.url));
  }
  
  // ⭐ Միշտ ստուգում ենք status-ը GetPaymentDetails-ով
  const result = await ameriaPaymentService.handleCallback({
    PaymentID: paymentID,
    Opaque: opaque,
  });
  
  // Redirect
  const redirectUrl = result.success
    ? `/orders/${result.orderId}?payment=success`
    : `/orders/${result.orderId}?payment=failed`;
    
  return NextResponse.redirect(new URL(redirectUrl, req.url));
}
```

---

### 5. Updated InitPayment

**Թարմացնել:** `apps/web/lib/services/payments/ameria-client.ts`

```typescript
async initPayment(params: {
  orderId: string;
  amount: number;
  currency: string;
  description?: string;
  opaque?: string;
  lang?: string; // ⭐ ավելացնել
}): Promise<InitPaymentResponse> {
  const request = {
    ClientID: this.config.clientId,
    Username: this.config.username,
    Password: this.config.password,
    OrderID: params.orderId,
    Amount: params.amount,
    Currency: getCurrencyCode(params.currency), // ⭐ ISO code
    BackURL: this.config.returnUrl, // ⭐ BackURL, ոչ ReturnURL
    Description: params.description || '',
    Opaque: params.opaque || params.orderId, // ⭐ order ID
    language: params.lang || 'en', // ⭐ lang parameter
  };
  
  const response = await fetch(`${this.baseUrl}/api/VPOS/InitPayment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(request),
  });
  
  const data = await response.json();
  
  // ⭐ PHP-ից սովորեցինք
  if (data.ResponseCode === 1 && data.ResponseMessage === "OK") {
    return data;
  }
  
  throw new Error(data.ResponseMessage || 'Payment initialization failed');
}

getPaymentUrl(paymentId: string, lang: string = 'en'): string {
  const paymentBaseUrl = this.config.testMode
    ? 'https://servicestest.ameriabank.am/VPOS/Payments/Pay'
    : 'https://services.ameriabank.am/VPOS/Payments/Pay';
  
  // ⭐ PHP-ից սովորեցինք ճիշտ format
  return `${paymentBaseUrl}?id=${paymentId}&lang=${lang}`;
}
```

---

### 6. Updated GetPaymentDetails

**Թարմացնել:** `apps/web/lib/services/payments/ameria-client.ts`

```typescript
async getPaymentDetails(paymentId: string): Promise<PaymentDetailsResponse> {
  // ⭐ PHP-ից սովորեցինք - ClientID չի պետք
  const request = {
    Username: this.config.username,
    Password: this.config.password,
    PaymentID: paymentId,
  };
  
  const response = await fetch(`${this.baseUrl}/api/VPOS/GetPaymentDetails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(request),
  });
  
  const data = await response.json();
  
  // ⭐ PHP-ից սովորեցինք
  // Success = ResponseCode === '00'
  // PaymentState === 'Successful'
  
  return data;
}
```

---

## 📝 Կարևոր փաստեր PHP կոդից

1. ✅ **BackURL** (ոչ ReturnURL) օգտագործվում է
2. ✅ **GetPaymentDetails** request-ում **չկա** ClientID
3. ✅ Callback-ում ստանում ենք `Opaque` - order ID
4. ✅ Callback-ում ստանում ենք `paymentID` (lowercase)
5. ✅ Success check: `ResponseCode === '00'` (GetPaymentDetails)
6. ✅ Success check: `ResponseCode === 1 && ResponseMessage === "OK"` (InitPayment)
7. ✅ Payment URL: `/Payments/Pay?id={PaymentID}&lang={lang}`
8. ✅ `Opaque` field-ում պահում ենք order ID
9. ✅ OrderStatus mapping: 2 = success, 3 = cancelled, 4 = refunded, 6 = failed

---

## 🎯 Առաջարկվող փոփոխություններ

1. **Ստեղծել Error Codes Service** - օգտագործել `errorCodes.php`-ից
2. **Ստեղծել OrderStatus Enum** - օգտագործել PHP կոդից
3. **Թարմացնել Callback Handler** - օգտագործել `webhook_ameriabank_response()` logic-ը
4. **Թարմացնել InitPayment** - օգտագործել PHP-ի ճիշտ structure-ը
5. **Թարմացնել GetPaymentDetails** - հեռացնել ClientID

---

**Եզրակացություն:** PHP կոդերը **շատ օգտակար** են և ցույց են տալիս **ճիշտ** implementation-ը:







