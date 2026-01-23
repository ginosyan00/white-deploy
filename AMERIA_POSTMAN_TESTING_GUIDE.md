# Ameria Bank API - Postman-ով թեստ անելու մանրամասն ուղեցույց

## 📋 Նախապատրաստական քայլեր

### 1. Postman-ի տեղադրում
- Եթե Postman-ը չունեք, ներբեռնեք [postman.com](https://www.postman.com/downloads/)
- Կամ օգտագործեք Postman Web version

### 2. Պահանջվող տվյալներ (Ameria Bank-ից)
Ձեզ պետք են հետևյալ տվյալները:
- ✅ **ClientID** - ձեր Client ID-ն
- ✅ **Username** - ձեր username-ը
- ✅ **Password** - ձեր password-ը
- ✅ **BackURL** - callback URL-ը (օրինակ: `https://yoursite.com/api/v1/payments/ameria/callback`)

---

## 🚀 Քայլ առ քայլ հրահանգներ

### **ՔԱՅԼ 1: Postman-ում նոր Collection ստեղծել**

1. Բացեք Postman-ը
2. Կտտացրեք **"New"** կոճակը (վերևի ձախ անկյունում)
3. Ընտրեք **"Collection"**
4. Անվանեք collection-ը: `Ameria Bank API Tests`
5. Սեղմեք **"Create"**

---

### **ՔԱՅԼ 2: Environment Variables ստեղծել**

1. Կտտացրեք **"Environments"** (ձախ մենյուում)
2. Կտտացրեք **"+"** կոճակը (նոր environment ստեղծելու համար)
3. Անվանեք: `Ameria Bank Test`
4. Ավելացրեք հետևյալ variables-ները:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `https://servicestest.ameriabank.am/VPOS` | `https://servicestest.ameriabank.am/VPOS` |
| `client_id` | `YOUR_CLIENT_ID` | `YOUR_CLIENT_ID` |
| `username` | `YOUR_USERNAME` | `YOUR_USERNAME` |
| `password` | `YOUR_PASSWORD` | `YOUR_PASSWORD` |
| `back_url` | `https://yoursite.com/api/v1/payments/ameria/callback` | `https://yoursite.com/api/v1/payments/ameria/callback` |

5. Սեղմեք **"Save"**
6. Ընտրեք environment-ը (վերևի աջ անկյունում)

**⚠️ ԿԱՐԵՎՈՐ:** `YOUR_CLIENT_ID`, `YOUR_USERNAME`, `YOUR_PASSWORD` փոխարինեք ձեր իրական տվյալներով:

---

### **ՔԱՅԼ 3: InitPayment Request ստեղծել**

#### 3.1. Նոր Request ավելացնել

1. Collection-ի վրա աջ կտտացրեք
2. Ընտրեք **"Add Request"**
3. Անվանեք: `1. InitPayment`
4. Սեղմեք **"Save"**

#### 3.2. Request-ի կարգավորում

1. **Method:** Ընտրեք **POST**
2. **URL:** Մուտքագրեք:
   ```
   {{base_url}}/api/VPOS/InitPayment
   ```
   (կամ ուղղակի `https://servicestest.ameriabank.am/VPOS/api/VPOS/InitPayment`)

3. **Headers:**
   - Կտտացրեք **"Headers"** tab-ը
   - Ավելացրեք:
     - **Key:** `Content-Type`
     - **Value:** `application/json; charset=utf-8`

4. **Body:**
   - Կտտացրեք **"Body"** tab-ը
   - Ընտրեք **"raw"**
   - Ընտրեք **"JSON"** (աջ կողմում)
   - Մուտքագրեք հետևյալ JSON-ը:

```json
{
  "ClientID": "{{client_id}}",
  "Username": "{{username}}",
  "Password": "{{password}}",
  "OrderID": 123456789,
  "Amount": 100,
  "Currency": "051",
  "BackURL": "{{back_url}}",
  "Description": "Test payment from Postman",
  "Opaque": "test-order-123",
  "Timeout": 1200
}
```

**📝 Նշումներ:**
- `OrderID` - պետք է լինի unique (յուրաքանչյուր request-ի համար տարբեր)
- `Amount` - test mode-ում նվազագույնը **10 AMD**
- `Currency` - `051` = AMD, `978` = EUR, `840` = USD, `643` = RUB
- `Timeout` - առավելագույնը 1200 վայրկյան (20 րոպե)

#### 3.3. Request-ը ուղարկել

1. Սեղմեք **"Send"** կոճակը
2. Սպասեք response-ին

#### 3.4. Response-ի ստուգում

**✅ Հաջող response (ResponseCode = 1):**
```json
{
  "PaymentID": "abc123xyz456",
  "ResponseCode": 1,
  "ResponseMessage": "OK"
}
```

**❌ Սխալ response (ResponseCode ≠ 1):**
```json
{
  "ResponseCode": 20,
  "ResponseMessage": "Incorrect Username and Password"
}
```

**🔍 Response-ից կարևոր տվյալներ:**
- `PaymentID` - պահեք այս արժեքը, այն կպետքվի հաջորդ request-ների համար
- `ResponseCode` - `1` = հաջող, այլ արժեք = սխալ
- `ResponseMessage` - սխալի նկարագրություն

---

### **ՔԱՅԼ 4: GetPaymentDetails Request ստեղծել**

#### 4.1. Նոր Request ավելացնել

1. Collection-ի վրա աջ կտտացրեք
2. Ընտրեք **"Add Request"**
3. Անվանեք: `2. GetPaymentDetails`
4. Սեղմեք **"Save"**

#### 4.2. Request-ի կարգավորում

1. **Method:** Ընտրեք **POST**
2. **URL:** Մուտքագրեք:
   ```
   {{base_url}}/api/VPOS/GetPaymentDetails
   ```

3. **Headers:**
   - **Key:** `Content-Type`
   - **Value:** `application/json; charset=utf-8`

4. **Body:**
   - Ընտրեք **"raw"** → **"JSON"**
   - Մուտքագրեք:

```json
{
  "Username": "{{username}}",
  "Password": "{{password}}",
  "PaymentID": "PASTE_PAYMENT_ID_HERE"
}
```

**⚠️ ԿԱՐԵՎՈՐ:** 
- `PaymentID` - սա InitPayment-ից ստացած `PaymentID`-ն է
- `ClientID` - **ՉԵՆ** պահանջվում GetPaymentDetails-ում

#### 4.3. Request-ը ուղարկել

1. InitPayment-ից ստացած `PaymentID`-ն պատճենեք
2. Request body-ում `PASTE_PAYMENT_ID_HERE` փոխարինեք
3. Սեղմեք **"Send"**

#### 4.4. Response-ի ստուգում

**✅ Հաջող response (ResponseCode = "00"):**
```json
{
  "ResponseCode": "00",
  "PaymentState": "Successful",
  "OrderStatus": 2,
  "Amount": 100,
  "Currency": "051",
  "PaymentID": "abc123xyz456",
  "OrderID": 123456789,
  "Opaque": "test-order-123",
  "CardNumber": "****1234",
  "DateTime": "2024-01-15T10:30:00"
}
```

**❌ Սխալ response:**
```json
{
  "ResponseCode": "06",
  "PaymentID": "abc123xyz456"
}
```

**🔍 Response-ից կարևոր տվյալներ:**
- `ResponseCode` - `"00"` = հաջող
- `PaymentState` - `"Successful"` = վճարումը հաջող է
- `OrderStatus` - `0-6` (տես documentation)
- `Amount` - վճարված գումար
- `CardNumber` - քարտի համարը (masked)

---

### **ՔԱՅԼ 5: RefundPayment Request ստեղծել**

#### 5.1. Նոր Request ավելացնել

1. Collection-ի վրա աջ կտտացրեք
2. Ընտրեք **"Add Request"**
3. Անվանեք: `3. RefundPayment`
4. Սեղմեք **"Save"**

#### 5.2. Request-ի կարգավորում

1. **Method:** Ընտրեք **POST**
2. **URL:** Մուտքագրեք:
   ```
   {{base_url}}/api/VPOS/RefundPayment
   ```

3. **Headers:**
   - **Key:** `Content-Type`
   - **Value:** `application/json; charset=utf-8`

4. **Body:**
   - Ընտրեք **"raw"** → **"JSON"**
   - Մուտքագրեք:

```json
{
  "PaymentID": "PASTE_PAYMENT_ID_HERE",
  "Username": "{{username}}",
  "Password": "{{password}}",
  "Amount": 50
}
```

**📝 Նշումներ:**
- `Amount` - եթե չեք նշում, կկատարվի **full refund**
- `Amount` - եթե նշեք, կկատարվի **partial refund**

#### 5.3. Request-ը ուղարկել

1. `PaymentID`-ն պատճենեք
2. Սեղմեք **"Send"**

#### 5.4. Response-ի ստուգում

**✅ Հաջող response:**
```json
{
  "ResponseCode": "00",
  "ResponseMessage": "Refund successful",
  "PaymentID": "abc123xyz456"
}
```

---

### **ՔԱՅԼ 6: CancelPayment Request ստեղծել**

#### 6.1. Նոր Request ավելացնել

1. Collection-ի վրա աջ կտտացրեք
2. Ընտրեք **"Add Request"**
3. Անվանեք: `4. CancelPayment`
4. Սեղմեք **"Save"**

#### 6.2. Request-ի կարգավորում

1. **Method:** Ընտրեք **POST**
2. **URL:** Մուտքագրեք:
   ```
   {{base_url}}/api/VPOS/CancelPayment
   ```

3. **Headers:**
   - **Key:** `Content-Type`
   - **Value:** `application/json; charset=utf-8`

4. **Body:**
   - Ընտրեք **"raw"** → **"JSON"**
   - Մուտքագրեք:

```json
{
  "PaymentID": "PASTE_PAYMENT_ID_HERE",
  "Username": "{{username}}",
  "Password": "{{password}}"
}
```

**📝 Նշում:**
- Կարելի է cancel անել միայն 72 ժամվա ընթացքում վճարումից հետո

#### 6.3. Request-ը ուղարկել

1. `PaymentID`-ն պատճենեք
2. Սեղմեք **"Send"**

#### 6.4. Response-ի ստուգում

**✅ Հաջող response:**
```json
{
  "ResponseCode": "00",
  "ResponseMessage": "Payment cancelled",
  "PaymentID": "abc123xyz456"
}
```

---

## 🔄 Թեստային սցենարներ

### **Սցենար 1: Ամբողջական վճարման գործընթաց**

1. **InitPayment** - ստեղծեք վճարում
   - Պահեք `PaymentID`-ն
   - Բացեք payment URL-ը բրաուզերում:
     ```
     https://servicestest.ameriabank.am/VPOS/Payments/Pay?id={{PaymentID}}&lang=en
     ```
   - Կատարեք test payment (օգտագործեք test card)

2. **GetPaymentDetails** - ստուգեք վճարման status-ը
   - Օգտագործեք InitPayment-ից ստացած `PaymentID`-ն

3. **RefundPayment** (optional) - վերադարձրեք գումարը

### **Սցենար 2: Սխալների թեստ**

1. **InitPayment** - սխալ credentials-ով
   - Փոխեք `Password`-ը սխալ արժեքի
   - Սպասվող: `ResponseCode: 20`

2. **InitPayment** - նվազագույն գումարից պակաս
   - Փոխեք `Amount`-ը `5`-ի
   - Սպասվող: սխալ message

3. **GetPaymentDetails** - գոյություն չունեցող PaymentID
   - Օգտագործեք `PaymentID: "invalid123"`
   - Սպասվող: `ResponseCode: "06"`

---

## 📊 Response Codes-ի աղյուսակ

### InitPayment Response Codes

| Code | Նկարագրություն |
|------|----------------|
| `1` | ✅ Հաջող |
| `20` | ❌ Սխալ Username/Password |
| `04` | ❌ Բացակայում է պահանջվող parameter |
| `05` | ❌ Սխալ request parameters |
| `50` | ❌ Սխալ գումար |

### GetPaymentDetails/RefundPayment/CancelPayment Response Codes

| Code | Նկարագրություն |
|------|----------------|
| `"00"` | ✅ Հաջող |
| `"06"` | ❌ Unregistered OrderId/PaymentID |
| `"20"` | ❌ Սխալ Username/Password |
| `"513"` | ❌ Refund permission չկա |
| `"514"` | ❌ Cancel permission չկա |

---

## 💡 Օգտակար խորհուրդներ

### 1. PaymentID-ի ավտոմատ պահում
Postman-ում կարող եք ավտոմատ պահել PaymentID-ն:

1. InitPayment request-ում
2. **Tests** tab-ում ավելացրեք:
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    if (jsonData.PaymentID) {
        pm.environment.set("payment_id", jsonData.PaymentID);
    }
}
```

3. Հաջորդ request-ներում օգտագործեք:
```json
{
  "PaymentID": "{{payment_id}}"
}
```

### 2. OrderID-ի ավտոմատ գեներացիա
```javascript
// Tests tab-ում
pm.environment.set("order_id", Date.now());
```

### 3. Response-ի ավտոմատ ստուգում
```javascript
// Tests tab-ում
pm.test("Response code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("ResponseCode is 1", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.ResponseCode).to.eql(1);
});
```

---

## 🎯 Ամփոփում

**Հաջող թեստի համար անհրաժեշտ է:**

1. ✅ Ճիշտ credentials (ClientID, Username, Password)
2. ✅ Ճիշտ URL (test: `servicestest.ameriabank.am`)
3. ✅ Ճիշտ headers (`Content-Type: application/json; charset=utf-8`)
4. ✅ Ճիշտ JSON format
5. ✅ Unique OrderID (յուրաքանչյուր request-ի համար)
6. ✅ Նվազագույն Amount (test mode-ում 10 AMD)

**Հաջողություն! 🚀**

