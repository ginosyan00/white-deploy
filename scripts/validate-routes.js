#!/usr/bin/env node

/**
 * Validation script to check if all Next.js API routes exist
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../apps/web/app/api/v1');

const REQUIRED_ROUTES = [
  // Auth
  'auth/register/route.ts',
  'auth/login/route.ts',
  
  // Categories
  'categories/tree/route.ts',
  'categories/[slug]/route.ts',
  
  // Products
  'products/route.ts',
  'products/filters/route.ts',
  'products/price-range/route.ts',
  'products/[slug]/route.ts',
  
  // Cart
  'cart/route.ts',
  'cart/items/route.ts',
  'cart/items/[id]/route.ts',
  
  // Orders
  'orders/checkout/route.ts',
  'orders/route.ts',
  'orders/[number]/route.ts',
  
  // Users
  'users/profile/route.ts',
  'users/password/route.ts',
  'users/addresses/route.ts',
  'users/addresses/[addressId]/route.ts',
  'users/addresses/[addressId]/default/route.ts',
  
  // Admin
  'admin/stats/route.ts',
  'admin/users/route.ts',
  'admin/users/[id]/route.ts',
  'admin/orders/route.ts',
  'admin/settings/route.ts',
];

const REQUIRED_SERVICES = [
  'lib/services/auth.service.ts',
  'lib/services/categories.service.ts',
  'lib/services/products.service.ts',
  'lib/services/cart.service.ts',
  'lib/services/orders.service.ts',
  'lib/services/users.service.ts',
  'lib/services/admin.service.ts',
];

const REQUIRED_MIDDLEWARE = [
  'lib/middleware/auth.ts',
];

function checkFileExists(filePath) {
  const fullPath = path.join(__dirname, '../apps/web', filePath);
  return fs.existsSync(fullPath);
}

function validateRoutes() {
  console.log('🔍 Validating Next.js API Routes...\n');
  
  let allPassed = true;
  const missing = [];
  
  // Check routes
  console.log('📁 Checking API Routes:');
  REQUIRED_ROUTES.forEach(route => {
    const exists = checkFileExists(`app/api/v1/${route}`);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${route}`);
    if (!exists) {
      missing.push(`app/api/v1/${route}`);
      allPassed = false;
    }
  });
  
  console.log('\n📦 Checking Services:');
  REQUIRED_SERVICES.forEach(service => {
    const exists = checkFileExists(service);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${service}`);
    if (!exists) {
      missing.push(service);
      allPassed = false;
    }
  });
  
  console.log('\n🔐 Checking Middleware:');
  REQUIRED_MIDDLEWARE.forEach(middleware => {
    const exists = checkFileExists(middleware);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${middleware}`);
    if (!exists) {
      missing.push(middleware);
      allPassed = false;
    }
  });
  
  // Check Prisma package
  console.log('\n🗄️  Checking Prisma Package:');
  const prismaFiles = [
    'packages/db/package.json',
    'packages/db/client.ts',
    'packages/db/index.ts',
    'packages/db/prisma/schema.prisma',
  ];
  
  prismaFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(fullPath);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${file}`);
    if (!exists) {
      missing.push(file);
      allPassed = false;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('✅ All routes, services, and middleware are in place!');
    console.log('\n📝 Next steps:');
    console.log('  1. Set up DATABASE_URL in .env');
    console.log('  2. Run: cd packages/db && npm run db:generate');
    console.log('  3. Run: cd packages/db && npm run db:push');
    console.log('  4. Start dev server: npm run dev');
    console.log('  5. Test the API routes');
    return 0;
  } else {
    console.log('❌ Some files are missing:');
    missing.forEach(file => {
      console.log(`   - ${file}`);
    });
    return 1;
  }
}

// Run validation
const exitCode = validateRoutes();
process.exit(exitCode);

