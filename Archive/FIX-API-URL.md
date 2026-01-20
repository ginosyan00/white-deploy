# 🔧 Fix: API URL Configuration

## Problem

Frontend-ը փորձում է միանալ `http://localhost:3001`-ին, բայց այդ server-ը չկա (մենք migrate արեցինք Next.js API routes):

## Solution

Պետք է հեռացնել կամ empty set անել `NEXT_PUBLIC_API_URL` environment variable-ը:

### Option 1: Create `.env.local` file (Recommended)

Ստեղծեք `apps/web/.env.local` file-ը:

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=
```

### Option 2: Remove from existing .env file

Եթե `.env` file-ում կա `NEXT_PUBLIC_API_URL=http://localhost:3001`, հեռացրեք այն կամ comment արեք:

```bash
# .env
# NEXT_PUBLIC_API_URL=http://localhost:3001  # Commented out
```

### Option 3: Set to empty string

```bash
# .env
NEXT_PUBLIC_API_URL=""
```

## After Fix

1. **Restart dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **Clear browser cache** (optional):
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache

3. **Verify:**
   - API calls should now go to `/api/v1/...` (relative paths)
   - No more `localhost:3001` errors

## How It Works

- Եթե `NEXT_PUBLIC_API_URL` empty է կամ չկա, API client-ը օգտագործում է relative paths
- Relative paths-ը աշխատում են նույն domain-ի վրա (`http://localhost:3000/api/v1/...`)
- Next.js API routes-ը աշխատում են նույն server-ի վրա, որտեղ frontend-ը

## Files Created

- ✅ `apps/web/.env.local` - Environment variables for Next.js

