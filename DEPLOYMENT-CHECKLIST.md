# 🚀 Deployment Checklist - Vercel

## ✅ Pre-Deployment Checklist

### 1. Environment Variables (Vercel Dashboard)

#### ✅ Required Variables:
- [x] `DATABASE_URL` = **Production PostgreSQL URL** (NOT localhost!)
- [x] `JWT_SECRET` = `your-super-secret-jwt-key-change-this-in-production`
- [x] `JWT_EXPIRES_IN` = `7d`
- [x] `MEILISEARCH_HOST` = `https://placeholder.meilisearch.cloud`
- [x] `MEILISEARCH_API_KEY` = `placeholder-key`
- [x] `NODE_ENV` = `production`
- [x] `APP_URL` = `https://neetrino-whiteml.vercel.com`
- [x] `NEXT_PUBLIC_API_URL` = `""` (empty or not set)

#### ⚠️ Important Notes:
- ❌ **`DATABASE_URL` with `localhost` WILL NOT WORK** on Vercel!
- ✅ Use production database URL (Vercel Postgres, Supabase, Neon, etc.)
- ✅ `MEILISEARCH_HOST` placeholder is OK if search is optional

### 2. Vercel Project Settings

#### Build Configuration:
- [x] **Root Directory:** `apps/web` (or leave empty if using root)
- [x] **Framework Preset:** Next.js (auto-detected)
- [x] **Build Command:** `cd apps/web && npm run build` (from vercel.json)
- [x] **Output Directory:** `apps/web/.next` (from vercel.json)
- [x] **Install Command:** `npm install` (from vercel.json)

### 3. Code Configuration

#### ✅ Files Checked:
- [x] `vercel.json` - Build configuration exists
- [x] `apps/web/next.config.js` - Next.js config exists
- [x] `apps/web/package.json` - Build scripts exist
- [x] `packages/db/prisma/schema.prisma` - Database schema exists

#### Build Process:
1. ✅ `prebuild` script runs: `cd ../../packages/db && npm run db:generate`
2. ✅ Prisma Client is generated before build
3. ✅ Next.js build runs: `next build`

### 4. Database Setup

#### ⚠️ Critical:
- [ ] **Production Database Created** (Vercel Postgres, Supabase, Neon, etc.)
- [ ] **Database Migrations Run** (after first deployment)
- [ ] **Database URL is correct** (no localhost!)

#### After Deployment:
```bash
# Connect to production database and run:
cd packages/db
npx prisma migrate deploy
```

### 5. Meilisearch Setup

#### Current Status:
- ⚠️ Using placeholder URL: `https://placeholder.meilisearch.cloud`
- ⚠️ Search functionality **may not work** with placeholder

#### Options:
1. **Keep placeholder** - App will deploy, but search won't work
2. **Setup Meilisearch Cloud** - Get real URL and API key
3. **Remove search** - If not needed

### 6. Final Checks

#### Before Deploying:
- [ ] All environment variables set in Vercel
- [ ] `DATABASE_URL` is production URL (not localhost!)
- [ ] `NODE_ENV` = `production`
- [ ] `APP_URL` matches your Vercel domain
- [ ] Repository connected to Vercel
- [ ] Build settings configured

#### After Deploying:
- [ ] Check build logs for errors
- [ ] Run database migrations
- [ ] Test homepage loads
- [ ] Test API endpoints
- [ ] Test authentication
- [ ] Check console for errors

## 🚨 Common Issues

### Issue 1: Database Connection Failed
**Error:** `Can't reach database server at 'localhost'`
**Solution:** Update `DATABASE_URL` to production database URL

### Issue 2: Build Fails - Prisma Client Not Found
**Error:** `@prisma/client did not initialize yet`
**Solution:** Ensure `prebuild` script runs before build

### Issue 3: Meilisearch Connection Failed
**Error:** `Failed to connect to Meilisearch`
**Solution:** Either setup real Meilisearch instance or handle errors gracefully

### Issue 4: Environment Variables Not Found
**Error:** `process.env.VARIABLE is undefined`
**Solution:** Check Vercel environment variables are set correctly

## 📋 Deployment Steps

### Step 1: Verify Environment Variables
Go to Vercel Dashboard → Project Settings → Environment Variables
- Verify all required variables are set
- Ensure `DATABASE_URL` is NOT localhost

### Step 2: Configure Build Settings
Go to Vercel Dashboard → Project Settings → General
- Root Directory: `apps/web` (if needed)
- Build Command: Auto-detected from `vercel.json`
- Output Directory: Auto-detected from `vercel.json`

### Step 3: Deploy
- Push to GitHub (if connected)
- Or click "Deploy" in Vercel Dashboard
- Watch build logs

### Step 4: Run Database Migrations
After successful deployment:
```bash
# Option 1: Using Prisma CLI
cd packages/db
npx prisma migrate deploy

# Option 2: Using Vercel CLI
vercel env pull
cd packages/db
npx prisma migrate deploy
```

### Step 5: Verify Deployment
- Visit your Vercel URL
- Check homepage loads
- Test API endpoints
- Check browser console for errors

## ✅ Ready to Deploy?

### If ALL checks pass:
✅ **YES, you can deploy!**

### If ANY check fails:
❌ **Fix issues first, then deploy**

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma Migrate Deploy](https://www.prisma.io/docs/concepts/components/prisma-migrate/migrate-development-production)



