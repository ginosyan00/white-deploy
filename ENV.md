# Environment Variables Configuration

## Required Environment Variables

### Database (PostgreSQL)
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public&client_encoding=UTF8"
```
**Required:** Yes  
**Description:** PostgreSQL connection string for Prisma. **Important:** Include `client_encoding=UTF8` parameter to support Armenian and other UTF-8 characters.

### Authentication
```bash
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
```
**Required:** Yes (JWT_SECRET)  
**Description:** JWT secret key for token signing and expiration time

### Search (Meilisearch)
```bash
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="your-meilisearch-master-key"
```
**Required:** Yes  
**Description:** Meilisearch host and API key for product search

**Alternative names (for compatibility):**
```bash
MEILI_HOST="http://localhost:7700"
MEILI_MASTER_KEY="your-meilisearch-master-key"
```

### Application
```bash
NODE_ENV="development"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL=""  # Empty for Next.js API routes (same domain)
```
**Required:** Yes (NODE_ENV, APP_URL)  
**Description:** Application environment and base URL

## Optional Environment Variables

### Cache (Redis)
```bash
REDIS_URL="redis://localhost:6379"
```
**Required:** No  
**Description:** Redis connection string for caching (optional)

### Payment Gateways

#### Idram
```bash
IDRAM_MERCHANT_ID="your-idram-merchant-id"
IDRAM_SECRET_KEY="your-idram-secret-key"
IDRAM_PUBLIC_KEY="your-idram-public-key"
```

#### ArCa
```bash
ARCA_MERCHANT_ID="your-arca-merchant-id"
ARCA_API_KEY="your-arca-api-key"
```

### Email (SMTP)
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

### Migration Period Only
```bash
MONGODB_URI="mongodb://localhost:27017/whiteshop"
```
**Required:** No (only during migration)  
**Description:** MongoDB connection string (can be removed after migration)

## Setup Instructions

1. **Create `.env` file** in the root directory:
   ```bash
   cp .env.example .env  # If .env.example exists
   # Or create manually
   ```

2. **Set required variables:**
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Generate a secure random string
   - `MEILISEARCH_HOST` - Your Meilisearch instance URL
   - `MEILISEARCH_API_KEY` - Your Meilisearch master key

3. **Generate Prisma Client:**
   ```bash
   cd packages/db
   npm run db:generate
   ```

4. **Run Database Migrations:**
   ```bash
   cd packages/db
   npm run db:push
   # OR
   npm run db:migrate
   ```

## Production Deployment

For production deployment (Vercel, Render, etc.), set these environment variables in your hosting platform's dashboard:

### Required for Production:
- `DATABASE_URL`
- `JWT_SECRET`
- `MEILISEARCH_HOST`
- `MEILISEARCH_API_KEY`
- `NODE_ENV=production`
- `APP_URL` (your production domain)

### Security Notes:
- Never commit `.env` file to version control
- Use strong, random values for `JWT_SECRET`
- Use environment-specific values for production
- Rotate secrets regularly

