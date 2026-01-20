# Next.js Backend Validation Guide

## Section 4 - Validation Checklist

### Prerequisites

1. **PostgreSQL Database Setup**
   - Ensure PostgreSQL is running
   - Create a database
   - Set `DATABASE_URL` in `.env`:
     ```
     DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
     ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Generate Prisma Client**
   ```bash
   cd packages/db
   npm run db:generate
   ```

4. **Run Database Migrations**
   ```bash
   cd packages/db
   npm run db:push
   # OR
   npm run db:migrate
   ```

### API Routes Validation

#### ✅ Auth Routes
- [ ] `POST /api/v1/auth/register` - Register new user
- [ ] `POST /api/v1/auth/login` - Login user

#### ✅ Categories Routes
- [ ] `GET /api/v1/categories/tree?lang=en` - Get category tree
- [ ] `GET /api/v1/categories/:slug?lang=en` - Get category by slug

#### ✅ Products Routes
- [ ] `GET /api/v1/products` - List products with filters
- [ ] `GET /api/v1/products/filters` - Get available filters
- [ ] `GET /api/v1/products/price-range` - Get price range
- [ ] `GET /api/v1/products/:slug` - Get product by slug

#### ✅ Cart Routes (Requires Auth)
- [ ] `GET /api/v1/cart` - Get user's cart
- [ ] `POST /api/v1/cart/items` - Add item to cart
- [ ] `PATCH /api/v1/cart/items/:id` - Update cart item
- [ ] `DELETE /api/v1/cart/items/:id` - Remove cart item

#### ✅ Orders Routes (Requires Auth)
- [ ] `POST /api/v1/orders/checkout` - Create order
- [ ] `GET /api/v1/orders` - Get user orders list
- [ ] `GET /api/v1/orders/:number` - Get order by number

#### ✅ Users Routes (Requires Auth)
- [ ] `GET /api/v1/users/profile` - Get user profile
- [ ] `PUT /api/v1/users/profile` - Update user profile
- [ ] `PUT /api/v1/users/password` - Change password
- [ ] `GET /api/v1/users/addresses` - Get addresses
- [ ] `POST /api/v1/users/addresses` - Add address
- [ ] `PUT /api/v1/users/addresses/:addressId` - Update address
- [ ] `DELETE /api/v1/users/addresses/:addressId` - Delete address
- [ ] `PATCH /api/v1/users/addresses/:addressId/default` - Set default address

#### ✅ Admin Routes (Requires Admin Role)
- [ ] `GET /api/v1/admin/stats` - Get dashboard stats
- [ ] `GET /api/v1/admin/users` - Get users list
- [ ] `PUT /api/v1/admin/users/:id` - Update user
- [ ] `GET /api/v1/admin/orders` - Get orders list
- [ ] `GET /api/v1/admin/settings` - Get settings
- [ ] `PUT /api/v1/admin/settings` - Update settings

### Testing Steps

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Public Routes** (No auth required)
   - Test categories endpoints
   - Test products endpoints

3. **Test Auth Routes**
   - Register a new user
   - Login and get JWT token

4. **Test Protected Routes** (With JWT token)
   - Add `Authorization: Bearer <token>` header
   - Test cart, orders, users endpoints

5. **Test Admin Routes** (With admin JWT token)
   - Login as admin user
   - Test admin endpoints

### Validation Scripts

#### 1. File Structure Validation

Check if all routes, services, and middleware exist:

```bash
node scripts/validate-routes.js
```

This script verifies:
- All API route files exist
- All service files exist
- Middleware files exist
- Prisma package is configured

#### 2. API Routes Testing

Test all API endpoints (requires dev server running):

```bash
# Start dev server first
npm run dev

# In another terminal, run tests
node scripts/test-api-routes.js
```

This script tests:
- Public routes (no auth required)
- Auth routes (register, login)
- Protected routes (with JWT token)
- Admin routes (with admin JWT token)

### Validation Report

See `VALIDATION-REPORT.md` for detailed validation results.

### Notes

- All routes follow Next.js 14 App Router format
- All business logic is in services (`apps/web/lib/services/`)
- Database access uses Prisma (`@white-shop/db`)
- Authentication uses JWT tokens
- Error responses follow Problem Details format

### Known Limitations

1. **Orders Checkout**: May need full implementation (verify functionality)
2. **Admin Service**: Basic implementation, can be expanded
3. **Redis Caching**: Optional, can be added later
4. **Products Filters**: Simplified implementation, can be enhanced

### Validation Checklist

#### File Structure ✅
- [x] All API routes exist
- [x] All services exist
- [x] Middleware exists
- [x] Prisma package configured

#### Runtime Testing ⚠️
- [ ] Database is set up
- [ ] Environment variables configured
- [ ] Prisma client generated
- [ ] Database migrations run
- [ ] Public routes tested
- [ ] Auth routes tested
- [ ] Protected routes tested
- [ ] Admin routes tested

