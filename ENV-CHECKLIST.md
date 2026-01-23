# Environment Variables Checklist

## 📋 Local `.env` File Checklist (`apps/web/.env`)

### ✅ Required Variables (Development)

```bash
# Database (PostgreSQL) - Local development
DATABASE_URL="postgresql://postgres:599621226@localhost:5432/whiteshop?schema=public&client_encoding=UTF8"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Search (Meilisearch) - Local development
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="your-meilisearch-master-key"

# Application
NODE_ENV="development"
APP_URL="http://localhost:3000"

# Public API URL (empty for Next.js API routes)
NEXT_PUBLIC_API_URL=""
```

### 🔍 Variables Used in Code:

1. ✅ **DATABASE_URL** - Used by Prisma (packages/db)
2. ✅ **JWT_SECRET** - Required for authentication (lib/services/auth.service.ts)
3. ✅ **JWT_EXPIRES_IN** - JWT token expiration (default: "7d")
4. ✅ **MEILISEARCH_HOST** - Meilisearch host (lib/services/search.service.ts)
5. ✅ **MEILISEARCH_API_KEY** - Meilisearch API key
6. ✅ **NODE_ENV** - Environment mode (development/production)
7. ✅ **APP_URL** - Base application URL
8. ✅ **NEXT_PUBLIC_API_URL** - Public API URL (empty = relative paths)

### 📝 Optional Variables:

```bash
# Cache (Redis) - Optional
REDIS_URL="redis://localhost:6379"

# Payment Encryption - Optional (for payment gateways)
PAYMENT_ENCRYPTION_KEY="your-secure-32-character-key-here!!"
ENCRYPTION_KEY="your-secure-32-character-key-here!!"

# Payment Gateways - Optional
IDRAM_MERCHANT_ID="your-idram-merchant-id"
IDRAM_SECRET_KEY="your-idram-secret-key"
IDRAM_PUBLIC_KEY="your-idram-public-key"
ARCA_MERCHANT_ID="your-arca-merchant-id"
ARCA_API_KEY="your-arca-api-key"

# Email (SMTP) - Optional
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

## 🔄 Vercel Production vs Local Development

| Variable | Local `.env` | Vercel Production |
|----------|-------------|-------------------|
| `DATABASE_URL` | `localhost:5432` | Production DB URL |
| `MEILISEARCH_HOST` | `http://localhost:7700` | `https://placeholder.meilisearch.cloud` |
| `NODE_ENV` | `development` | `production` |
| `APP_URL` | `http://localhost:3000` | `https://neetrino-whiteml.vercel.com` |
| `NEXT_PUBLIC_API_URL` | `""` (empty) | `""` (empty) |

## ✅ Verification Steps

1. **Check if `.env` file exists** in `apps/web/.env`
2. **Verify all required variables** are present
3. **Ensure values are correct** for local development
4. **Test database connection** - `npm run dev` should connect to local DB
5. **Test Meilisearch** - If running locally, should connect to `localhost:7700`

## 🚨 Common Issues

- ❌ **Missing `JWT_SECRET`** → Authentication will fail
- ❌ **Wrong `DATABASE_URL`** → Database connection will fail
- ❌ **Missing `MEILISEARCH_API_KEY`** → Search might fail (if Meilisearch is used)
- ❌ **`NEXT_PUBLIC_API_URL` with wrong value** → API calls might fail

## 📌 Notes

- `.env` file should **NOT** be committed to git (should be in `.gitignore`)
- Local `.env` values are for **development only**
- Vercel environment variables are for **production**
- They can be **different** - that's OK!



