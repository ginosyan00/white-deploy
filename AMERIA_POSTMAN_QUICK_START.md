# 🚀 Ameria Bank API - Postman Quick Start

## ⚡ 5 րոպեում սկսելու համար

### 1️⃣ Import Collection և Environment

1. Բացեք Postman-ը
2. Կտտացրեք **"Import"** (վերևի ձախ անկյունում)
3. Import արեք 2 ֆայլերը:
   - `Ameria_Bank_API.postman_collection.json` → Collection
   - `Ameria_Bank_Test.postman_environment.json` → Environment

### 2️⃣ Environment-ի կարգավորում

1. Կտտացրեք **"Environments"** (ձախ մենյուում)
2. Ընտրեք **"Ameria Bank Test"**
3. Փոխեք հետևյալ արժեքները:

```
client_id    → ձեր ClientID-ն
username      → ձեր Username-ը
password      → ձեր Password-ը
back_url      → ձեր callback URL-ը
```

4. Սեղմեք **"Save"**
5. Վերևի աջ անկյունում ընտրեք **"Ameria Bank Test"** environment-ը

### 3️⃣ Առաջին Request-ի ուղարկում

1. Collection-ում բացեք **"1. InitPayment"**
2. Սեղմեք **"Send"**
3. Ստուգեք response-ը:

**✅ Հաջող:**
```json
{
  "PaymentID": "abc123...",
  "ResponseCode": 1,
  "ResponseMessage": "OK"
}
```

**❌ Սխալ:**
```json
{
  "ResponseCode": 20,
  "ResponseMessage": "Incorrect Username and Password"
}
```

### 4️⃣ PaymentID-ի օգտագործում

InitPayment-ից ստացած `PaymentID`-ն ավտոմատ պահվում է environment-ում:

1. Բացեք **"2. GetPaymentDetails"**
2. `PaymentID`-ն արդեն կլինի request body-ում (`{{payment_id}}`)
3. Սեղմեք **"Send"**

---

## 📝 Կարևոր նշումներ

### ✅ InitPayment-ի համար
- `OrderID` - ավտոմատ գեներացվում է (unique)
- `Amount` - նվազագույնը **10 AMD** (test mode-ում)
- `Currency` - `051` = AMD

### ✅ GetPaymentDetails-ի համար
- `ClientID` - **ՉԵՆ** պահանջվում
- `PaymentID` - ավտոմատ լցվում է InitPayment-ից

### ✅ Payment URL-ը բրաուզերում բացելու համար
```
https://servicestest.ameriabank.am/VPOS/Payments/Pay?id={{payment_id}}&lang=en
```

---

## 🔍 Response Codes

| Code | Նշանակություն |
|------|----------------|
| `1` (InitPayment) | ✅ Հաջող |
| `"00"` (Other) | ✅ Հաջող |
| `20` | ❌ Սխալ credentials |
| `06` | ❌ PaymentID չի գտնվել |

---

## 📚 Ավելի մանրամասն հրահանգների համար

Տես `AMERIA_POSTMAN_TESTING_GUIDE.md` ֆայլը:

---

**Հաջողություն! 🎉**

