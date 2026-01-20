/**
 * Migration Script: MongoDB → PostgreSQL
 * 
 * This script migrates all data from MongoDB to PostgreSQL using Prisma.
 * 
 * Usage:
 *   npx tsx scripts/migrate-mongo-to-postgres.ts
 * 
 * Prerequisites:
 *   1. MongoDB connection string in MONGODB_URI
 *   2. PostgreSQL connection string in DATABASE_URL
 *   3. Both databases accessible
 * 
 * IMPORTANT: Backup both databases before running this script!
 */

import mongoose from 'mongoose';
import { db } from '../packages/db';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// MongoDB Models (we'll define them inline for migration)
const connectMongoDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    throw new Error('MONGODB_URI is not set in .env');
  }
  
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(mongoURI);
  console.log('✅ Connected to MongoDB');
};

// Migration statistics
const stats = {
  users: { total: 0, migrated: 0, errors: 0 },
  categories: { total: 0, migrated: 0, errors: 0 },
  brands: { total: 0, migrated: 0, errors: 0 },
  attributes: { total: 0, migrated: 0, errors: 0 },
  products: { total: 0, migrated: 0, errors: 0 },
  carts: { total: 0, migrated: 0, errors: 0 },
  orders: { total: 0, migrated: 0, errors: 0 },
  settings: { total: 0, migrated: 0, errors: 0 },
};

/**
 * Migrate Users
 */
async function migrateUsers() {
  console.log('\n📦 Migrating Users...');
  
  const UserCollection = mongoose.connection.db.collection('users');
  const users = await UserCollection.find({}).toArray();
  stats.users.total = users.length;
  
  for (const user of users) {
    try {
      // Check if user already exists
      const existing = await db.user.findUnique({
        where: { id: user._id.toString() },
      });
      
      if (existing) {
        console.log(`  ⏭️  User ${user._id} already exists, skipping...`);
        stats.users.migrated++;
        continue;
      }
      
      // Migrate addresses
      const addresses = (user.addresses || []).map((addr: any) => ({
        firstName: addr.firstName || null,
        lastName: addr.lastName || null,
        company: addr.company || null,
        addressLine1: addr.addressLine1 || null,
        addressLine2: addr.addressLine2 || null,
        city: addr.city || null,
        state: addr.state || null,
        postalCode: addr.postalCode || null,
        countryCode: addr.countryCode || 'AM',
        phone: addr.phone || null,
        isDefault: addr.isDefault || false,
      }));
      
      await db.user.create({
        data: {
          id: user._id.toString(),
          email: user.email || null,
          phone: user.phone || null,
          passwordHash: user.passwordHash || null,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          emailVerified: user.emailVerified || false,
          phoneVerified: user.phoneVerified || false,
          locale: user.locale || 'en',
          blocked: user.blocked || false,
          roles: user.roles || ['customer'],
          addresses: {
            create: addresses,
          },
          deletedAt: user.deletedAt || null,
          createdAt: user.createdAt || new Date(),
          updatedAt: user.updatedAt || new Date(),
        },
      });
      
      stats.users.migrated++;
      if (stats.users.migrated % 10 === 0) {
        console.log(`  ✅ Migrated ${stats.users.migrated}/${stats.users.total} users...`);
      }
    } catch (error: any) {
      console.error(`  ❌ Error migrating user ${user._id}:`, error.message);
      stats.users.errors++;
    }
  }
  
  console.log(`  ✅ Users migration complete: ${stats.users.migrated}/${stats.users.total} (${stats.users.errors} errors)`);
}

/**
 * Migrate Categories
 */
async function migrateCategories() {
  console.log('\n📦 Migrating Categories...');
  
  const CategoryCollection = mongoose.connection.db.collection('categories');
  const categories = await CategoryCollection.find({}).toArray();
  stats.categories.total = categories.length;
  
  // First pass: create categories without parent relationships
  const categoryMap = new Map<string, string>();
  
  for (const category of categories) {
    try {
      const categoryId = category._id.toString();
      
      // Check if category already exists
      const existing = await db.category.findUnique({
        where: { id: categoryId },
      });
      
      if (existing) {
        categoryMap.set(categoryId, categoryId);
        stats.categories.migrated++;
        continue;
      }
      
      // Create translations
      const translations = (category.translations || []).map((trans: any) => ({
        locale: trans.locale,
        title: trans.title,
        slug: trans.slug,
        fullPath: trans.fullPath,
        description: trans.description || null,
        seoTitle: trans.seoTitle || null,
        seoDescription: trans.seoDescription || null,
      }));
      
      const created = await db.category.create({
        data: {
          id: categoryId,
          parentId: null, // Will update in second pass
          position: category.position || 0,
          published: category.published || false,
          requiresSizes: category.requiresSizes || false,
          media: category.media || [],
          translations: {
            create: translations,
          },
          deletedAt: category.deletedAt || null,
          createdAt: category.createdAt || new Date(),
          updatedAt: category.updatedAt || new Date(),
        },
      });
      
      categoryMap.set(categoryId, created.id);
      stats.categories.migrated++;
    } catch (error: any) {
      console.error(`  ❌ Error migrating category ${category._id}:`, error.message);
      stats.categories.errors++;
    }
  }
  
  // Second pass: update parent relationships
  console.log('  🔗 Updating parent relationships...');
  for (const category of categories) {
    if (category.parentId) {
      try {
        const parentId = category.parentId.toString();
        const newParentId = categoryMap.get(parentId);
        
        if (newParentId) {
          await db.category.update({
            where: { id: categoryMap.get(category._id.toString())! },
            data: { parentId: newParentId },
          });
        }
      } catch (error: any) {
        console.error(`  ❌ Error updating parent for category ${category._id}:`, error.message);
      }
    }
  }
  
  console.log(`  ✅ Categories migration complete: ${stats.categories.migrated}/${stats.categories.total} (${stats.categories.errors} errors)`);
}

/**
 * Migrate Brands
 */
async function migrateBrands() {
  console.log('\n📦 Migrating Brands...');
  
  const BrandCollection = mongoose.connection.db.collection('brands');
  const brands = await BrandCollection.find({}).toArray();
  stats.brands.total = brands.length;
  
  for (const brand of brands) {
    try {
      const brandId = brand._id.toString();
      
      const existing = await db.brand.findUnique({
        where: { id: brandId },
      });
      
      if (existing) {
        stats.brands.migrated++;
        continue;
      }
      
      const translations = (brand.translations || []).map((trans: any) => ({
        locale: trans.locale,
        name: trans.name,
        description: trans.description || null,
      }));
      
      await db.brand.create({
        data: {
          id: brandId,
          slug: brand.slug,
          logoUrl: brand.logoUrl || null,
          published: brand.published || false,
          translations: {
            create: translations,
          },
          deletedAt: brand.deletedAt || null,
          createdAt: brand.createdAt || new Date(),
          updatedAt: brand.updatedAt || new Date(),
        },
      });
      
      stats.brands.migrated++;
    } catch (error: any) {
      console.error(`  ❌ Error migrating brand ${brand._id}:`, error.message);
      stats.brands.errors++;
    }
  }
  
  console.log(`  ✅ Brands migration complete: ${stats.brands.migrated}/${stats.brands.total} (${stats.brands.errors} errors)`);
}

/**
 * Migrate Attributes
 */
async function migrateAttributes() {
  console.log('\n📦 Migrating Attributes...');
  
  const AttributeCollection = mongoose.connection.db.collection('attributes');
  const attributes = await AttributeCollection.find({}).toArray();
  stats.attributes.total = attributes.length;
  
  for (const attribute of attributes) {
    try {
      const attributeId = attribute._id.toString();
      
      const existing = await db.attribute.findUnique({
        where: { id: attributeId },
      });
      
      if (existing) {
        stats.attributes.migrated++;
        continue;
      }
      
      const translations = (attribute.translations || []).map((trans: any) => ({
        locale: trans.locale,
        name: trans.name,
      }));
      
      const values = (attribute.values || []).map((val: any) => ({
        value: val.value,
        position: val.position || 0,
        translations: {
          create: (val.translations || []).map((trans: any) => ({
            locale: trans.locale,
            label: trans.label,
          })),
        },
      }));
      
      await db.attribute.create({
        data: {
          id: attributeId,
          key: attribute.key,
          type: attribute.type || 'select',
          filterable: attribute.filterable !== false,
          position: attribute.position || 0,
          translations: {
            create: translations,
          },
          values: {
            create: values,
          },
          createdAt: attribute.createdAt || new Date(),
          updatedAt: attribute.updatedAt || new Date(),
        },
      });
      
      stats.attributes.migrated++;
    } catch (error: any) {
      console.error(`  ❌ Error migrating attribute ${attribute._id}:`, error.message);
      stats.attributes.errors++;
    }
  }
  
  console.log(`  ✅ Attributes migration complete: ${stats.attributes.migrated}/${stats.attributes.total} (${stats.attributes.errors} errors)`);
}

/**
 * Migrate Products
 */
async function migrateProducts() {
  console.log('\n📦 Migrating Products...');
  
  const ProductCollection = mongoose.connection.db.collection('products');
  const products = await ProductCollection.find({}).toArray();
  stats.products.total = products.length;
  
  for (const product of products) {
    try {
      const productId = product._id.toString();
      
      const existing = await db.product.findUnique({
        where: { id: productId },
      });
      
      if (existing) {
        stats.products.migrated++;
        continue;
      }
      
      const translations = (product.translations || []).map((trans: any) => ({
        locale: trans.locale,
        title: trans.title,
        slug: trans.slug,
        subtitle: trans.subtitle || null,
        descriptionHtml: trans.descriptionHtml || null,
        seoTitle: trans.seoTitle || null,
        seoDescription: trans.seoDescription || null,
      }));
      
      const variants = (product.variants || []).map((variant: any) => ({
        sku: variant.sku || null,
        barcode: variant.barcode || null,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice || null,
        cost: variant.cost || null,
        stock: variant.stock || 0,
        stockReserved: variant.stockReserved || 0,
        weightGrams: variant.weightGrams || null,
        imageUrl: variant.imageUrl || null,
        position: variant.position || 0,
        published: variant.published !== false,
        options: {
          create: (variant.options || []).map((opt: any) => ({
            attributeId: opt.attributeId?.toString() || null,
            attributeKey: opt.attributeKey || null,
            valueId: opt.valueId?.toString() || null,
            value: opt.value || null,
          })),
        },
        createdAt: variant.createdAt || new Date(),
        updatedAt: variant.updatedAt || new Date(),
      }));
      
      const labels = (product.labels || []).map((label: any) => ({
        type: label.type,
        value: label.value,
        position: label.position || 'top-left',
        color: label.color || null,
      }));
      
      await db.product.create({
        data: {
          id: productId,
          brandId: product.brandId?.toString() || null,
          skuPrefix: product.skuPrefix || null,
          media: product.media || [],
          published: product.published || false,
          featured: product.featured || false,
          publishedAt: product.publishedAt || null,
          categoryIds: (product.categoryIds || []).map((id: any) => id.toString()),
          primaryCategoryId: product.primaryCategoryId?.toString() || null,
          attributeIds: (product.attributeIds || []).map((id: any) => id.toString()),
          discountPercent: product.discountPercent || 0,
          translations: {
            create: translations,
          },
          variants: {
            create: variants,
          },
          labels: {
            create: labels,
          },
          deletedAt: product.deletedAt || null,
          createdAt: product.createdAt || new Date(),
          updatedAt: product.updatedAt || new Date(),
        },
      });
      
      stats.products.migrated++;
      if (stats.products.migrated % 10 === 0) {
        console.log(`  ✅ Migrated ${stats.products.migrated}/${stats.products.total} products...`);
      }
    } catch (error: any) {
      console.error(`  ❌ Error migrating product ${product._id}:`, error.message);
      stats.products.errors++;
    }
  }
  
  console.log(`  ✅ Products migration complete: ${stats.products.migrated}/${stats.products.total} (${stats.products.errors} errors)`);
}

/**
 * Migrate Carts
 */
async function migrateCarts() {
  console.log('\n📦 Migrating Carts...');
  
  const CartCollection = mongoose.connection.db.collection('carts');
  const carts = await CartCollection.find({}).toArray();
  stats.carts.total = carts.length;
  
  for (const cart of carts) {
    try {
      const cartId = cart._id.toString();
      
      const existing = await db.cart.findUnique({
        where: { id: cartId },
      });
      
      if (existing) {
        stats.carts.migrated++;
        continue;
      }
      
      const items = (cart.items || []).map((item: any) => ({
        variantId: item.variantId?.toString() || '',
        productId: item.productId?.toString() || '',
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        createdAt: item.createdAt || new Date(),
        updatedAt: item.updatedAt || new Date(),
      }));
      
      await db.cart.create({
        data: {
          id: cartId,
          userId: cart.userId?.toString() || null,
          guestToken: cart.guestToken || null,
          locale: cart.locale || 'en',
          couponCode: cart.couponCode || null,
          abandoned: cart.abandoned || false,
          abandonedAt: cart.abandonedAt || null,
          expiresAt: cart.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
          items: {
            create: items,
          },
          createdAt: cart.createdAt || new Date(),
          updatedAt: cart.updatedAt || new Date(),
        },
      });
      
      stats.carts.migrated++;
    } catch (error: any) {
      console.error(`  ❌ Error migrating cart ${cart._id}:`, error.message);
      stats.carts.errors++;
    }
  }
  
  console.log(`  ✅ Carts migration complete: ${stats.carts.migrated}/${stats.carts.total} (${stats.carts.errors} errors)`);
}

/**
 * Migrate Orders
 */
async function migrateOrders() {
  console.log('\n📦 Migrating Orders...');
  
  const OrderCollection = mongoose.connection.db.collection('orders');
  const orders = await OrderCollection.find({}).toArray();
  stats.orders.total = orders.length;
  
  for (const order of orders) {
    try {
      const orderId = order._id.toString();
      
      const existing = await db.order.findUnique({
        where: { id: orderId },
      });
      
      if (existing) {
        stats.orders.migrated++;
        continue;
      }
      
      const items = (order.items || []).map((item: any) => ({
        variantId: item.variantId?.toString() || null,
        productTitle: item.productTitle,
        variantTitle: item.variantTitle || null,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        imageUrl: item.imageUrl || null,
      }));
      
      const payments = (order.payments || []).map((payment: any) => ({
        provider: payment.provider,
        providerTransactionId: payment.providerTransactionId || null,
        method: payment.method || null,
        amount: payment.amount,
        currency: payment.currency || 'AMD',
        status: payment.status || 'pending',
        cardLast4: payment.cardLast4 || null,
        cardBrand: payment.cardBrand || null,
        errorCode: payment.errorCode || null,
        errorMessage: payment.errorMessage || null,
        providerResponse: payment.providerResponse || null,
        idempotencyKey: payment.idempotencyKey || null,
        completedAt: payment.completedAt || null,
        failedAt: payment.failedAt || null,
        createdAt: payment.createdAt || new Date(),
        updatedAt: payment.updatedAt || new Date(),
      }));
      
      const events = (order.events || []).map((event: any) => ({
        type: event.type,
        data: event.data || null,
        userId: event.userId?.toString() || null,
        ipAddress: event.ipAddress || null,
        createdAt: event.createdAt || new Date(),
      }));
      
      await db.order.create({
        data: {
          id: orderId,
          number: order.number,
          userId: order.userId?.toString() || null,
          status: order.status || 'pending',
          paymentStatus: order.paymentStatus || 'pending',
          fulfillmentStatus: order.fulfillmentStatus || 'unfulfilled',
          subtotal: order.subtotal,
          discountAmount: order.discountAmount || 0,
          shippingAmount: order.shippingAmount || 0,
          taxAmount: order.taxAmount || 0,
          total: order.total,
          currency: order.currency || 'AMD',
          customerEmail: order.customerEmail || null,
          customerPhone: order.customerPhone || null,
          customerLocale: order.customerLocale || 'en',
          billingAddress: order.billingAddress || null,
          shippingAddress: order.shippingAddress || null,
          shippingMethod: order.shippingMethod || null,
          trackingNumber: order.trackingNumber || null,
          notes: order.notes || null,
          adminNotes: order.adminNotes || null,
          ipAddress: order.ipAddress || null,
          userAgent: order.userAgent || null,
          paidAt: order.paidAt || null,
          fulfilledAt: order.fulfilledAt || null,
          cancelledAt: order.cancelledAt || null,
          items: {
            create: items,
          },
          payments: {
            create: payments,
          },
          events: {
            create: events,
          },
          createdAt: order.createdAt || new Date(),
          updatedAt: order.updatedAt || new Date(),
        },
      });
      
      stats.orders.migrated++;
      if (stats.orders.migrated % 10 === 0) {
        console.log(`  ✅ Migrated ${stats.orders.migrated}/${stats.orders.total} orders...`);
      }
    } catch (error: any) {
      console.error(`  ❌ Error migrating order ${order._id}:`, error.message);
      stats.orders.errors++;
    }
  }
  
  console.log(`  ✅ Orders migration complete: ${stats.orders.migrated}/${stats.orders.total} (${stats.orders.errors} errors)`);
}

/**
 * Migrate Settings
 */
async function migrateSettings() {
  console.log('\n📦 Migrating Settings...');
  
  const SettingsCollection = mongoose.connection.db.collection('settings');
  const settings = await SettingsCollection.find({}).toArray();
  stats.settings.total = settings.length;
  
  for (const setting of settings) {
    try {
      const settingId = setting._id.toString();
      
      const existing = await db.settings.findUnique({
        where: { id: settingId },
      });
      
      if (existing) {
        stats.settings.migrated++;
        continue;
      }
      
      await db.settings.create({
        data: {
          id: settingId,
          key: setting.key,
          value: setting.value || {},
          description: setting.description || null,
          createdAt: setting.createdAt || new Date(),
          updatedAt: setting.updatedAt || new Date(),
        },
      });
      
      stats.settings.migrated++;
    } catch (error: any) {
      console.error(`  ❌ Error migrating setting ${setting._id}:`, error.message);
      stats.settings.errors++;
    }
  }
  
  console.log(`  ✅ Settings migration complete: ${stats.settings.migrated}/${stats.settings.total} (${stats.settings.errors} errors)`);
}

/**
 * Print migration summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  
  const total = Object.values(stats).reduce((sum, stat) => sum + stat.total, 0);
  const migrated = Object.values(stats).reduce((sum, stat) => sum + stat.migrated, 0);
  const errors = Object.values(stats).reduce((sum, stat) => sum + stat.errors, 0);
  
  for (const [key, stat] of Object.entries(stats)) {
    const status = stat.errors > 0 ? '⚠️' : '✅';
    console.log(`${status} ${key.toUpperCase().padEnd(15)}: ${stat.migrated}/${stat.total} (${stat.errors} errors)`);
  }
  
  console.log('='.repeat(60));
  console.log(`📦 TOTAL: ${migrated}/${total} migrated (${errors} errors)`);
  console.log('='.repeat(60));
}

/**
 * Main migration function
 */
async function main() {
  try {
    console.log('🚀 Starting MongoDB → PostgreSQL Migration\n');
    
    // Connect to MongoDB
    await connectMongoDB();
    
    // Connect to PostgreSQL (Prisma)
    console.log('🔌 Testing PostgreSQL connection...');
    await db.$connect();
    console.log('✅ Connected to PostgreSQL\n');
    
    // Run migrations in order (respecting foreign key constraints)
    await migrateUsers();
    await migrateCategories();
    await migrateBrands();
    await migrateAttributes();
    await migrateProducts();
    await migrateCarts();
    await migrateOrders();
    await migrateSettings();
    
    // Print summary
    printSummary();
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    await mongoose.connection.close();
    await db.$disconnect();
    console.log('\n🔌 Database connections closed');
  }
}

// Run migration
main();

