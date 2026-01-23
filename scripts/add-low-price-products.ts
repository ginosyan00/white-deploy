/**
 * Script to add a few products with 10 AMD price and 50 stock
 * Usage: npx tsx scripts/add-low-price-products.ts
 */

// Load environment variables FIRST, before importing db
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Load .env from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootPath = path.resolve(__dirname, "..");
const envPath = path.join(rootPath, ".env");

console.log(`📂 Looking for .env file at: ${envPath}`);

// Try loading from multiple locations
const envResult1 = dotenv.config({ path: envPath });
const envResult2 = dotenv.config(); // Also try default location

if (envResult1.error && envResult2.error) {
  console.warn("⚠️  Warning: Could not load .env file from custom path");
}

// Check if DATABASE_URL is loaded and valid
const dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl || (!dbUrl.startsWith("postgresql://") && !dbUrl.startsWith("postgres://"))) {
  console.error("❌ Error: DATABASE_URL is not set or invalid in environment variables!");
  console.error(`   Checked path: ${envPath}`);
  console.error(`   Current value: ${dbUrl ? `"${dbUrl.substring(0, 50)}..."` : "(empty)"}`);
  console.error("   Please make sure .env file exists in the root directory with DATABASE_URL");
  console.error("   Format: DATABASE_URL=\"postgresql://user:password@host:5432/dbname?schema=public\"");
  process.exit(1);
}

console.log(`✅ DATABASE_URL loaded (starts with: ${dbUrl.substring(0, 30)}...)`);

// Now import db after environment is loaded
import { db } from "../packages/db";

// Products with 10 AMD price and 50 stock
const products = [
  {
    title: "Test Product 1",
    slug: "test-product-1",
    subtitle: "Test product with 10 AMD price",
    descriptionHtml: "<p>This is a test product with price 10 AMD and stock 50.</p>",
  },
  {
    title: "Test Product 2",
    slug: "test-product-2",
    subtitle: "Test product with 10 AMD price",
    descriptionHtml: "<p>This is a test product with price 10 AMD and stock 50.</p>",
  },
  {
    title: "Test Product 3",
    slug: "test-product-3",
    subtitle: "Test product with 10 AMD price",
    descriptionHtml: "<p>This is a test product with price 10 AMD and stock 50.</p>",
  },
  {
    title: "Test Product 4",
    slug: "test-product-4",
    subtitle: "Test product with 10 AMD price",
    descriptionHtml: "<p>This is a test product with price 10 AMD and stock 50.</p>",
  },
  {
    title: "Test Product 5",
    slug: "test-product-5",
    subtitle: "Test product with 10 AMD price",
    descriptionHtml: "<p>This is a test product with price 10 AMD and stock 50.</p>",
  },
];

async function main() {
  console.log("🚀 Starting to add products with 10 AMD price and 50 stock...\n");

  try {
    // Get all published categories
    const categories = await db.category.findMany({
      where: {
        published: true,
        deletedAt: null,
      },
      include: {
        translations: {
          where: { locale: "en" },
        },
      },
    });

    console.log(`📁 Found ${categories.length} published categories`);

    if (categories.length === 0) {
      console.log("❌ No published categories found. Please create categories first.");
      return;
    }

    // Get all published brands
    const brands = await db.brand.findMany({
      where: {
        published: true,
        deletedAt: null,
      },
      include: {
        translations: {
          where: { locale: "en" },
        },
      },
    });

    console.log(`🏷️  Found ${brands.length} published brands\n`);

    // Create default brand if none exists
    let brandId: string | null = null;
    if (brands.length === 0) {
      console.log("⚠️  No brands found. Creating a default brand...");
      const defaultBrand = await db.brand.create({
        data: {
          slug: "default-brand",
          published: true,
          translations: {
            create: {
              locale: "en",
              name: "Default Brand",
            },
          },
        },
      });
      brandId = defaultBrand.id;
    } else {
      brandId = brands[0].id;
    }

    // Use first category
    const category = categories[0];
    console.log(`📋 Using category: ${category.translations[0]?.title || "Unknown"}\n`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const productData of products) {
      try {
        // Check if product already exists
        const existingProduct = await db.product.findFirst({
          where: {
            translations: {
              some: {
                slug: productData.slug,
                locale: "en",
              },
            },
            deletedAt: null,
          },
        });

        if (existingProduct) {
          console.log(`⏭️  Product "${productData.title}" already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Create single variant with 10 AMD price and 50 stock
        const variant = {
          price: 10, // 10 AMD
          stock: 50,
          sku: productData.slug,
          published: true,
          options: {
            create: [],
          },
        };

        // Create product
        const product = await db.product.create({
          data: {
            brandId: brandId,
            primaryCategoryId: category.id,
            categoryIds: [category.id],
            published: true,
            publishedAt: new Date(),
            translations: {
              create: {
                locale: "en",
                title: productData.title,
                slug: productData.slug,
                subtitle: productData.subtitle,
                descriptionHtml: productData.descriptionHtml,
              },
            },
            variants: {
              create: [variant],
            },
          },
        });

        console.log(`✅ Created product: ${productData.title} (Price: 10 AMD, Stock: 50)`);
        createdCount++;
      } catch (error: any) {
        console.error(`❌ Error creating product "${productData.title}":`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n✨ Done! Created ${createdCount} products, skipped ${skippedCount} products.`);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();

