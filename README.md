# White Shop - E-commerce Platform

Modern e-commerce platform built with Next.js 14, PostgreSQL, and Prisma.

## 🏗️ Architecture

This project uses a **monorepo structure** with Next.js 14 App Router:

- **Frontend & Backend**: Next.js 14 with API routes (`apps/web`)
- **Database**: PostgreSQL with Prisma ORM (`packages/db`)
- **Search**: Meilisearch for product search
- **Cache**: Redis (optional)

### Project Structure

```
White-Shop/
├── apps/
│   └── web/                    # Next.js application (frontend + API)
│       ├── app/                # Next.js App Router
│       │   ├── api/v1/         # API routes
│       │   └── ...             # Pages
│       └── lib/
│           ├── services/       # Business logic
│           └── middleware/     # Auth middleware
├── packages/
│   └── db/                     # Prisma database package
│       └── prisma/
│           └── schema.prisma   # Database schema
└── scripts/                    # Utility scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.20.0
- npm >= 10.0.0
- PostgreSQL >= 14
- Meilisearch (optional, for search)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd White-Shop/White-Shop
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the root directory (see `ENV.md` for details):
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/whiteshop?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   MEILISEARCH_HOST="http://localhost:7700"
   MEILISEARCH_API_KEY="your-meilisearch-master-key"
   APP_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

4. **Set up the database:**
   ```bash
   # Generate Prisma Client
   cd packages/db
   npm run db:generate
   
   # Push schema to database (development)
   npm run db:push
   
   # OR create migration (production)
   npm run db:migrate
   ```

5. **Start the development server:**
   ```bash
   # From root directory
   npm run dev
   ```

   The application will be available at:
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api/v1

## 📝 Available Scripts

### Root Level

- `npm run dev` - Start development server (Next.js)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run migrate:mongo-to-postgres` - Migrate data from MongoDB to PostgreSQL

### Database (packages/db)

- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database (development)
- `npm run db:migrate` - Create and run migrations (production)
- `npm run db:studio` - Open Prisma Studio

## 🗄️ Database

### PostgreSQL Setup

1. **Create a PostgreSQL database:**
   ```sql
   CREATE DATABASE whiteshop;
   ```

2. **Update DATABASE_URL in .env:**
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/whiteshop?schema=public"
   ```

3. **Run migrations:**
   ```bash
   cd packages/db
   npm run db:push
   ```

### Data Migration (MongoDB → PostgreSQL)

If you have existing MongoDB data:

```bash
npm run migrate:mongo-to-postgres
```

**Note:** Make sure both `MONGODB_URI` and `DATABASE_URL` are set in `.env`.

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register a user:**
   ```bash
   POST /api/v1/auth/register
   {
     "email": "user@example.com",
     "password": "password123",
     "firstName": "John",
     "lastName": "Doe"
   }
   ```

2. **Login:**
   ```bash
   POST /api/v1/auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

3. **Use the token:**
   ```bash
   Authorization: Bearer <token>
   ```

## 📚 API Documentation

### Base URL

- Development: `http://localhost:3000/api/v1`
- Production: `https://your-domain.com/api/v1`

### Main Endpoints

- **Auth**: `/api/v1/auth/*`
- **Products**: `/api/v1/products/*`
- **Categories**: `/api/v1/categories/*`
- **Cart**: `/api/v1/cart/*`
- **Orders**: `/api/v1/orders/*`
- **Users**: `/api/v1/users/*`
- **Admin**: `/api/v1/admin/*`

See `VALIDATION.md` for detailed endpoint documentation.

## 🧪 Testing

### Validate Routes

Check if all API routes exist:
```bash
node scripts/validate-routes.js
```

### Test API Routes

Test all API endpoints (requires dev server running):
```bash
node scripts/test-api-routes.js
```

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**

2. **Set environment variables in Vercel dashboard:**
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `MEILISEARCH_HOST`
   - `MEILISEARCH_API_KEY`
   - `APP_URL`
   - `NODE_ENV=production`

3. **Build settings:**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy**

### Other Platforms

For other platforms (Render, Railway, etc.), ensure:
- Node.js >= 18.20.0
- PostgreSQL database is accessible
- Environment variables are set
- Build command: `npm run build`
- Start command: `npm run start`

## 📦 Project Packages

### @white-shop/db

Prisma database package:
```typescript
import { db } from "@white-shop/db";

const users = await db.user.findMany();
```

## 🔧 Development

### Adding a New API Route

1. Create route file: `apps/web/app/api/v1/your-route/route.ts`
2. Create service: `apps/web/lib/services/your.service.ts`
3. Use Prisma: `import { db } from "@white-shop/db"`

Example:
```typescript
// apps/web/app/api/v1/products/route.ts
import { NextResponse } from "next/server";
import { productService } from "@/lib/services/products.service";

export async function GET() {
  const products = await productService.getAll();
  return NextResponse.json(products);
}
```

### Database Schema Changes

1. Update `packages/db/prisma/schema.prisma`
2. Generate Prisma Client:
   ```bash
   cd packages/db
   npm run db:generate
   ```
3. Push changes (development):
   ```bash
   npm run db:push
   ```
4. Or create migration (production):
   ```bash
   npm run db:migrate
   ```

## 📖 Documentation

- [Environment Variables](ENV.md) - Environment variables documentation
- [Validation Guide](VALIDATION.md) - API validation checklist
- [Migration Guide](MIGRATION-COMPLETE.md) - Migration from MongoDB to PostgreSQL
- [Progress](PROGRESS.md) - Project progress tracking

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Search**: Meilisearch
- **Cache**: Redis (optional)
- **Authentication**: JWT
- **Styling**: Tailwind CSS

## 📄 License

[Your License Here]

## 🤝 Contributing

[Contributing Guidelines]

## 📞 Support

[Support Information]

