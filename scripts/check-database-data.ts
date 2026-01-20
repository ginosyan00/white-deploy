import { db } from '../packages/db/client';

async function checkDatabaseData() {
  try {
    console.log('🔍 [DB] Checking database contents...\n');

    // Check Users
    const usersCount = await db.user.count();
    console.log(`👤 Users: ${usersCount}`);
    if (usersCount > 0) {
      const users = await db.user.findMany({ take: 5 });
      console.log('   Sample users:', users.map(u => ({ id: u.id, email: u.email, roles: u.roles })));
    }

    // Check Products
    const productsCount = await db.product.count();
    console.log(`\n📦 Products: ${productsCount}`);
    if (productsCount > 0) {
      const products = await db.product.findMany({ 
        take: 5,
        include: { translations: true, variants: { take: 1 } }
      });
      console.log('   Sample products:', products.map(p => ({
        id: p.id,
        title: p.translations[0]?.title || 'No title',
        variants: p.variants.length,
        published: p.published
      })));
    }

    // Check Categories
    const categoriesCount = await db.category.count();
    console.log(`\n📁 Categories: ${categoriesCount}`);
    if (categoriesCount > 0) {
      const categories = await db.category.findMany({ 
        take: 5,
        include: { translations: true }
      });
      console.log('   Sample categories:', categories.map(c => ({
        id: c.id,
        title: c.translations[0]?.title || 'No title',
        published: c.published
      })));
    }

    // Check Brands
    const brandsCount = await db.brand.count();
    console.log(`\n🏷️  Brands: ${brandsCount}`);
    if (brandsCount > 0) {
      const brands = await db.brand.findMany({ 
        take: 5,
        include: { translations: true }
      });
      console.log('   Sample brands:', brands.map(b => ({
        id: b.id,
        name: b.translations[0]?.name || 'No name',
        published: b.published
      })));
    }

    // Check Orders
    const ordersCount = await db.order.count();
    console.log(`\n🛒 Orders: ${ordersCount}`);
    if (ordersCount > 0) {
      const orders = await db.order.findMany({ take: 5 });
      console.log('   Sample orders:', orders.map(o => ({
        number: o.number,
        status: o.status,
        total: o.total,
        currency: o.currency
      })));
    }

    // Check Carts
    const cartsCount = await db.cart.count();
    console.log(`\n🛍️  Carts: ${cartsCount}`);

    // Check Payments (including old columns if they exist)
    const paymentsCount = await db.payment.count();
    console.log(`\n💳 Payments: ${paymentsCount}`);
    if (paymentsCount > 0) {
      const payments = await db.payment.findMany({ take: 5 });
      console.log('   Sample payments:', payments.map(p => ({
        id: p.id,
        provider: p.provider,
        status: p.status,
        amount: p.amount
      })));
    }

    console.log('\n✅ [DB] Database check complete!');
  } catch (error: any) {
    console.error('❌ [DB] Error checking database:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
  } finally {
    await db.$disconnect();
  }
}

checkDatabaseData();

