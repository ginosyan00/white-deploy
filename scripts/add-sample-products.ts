/**
 * Script to add 10 sample products to different categories
 * Usage: npx tsx scripts/add-sample-products.ts
 */

import { db } from "../packages/db";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Sample products data - will be distributed across available categories
const sampleProducts = [
  {
    title: "Classic White T-Shirt",
    slug: "classic-white-tshirt",
    subtitle: "Comfortable cotton t-shirt",
    descriptionHtml: "<p>High-quality cotton t-shirt perfect for everyday wear. Soft, breathable fabric.</p>",
    colors: ["White", "Black", "Gray"],
    sizes: ["s", "m", "l", "xl"],
    price: 29.99,
    compareAtPrice: 39.99,
    stock: 50,
  },
  {
    title: "Leather Running Shoes",
    slug: "leather-running-shoes",
    subtitle: "Premium athletic footwear",
    descriptionHtml: "<p>Durable leather running shoes with cushioned sole for maximum comfort.</p>",
    colors: ["Black", "White", "Blue"],
    sizes: ["40", "41", "42", "43", "44"],
    price: 89.99,
    compareAtPrice: 120.00,
    stock: 30,
  },
  {
    title: "Wireless Bluetooth Headphones",
    slug: "wireless-bluetooth-headphones",
    subtitle: "Premium sound quality",
    descriptionHtml: "<p>High-quality wireless headphones with noise cancellation and long battery life.</p>",
    colors: ["Black", "White"],
    sizes: [],
    price: 79.99,
    compareAtPrice: 99.99,
    stock: 25,
  },
  {
    title: "Denim Jeans",
    slug: "denim-jeans",
    subtitle: "Classic fit denim",
    descriptionHtml: "<p>Classic fit denim jeans made from premium cotton. Perfect for casual wear.</p>",
    colors: ["Blue", "Black"],
    sizes: ["30", "32", "34", "36", "38"],
    price: 59.99,
    compareAtPrice: 79.99,
    stock: 40,
  },
  {
    title: "Smart Watch",
    slug: "smart-watch",
    subtitle: "Track your fitness",
    descriptionHtml: "<p>Feature-rich smartwatch with heart rate monitor, GPS, and smartphone connectivity.</p>",
    colors: ["Black", "Silver", "Rose Gold"],
    sizes: [],
    price: 199.99,
    compareAtPrice: 249.99,
    stock: 20,
  },
  {
    title: "Leather Handbag",
    slug: "leather-handbag",
    subtitle: "Elegant and spacious",
    descriptionHtml: "<p>Genuine leather handbag with multiple compartments. Perfect for work or travel.</p>",
    colors: ["Brown", "Black", "Beige"],
    sizes: [],
    price: 129.99,
    compareAtPrice: 179.99,
    stock: 15,
  },
  {
    title: "Cotton Polo Shirt",
    slug: "cotton-polo-shirt",
    subtitle: "Casual and comfortable",
    descriptionHtml: "<p>Classic polo shirt made from premium cotton. Perfect for casual and semi-formal occasions.</p>",
    colors: ["Navy", "White", "Red"],
    sizes: ["s", "m", "l", "xl"],
    price: 39.99,
    compareAtPrice: 49.99,
    stock: 35,
  },
  {
    title: "Sports Backpack",
    slug: "sports-backpack",
    subtitle: "Durable and lightweight",
    descriptionHtml: "<p>Water-resistant sports backpack with multiple pockets. Ideal for gym and outdoor activities.</p>",
    colors: ["Black", "Blue", "Gray"],
    sizes: [],
    price: 49.99,
    compareAtPrice: 69.99,
    stock: 28,
  },
  {
    title: "Sunglasses",
    slug: "sunglasses",
    subtitle: "UV protection",
    descriptionHtml: "<p>Stylish sunglasses with UV400 protection. Polarized lenses reduce glare.</p>",
    colors: ["Black", "Brown", "Blue"],
    sizes: [],
    price: 34.99,
    compareAtPrice: 49.99,
    stock: 45,
  },
  {
    title: "Winter Jacket",
    slug: "winter-jacket",
    subtitle: "Warm and waterproof",
    descriptionHtml: "<p>Insulated winter jacket with waterproof coating. Perfect for cold weather.</p>",
    colors: ["Black", "Navy", "Gray"],
    sizes: ["s", "m", "l", "xl"],
    price: 149.99,
    compareAtPrice: 199.99,
    stock: 22,
  },
];

async function main() {
  console.log("🚀 Starting to add sample products...\n");

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
      brands.push(defaultBrand);
    }

    if (categories.length === 0) {
      console.log("❌ No published categories found. Please create categories first.");
      return;
    }

    // Get unique category slugs
    const categorySlugs = Array.from(
      new Set(
        categories
          .map((cat) => cat.translations.find((t) => t.locale === "en")?.slug)
          .filter((slug): slug is string => !!slug)
      )
    );

    console.log(`📋 Available category slugs: ${categorySlugs.join(", ")}\n`);

    let createdCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < sampleProducts.length; i++) {
      const productData = sampleProducts[i];
      try {
        // Distribute products across available categories
        const categorySlug = categorySlugs[i % categorySlugs.length];
        
        // Find category by slug
        const category = categories.find((cat) => {
          const translation = cat.translations.find((t) => t.locale === "en");
          return translation?.slug === categorySlug;
        });

        if (!category) {
          console.log(`⚠️  Category "${categorySlug}" not found, skipping product: ${productData.title}`);
          skippedCount++;
          continue;
        }

        console.log(`📦 Assigning "${productData.title}" to category: ${categorySlug}`);

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

        // Select a random brand
        const brand = brands[Math.floor(Math.random() * brands.length)];

        // Generate variants
        const variants: any[] = [];
        
        if (productData.sizes.length > 0 && productData.colors.length > 0) {
          // Create variants for each color and size combination
          for (const color of productData.colors) {
            for (const size of productData.sizes) {
              variants.push({
                price: productData.price,
                compareAtPrice: productData.compareAtPrice,
                stock: Math.floor(productData.stock / (productData.colors.length * productData.sizes.length)) || 5,
                sku: `${productData.slug}-${color.toLowerCase()}-${size}`,
                published: true,
                options: {
                  create: [
                    { attributeKey: "color", value: color },
                    { attributeKey: "size", value: size },
                  ],
                },
              });
            }
          }
        } else if (productData.colors.length > 0) {
          // Create variants for each color only
          for (const color of productData.colors) {
            variants.push({
              price: productData.price,
              compareAtPrice: productData.compareAtPrice,
              stock: Math.floor(productData.stock / productData.colors.length) || 10,
              sku: `${productData.slug}-${color.toLowerCase()}`,
              published: true,
              options: {
                create: [
                  { attributeKey: "color", value: color },
                ],
              },
            });
          }
        } else {
          // Single variant without color or size
          variants.push({
            price: productData.price,
            compareAtPrice: productData.compareAtPrice,
            stock: productData.stock,
            sku: productData.slug,
            published: true,
            options: {
              create: [],
            },
          });
        }

        // Create product
        const product = await db.product.create({
          data: {
            brandId: brand.id,
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
              create: variants,
            },
          },
        });

        console.log(`✅ Created product: ${productData.title} (${variants.length} variants)`);
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

