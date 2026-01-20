# 🚀 Ինչպես Run անել Scripts-ները

## 📋 Validation Scripts

### 1. Route Validation (File Structure Check)

Այս script-ը ստուգում է, որ բոլոր routes, services, middleware-ները գոյություն ունեն:

```bash
# Windows PowerShell
cd White-Shop\White-Shop
node scripts\validate-routes.js

# Linux/Mac
cd White-Shop/White-Shop
node scripts/validate-routes.js
```

**Արդյունք:**
- ✅ ցույց է տալիս, թե որ routes-ները գոյություն ունեն
- ✅ ցույց է տալիս, թե որ services-ները գոյություն ունեն
- ✅ ցույց է տալիս, թե middleware-ները գոյություն ունեն
- ✅ ցույց է տալիս Prisma package-ի status-ը

---

### 2. API Routes Testing (Runtime Testing)

Այս script-ը test-ում է API endpoints-ները (պահանջում է dev server):

```bash
# 1. Նախ start արեք dev server-ը (մի terminal-ում)
cd White-Shop\White-Shop
npm run dev

# 2. Այլ terminal-ում run արեք test script-ը
cd White-Shop\White-Shop
node scripts\test-api-routes.js
```

**Նշում:** Այս script-ը պահանջում է, որ:
- Development server-ը աշխատի (`npm run dev`)
- Database-ը setup լինի
- Environment variables-ները configured լինեն

---

### 3. Cleanup Script (Old Backend Removal)

Այս script-ը ջնջում է հին backend files-ները:

```bash
# Preview (dry run) - ցույց է տալիս, թե ինչ կջնջվի
cd White-Shop\White-Shop
node scripts\cleanup-old-backend.js --dry-run

# Actually delete files
cd White-Shop\White-Shop
node scripts\cleanup-old-backend.js
```

**⚠️ Warning:** Cleanup script-ը ջնջում է files-ները permanently!

---

## 🧪 Quick Test Commands

### Test File Structure
```bash
cd White-Shop\White-Shop
node scripts\validate-routes.js
```

### Test API Routes (requires dev server)
```bash
# Terminal 1: Start server
cd White-Shop\White-Shop
npm run dev

# Terminal 2: Run tests
cd White-Shop\White-Shop
node scripts\test-api-routes.js
```

---

## 📊 Expected Results

### validate-routes.js Output:
```
🔍 Validating Next.js API Routes...

📁 Checking API Routes:
  ✅ auth/register/route.ts
  ✅ auth/login/route.ts
  ✅ categories/tree/route.ts
  ... (24 routes total)

📦 Checking Services:
  ✅ lib/services/auth.service.ts
  ✅ lib/services/categories.service.ts
  ... (9 services total)

🔐 Checking Middleware:
  ✅ lib/middleware/auth.ts

🗄️  Checking Prisma Package:
  ✅ packages/db/package.json
  ✅ packages/db/client.ts
  ✅ packages/db/index.ts
  ✅ packages/db/prisma/schema.prisma

==================================================
✅ All routes, services, and middleware are in place!
```

---

## 🔧 Troubleshooting

### Script չի աշխատում:
1. Ստուգեք, որ Node.js installed է: `node --version`
2. Ստուգեք, որ correct directory-ում եք: `cd White-Shop\White-Shop`
3. Ստուգեք, որ script file-ը գոյություն ունի: `dir scripts\validate-routes.js`

### API Testing չի աշխատում:
1. Ստուգեք, որ dev server-ը աշխատում է
2. Ստուգեք, որ database-ը setup է
3. Ստուգեք environment variables-ները

---

## 📝 Scripts Location

Բոլոր scripts-ները գտնվում են:
```
White-Shop/White-Shop/scripts/
├── validate-routes.js          # File structure validation
├── test-api-routes.js          # API endpoints testing
└── cleanup-old-backend.js      # Cleanup old files
```

