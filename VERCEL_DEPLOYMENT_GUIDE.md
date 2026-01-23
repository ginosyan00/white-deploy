# 🚀 Vercel Deployment Guide - WhiteShop

## ✅ Ինչ արդեն արված է

1. ✅ Root `vercel.json` ջնջված է (բախվում էր)
2. ✅ `apps/web/vercel.json` ուղղված է monorepo-ի համար

## 📋 Vercel Dashboard-ում կարգավորումներ

### Քայլ 1: Project Settings

1. Գնացեք **Vercel Dashboard** → Ձեր Project → **Settings**
2. **General** բաժնում գտեք **Root Directory**
3. Սահմանեք: `apps/web`
4. Սեղմեք **Save**

### Քայլ 2: Build & Development Settings

**Build Command:** (ավտոմատ կլինի `npm run build`)
- Vercel-ը ավտոմատ կգտնի `apps/web/vercel.json`-ից

**Output Directory:** (ավտոմատ կլինի `.next`)
- Vercel-ը ավտոմատ կգտնի `apps/web/vercel.json`-ից

**Install Command:** (ավտոմատ կլինի `cd ../.. && npm install`)
- Vercel-ը ավտոմատ կգտնի `apps/web/vercel.json`-ից

### Քայլ 3: Environment Variables

Գնացեք **Settings** → **Environment Variables** և ավելացրեք:

#### ✅ Պարտադիր փոփոխականներ:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public&client_encoding=UTF8
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=production
APP_URL=https://your-project.vercel.app
```

#### ⚠️ Կարևոր:
- `DATABASE_URL` **ՉԿԱՐԱ** լինի `localhost` - օգտագործեք production database (Vercel Postgres, Supabase, Neon, և այլն)
- `APP_URL` պետք է համապատասխանի ձեր Vercel domain-ին

#### 📝 Ոչ պարտադիր (եթե օգտագործում եք):

```
MEILISEARCH_HOST=https://your-meilisearch-instance.com
MEILISEARCH_API_KEY=your-api-key
REDIS_URL=redis://your-redis-instance:6379
```

### Քայլ 4: Deploy

1. Սեղմեք **Deploy** կամ push արեք GitHub-ում
2. Սպասեք build-ի ավարտին
3. Ստուգեք build logs-ը սխալների համար

## 🔧 Build Process

Build-ի ժամանակ կատարվում է:

1. **Install:** `cd ../.. && npm install` (root-ից install workspace-ները)
2. **Prebuild:** `cd ../../packages/db && npm run db:generate` (Prisma Client generation)
3. **Build:** `next build` (Next.js build)

## 🗄️ Database Migrations

Deploy-ից հետո պետք է run անեք migrations:

```bash
# Option 1: Vercel CLI-ով
vercel env pull .env.local
cd packages/db
npx prisma migrate deploy

# Option 2: Prisma Studio-ով
cd packages/db
npx prisma migrate deploy
```

## 🚨 Հաճախակի սխալներ և լուծումներ

### Սխալ 1: "Cannot find module '@prisma/client'"
**Լուծում:** 
- Ստուգեք, որ `prebuild` script-ը աշխատում է
- Build logs-ում պետք է տեսնեք "Prisma Client generated"

### Սխալ 2: "Database connection failed"
**Լուծում:**
- Ստուգեք `DATABASE_URL` environment variable-ը
- Համոզվեք, որ **չի** պարունակում `localhost`
- Ստուգեք database-ի connection string-ը

### Սխալ 3: "Cannot find module '@shop/ui'"
**Լուծում:**
- Ստուգեք, որ `installCommand`-ը root-ից install է անում
- Build logs-ում պետք է տեսնեք workspace packages-ի installation

### Սխալ 4: Build timeout
**Լուծում:**
- Vercel-ի free plan-ում build timeout-ը 45 վայրկյան է
- Եթե build-ը երկար է, upgrade անեք plan-ը

## ✅ Deployment Checklist

- [ ] Root Directory սահմանված է `apps/web`
- [ ] Environment Variables ավելացված են
- [ ] `DATABASE_URL` production URL է (ոչ localhost)
- [ ] `APP_URL` համապատասխանում է Vercel domain-ին
- [ ] Build հաջողությամբ ավարտվել է
- [ ] Database migrations run են արված
- [ ] Homepage բացվում է
- [ ] API endpoints աշխատում են

## 📞 Աջակցություն

Եթե build-ի ժամանակ սխալներ եք ստանում:
1. Ստուգեք build logs-ը Vercel Dashboard-ում
2. Ստուգեք environment variables-ները
3. Ստուգեք, որ database-ը accessible է



