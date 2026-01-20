# Deployment Guide

## Vercel Deployment (Recommended)

### Prerequisites

1. Vercel account
2. GitHub/GitLab/Bitbucket repository connected
3. PostgreSQL database (Vercel Postgres, Supabase, or external)
4. Meilisearch instance (optional, for search)

### Steps

1. **Connect Repository to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your repository

2. **Configure Environment Variables:**
   
   In Vercel project settings, add these environment variables:
   
   **Required:**
   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public
   JWT_SECRET=your-super-secret-jwt-key
   MEILISEARCH_HOST=http://your-meilisearch-instance:7700
   MEILISEARCH_API_KEY=your-meilisearch-master-key
   APP_URL=https://your-domain.vercel.app
   NODE_ENV=production
   ```
   
   **Optional:**
   ```
   REDIS_URL=redis://your-redis-instance:6379
   IDRAM_MERCHANT_ID=your-idram-merchant-id
   IDRAM_SECRET_KEY=your-idram-secret-key
   IDRAM_PUBLIC_KEY=your-idram-public-key
   ARCA_MERCHANT_ID=your-arca-merchant-id
   ARCA_API_KEY=your-arca-api-key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

3. **Build Settings:**
   
   Vercel will auto-detect Next.js, but verify:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)
   - **Root Directory:** `./` (or `apps/web` if deploying only web app)

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

5. **Database Setup:**
   
   After deployment, run migrations:
   ```bash
   # Connect to your database and run:
   cd packages/db
   npx prisma migrate deploy
   ```
   
   Or use Prisma Studio:
   ```bash
   npx prisma studio
   ```

### Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update `APP_URL` environment variable to your custom domain
4. Redeploy

## Other Platforms

### Railway

1. **Connect Repository:**
   - Go to [Railway](https://railway.app)
   - Create new project from GitHub

2. **Add PostgreSQL:**
   - Add PostgreSQL service
   - Copy connection string to `DATABASE_URL`

3. **Configure Environment Variables:**
   - Add all required environment variables

4. **Deploy:**
   - Railway auto-detects Next.js
   - Builds and deploys automatically

### Render

1. **Create Web Service:**
   - Connect your repository
   - Select "Web Service"

2. **Build Settings:**
   ```
   Build Command: npm run build
   Start Command: npm run start
   ```

3. **Add PostgreSQL:**
   - Create PostgreSQL database
   - Copy connection string to `DATABASE_URL`

4. **Environment Variables:**
   - Add all required environment variables

5. **Deploy**

### Self-Hosted (VPS/Server)

1. **Install Dependencies:**
   ```bash
   # Install Node.js >= 18.20.0
   # Install PostgreSQL
   # Install PM2 (optional)
   npm install -g pm2
   ```

2. **Clone Repository:**
   ```bash
   git clone <repository-url>
   cd White-Shop/White-Shop
   npm install
   ```

3. **Set Environment Variables:**
   ```bash
   # Create .env file
   nano .env
   # Add all required variables
   ```

4. **Build:**
   ```bash
   npm run build
   ```

5. **Start:**
   ```bash
   # Using PM2
   pm2 start npm --name "whiteshop" -- start
   pm2 save
   pm2 startup
   
   # Or directly
   npm run start
   ```

6. **Setup Reverse Proxy (Nginx):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **SSL Certificate (Let's Encrypt):**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## Database Migrations

### Development
```bash
cd packages/db
npm run db:push
```

### Production
```bash
cd packages/db
npx prisma migrate deploy
```

## Environment Variables Checklist

Before deploying, ensure these are set:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Strong random string
- [ ] `MEILISEARCH_HOST` - Meilisearch instance URL
- [ ] `MEILISEARCH_API_KEY` - Meilisearch master key
- [ ] `APP_URL` - Your production domain
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_API_URL` - Empty or your API domain

## Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables are set correctly
- [ ] API routes are accessible
- [ ] Authentication works
- [ ] Database connection is stable
- [ ] Search functionality works (if using Meilisearch)
- [ ] SSL certificate is configured (for custom domain)
- [ ] Monitoring/logging is set up

## Troubleshooting

### Build Fails

1. Check Node.js version (>= 18.20.0)
2. Check environment variables
3. Check build logs for errors
4. Ensure all dependencies are installed

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check database is accessible from deployment platform
3. Check firewall rules
4. Verify database credentials

### API Routes Not Working

1. Check `APP_URL` is set correctly
2. Verify API routes are in `apps/web/app/api/v1/`
3. Check server logs for errors
4. Verify authentication tokens are valid

## Monitoring

### Vercel Analytics

Enable in Vercel dashboard:
- Analytics
- Speed Insights
- Web Vitals

### Logs

- **Vercel:** View logs in dashboard
- **Railway:** View logs in dashboard
- **Self-hosted:** Use PM2 logs or systemd journal

```bash
# PM2 logs
pm2 logs whiteshop

# System logs
journalctl -u whiteshop -f
```

