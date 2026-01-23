# AmeriaBank Payment Setup Guide - Admin Panel

**Վերջին թարմացում:** 2024  
**Նպատակ:** Ամբողջությամբ պրոֆեսիոնալ ձևով կարգավորել AmeriaBank payment gateway-ը admin panel-ից

---

## ✅ Նախապատրաստական

### 1. **Ստանալ Test Credentials**
- ✅ Դուք արդեն ստացել եք test credentials AmeriaBank-ից
- Պետք է ունենաք:
  - **Client ID** (Merchant identifier)
  - **Username** (Merchant username)
  - **Password** (Merchant password)

### 2. **Ստուգել, որ կայքը deploy է արած**
- ✅ Կայքը արդեն deploy է արած Vercel-ում
- URL: `https://white-deploy-web-git-main-neetrinos-projects.vercel.app/`

---

## 🚀 Setup Քայլեր (5 րոպե)

### **Քայլ 1: Բացել Admin Panel**
1. Գնալ: `https://white-deploy-web-git-main-neetrinos-projects.vercel.app/admin/payments`
2. Մուտք գործել admin account-ով

### **Քայլ 2: Լրացնել Credentials**
1. **Client ID** - մուտքագրել AmeriaBank-ից ստացած Client ID-ն
2. **Username** - մուտքագրել Username-ը
3. **Password** - մուտքագրել Password-ը

### **Քայլ 3: Ստուգել Callback URL-ները**
- ✅ **Return URL** - ավտոմատ լրացված է: `https://white-deploy-web-git-main-neetrinos-projects.vercel.app/api/v1/payments/ameria/callback`
- ✅ **Callback URL** - ավտոմատ լրացված է (նույնը)
- ⚠️ **Կարևոր:** Եթե URL-ները ճիշտ են, **չփոխել** դրանք

### **Քայլ 4: Ստուգել Test Mode**
- ✅ **Test Mode** - պետք է լինի enabled (checkbox checked)
- ⚠️ **Կարևոր:** Test Mode-ը պետք է enabled լինի test credentials-ի հետ

### **Քայլ 5: Currency**
- ✅ **Currency** - պետք է լինի `AMD` (default)
- Եթե պետք է փոխել, կարող եք մուտքագրել: `EUR`, `USD`, `RUB`

### **Քայլ 6: Save Configuration**
1. Click **"Save"** button
2. Սպասել success message-ին: "Configuration saved successfully. Please validate and activate."

### **Քայլ 7: Validate & Activate**
1. Click **"Validate & Activate"** button
2. Սպասել validation-ին (մոտ 5-10 վայրկյան)
3. Եթե success:
   - ✅ Green message: "Connection validated successfully! Payment system is now active."
   - ✅ Status badge-ը կփոխվի "Active" (green)
4. Եթե error:
   - ❌ Red message-ում կտեսնեք error-ի մանրամասները
   - Ստուգել credentials-ները և կրկին փորձել

---

## 🧪 Testing (Payment Flow)

### **Քայլ 1: Գնալ Checkout Page**
1. Գնալ: `https://white-deploy-web-git-main-neetrinos-projects.vercel.app/checkout`
2. Ավելացնել ապրանքներ cart-ում (եթե չկան)

### **Քայլ 2: Լրացնել Checkout Form**
1. **Contact Information:**
   - First Name
   - Last Name
   - Email
   - Phone

2. **Shipping Method:**
   - Pickup (Store Pickup) - ավելի հեշտ է test-ի համար
   - կամ Delivery (եթե ուզում եք test անել shipping-ը)

3. **Payment Method:**
   - ✅ **Select "Ameria Bank"** (ոչ Cash on Delivery)

### **Քայլ 3: Place Order**
1. Click **"Place Order"** button
2. Պետք է redirect լինի AmeriaBank payment page-ին
3. URL-ը պետք է լինի: `https://servicestest.ameriabank.am/VPOS/Payments/Pay?id=...&lang=en`

### **Քայլ 4: Test Payment**
1. **Test Card Number:** (ստանալ AmeriaBank-ից test card details)
   - Սովորաբար test mode-ում կան test card numbers
   - Օրինակ: `4111111111111111` (Visa test card)

2. **Card Details:**
   - Card Number: test card number
   - Expiry Date: ցանկացած ապագա ամսաթիվ (օր. 12/25)
   - CVV: ցանկացած 3 թվանշան (օր. 123)

3. **Complete Payment:**
   - Click "Pay" կամ "Confirm" button
   - Payment-ը պետք է process լինի

### **Քայլ 5: Callback (Automatic)**
1. Payment-ից հետո պետք է ավտոմատ redirect լինի callback URL-ին
2. Callback URL-ը կստուգի payment status-ը API-ով
3. Պետք է redirect լինի order success page-ին:
   - Success: `/orders/{orderNumber}?payment=success`
   - Failed: `/orders/{orderNumber}?payment=failed`

### **Քայլ 6: Verify Order Status**
1. Գնալ order page-ին
2. Ստուգել, որ:
   - ✅ Order status = "confirmed" (եթե payment success)
   - ✅ Payment status = "paid" (եթե payment success)
   - ✅ Order-ը ցուցադրվում է orders list-ում

---

## 🔍 Troubleshooting

### **Problem 1: Validation Failed**
**Symptoms:**
- Red error message: "Connection test failed" կամ "Validation failed"

**Solutions:**
1. ✅ Ստուգել credentials-ները (Client ID, Username, Password)
2. ✅ Ստուգել, որ Test Mode enabled է
3. ✅ Ստուգել, որ Callback URL-ը ճիշտ է
4. ✅ Ստուգել network connection-ը
5. ✅ Կապ հաստատել AmeriaBank support-ի հետ, եթե credentials-ները ճիշտ են

### **Problem 2: Payment Not Redirecting**
**Symptoms:**
- Click "Place Order" - չի redirect լինում payment page-ին

**Solutions:**
1. ✅ Ստուգել, որ payment system-ը Active է (green badge)
2. ✅ Ստուգել browser console-ում errors
3. ✅ Ստուգել, որ order-ը ստեղծվել է (orders list-ում)
4. ✅ Ստուգել network tab-ում API calls

### **Problem 3: Callback Not Working**
**Symptoms:**
- Payment-ից հետո չի redirect լինում callback URL-ին
- կամ redirect է լինում, բայց order status-ը չի update լինում

**Solutions:**
1. ✅ Ստուգել, որ Callback URL-ը accessible է internet-ից
2. ✅ Ստուգել browser console-ում errors
3. ✅ Ստուգել server logs-ում callback handler errors
4. ✅ Ստուգել, որ GetPaymentDetails API call-ը աշխատում է

### **Problem 4: Order Status Not Updating**
**Symptoms:**
- Payment success է, բայց order status-ը մնում է "pending"

**Solutions:**
1. ✅ Ստուգել callback handler logs-ում
2. ✅ Ստուգել, որ GetPaymentDetails API-ն return է անում success status
3. ✅ Ստուգել database-ում order-ի paymentStatus field-ը
4. ✅ Manually verify payment-ը admin panel-ում

---

## 📊 Admin Panel Features

### **Status Badge**
- 🟢 **Active** (green) - Payment system-ը ակտիվ է և աշխատում է
- ⚪ **Inactive** (gray) - Payment system-ը inactive է

### **Buttons**
1. **Save** - Պահպանում է configuration-ը (առանց activation-ի)
2. **Validate & Activate** - Ստուգում է connection-ը և activate է անում (եթե success)
3. **Deactivate** - Deactivate է անում payment system-ը

### **Auto-Detection**
- ✅ **Callback URL** - ավտոմատ detect է լինում current domain-ից
- ✅ **Return URL** - նույնը, ինչ Callback URL
- ⚠️ **Կարևոր:** Եթե deploy եք արել custom domain-ով, URL-ները ավտոմատ update կլինեն

---

## 🔐 Security Notes

### **Password Encryption**
- ✅ Password-ները encrypted են պահվում database-ում
- ✅ Encryption key-ը պետք է լինի environment variable-ում (`PAYMENT_ENCRYPTION_KEY`)

### **Environment Variables**
- ⚠️ **Vercel-ում պետք է ստուգել:**
  - `PAYMENT_ENCRYPTION_KEY` - encryption key password-ների համար
  - `NEXT_PUBLIC_APP_URL` - (optional) base URL-ի համար

### **Test vs Production**
- ✅ **Test Mode** - օգտագործել test credentials-ների հետ
- ⚠️ **Production Mode** - միայն production credentials-ների հետ
- ⚠️ **Կարևոր:** Production mode-ում պետք է ունենալ production credentials

---

## 📝 Checklist

### **Setup Checklist:**
- [ ] Admin panel-ում մուտք գործել
- [ ] Client ID մուտքագրել
- [ ] Username մուտքագրել
- [ ] Password մուտքագրել
- [ ] Callback URL-ները ստուգել (ավտոմատ լրացված)
- [ ] Test Mode enabled
- [ ] Currency = AMD
- [ ] Click "Save"
- [ ] Click "Validate & Activate"
- [ ] Status = Active (green badge)

### **Testing Checklist:**
- [ ] Checkout page-ում ապրանք ավելացնել
- [ ] Checkout form-ը լրացնել
- [ ] Payment Method = Ameria Bank
- [ ] Click "Place Order"
- [ ] Redirect to AmeriaBank payment page
- [ ] Test payment complete անել
- [ ] Callback redirect (automatic)
- [ ] Order status = confirmed
- [ ] Payment status = paid

---

## 🎯 Success Criteria

### **Setup Success:**
- ✅ Configuration saved successfully
- ✅ Validation successful
- ✅ Status = Active (green badge)

### **Payment Flow Success:**
- ✅ Order created
- ✅ Redirect to payment page
- ✅ Payment completed
- ✅ Callback received
- ✅ Order status updated to "confirmed"
- ✅ Payment status updated to "paid"

---

## 📞 Support

### **AmeriaBank Support:**
- Եթե credentials-ները չեն աշխատում, կապ հաստատել AmeriaBank support-ի հետ
- Test credentials-ները պետք է աշխատեն test mode-ում

### **Technical Support:**
- Եթե technical issues կան, ստուգել:
  1. Browser console-ում errors
  2. Network tab-ում API calls
  3. Server logs-ում errors
  4. Database-ում order/payment records

---

## ✅ Ամփոփում

**Ինչ պետք է անել:**
1. ✅ Admin panel-ում մուտք գործել
2. ✅ Credentials-ները մուտքագրել
3. ✅ Save անել
4. ✅ Validate & Activate անել
5. ✅ Test payment անել checkout page-ում

**Ինչ ավտոմատ է:**
- ✅ Callback URL detection
- ✅ Payment initialization
- ✅ Callback handling
- ✅ Order status update
- ✅ Payment status update

**Ինչ պետք է ստուգել:**
- ⚠️ Credentials-ները ճիշտ են
- ⚠️ Test Mode enabled է
- ⚠️ Callback URL-ները ճիշտ են
- ⚠️ Payment flow-ը աշխատում է

---

**Վերջին թարմացում:** 2024  
**Status:** ✅ Ready for Setup



