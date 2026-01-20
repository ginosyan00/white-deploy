/**
 * Script to add 15 products with Armani, Geox, Nike brands
 * and Shoes, Tshirt, Coats categories
 * Usage: npx tsx scripts/add-15-products.ts
 */

import { db } from "../packages/db";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Brands to create/use
const brands = [
  { name: "Armani", slug: "armani" },
  { name: "Geox", slug: "geox" },
  { name: "Nike", slug: "nike" },
];

// Categories to create/use
const categories = [
  { title: "Shoes", slug: "shoes" },
  { title: "Tshirt", slug: "tshirt" },
  { title: "Coats", slug: "coats" },
];

// 15 Products data
const products = [
  // Shoes (5 products)
  {
    title: "Armani Classic Leather Shoes",
    slug: "armani-classic-leather-shoes",
    subtitle: "Premium Italian leather dress shoes",
    descriptionHtml: "<p>Elegant classic leather shoes from Armani. Handcrafted in Italy with premium materials.</p>",
    brand: "Armani",
    category: "Shoes",
    colors: ["Black", "Brown"],
    sizes: ["40", "41", "42", "43", "44"],
    price: 450,
    compareAtPrice: 550,
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop",
  },
  {
    title: "Geox Breathable Running Shoes",
    slug: "geox-breathable-running-shoes",
    subtitle: "Comfortable and breathable athletic shoes",
    descriptionHtml: "<p>Innovative breathable technology from Geox. Perfect for running and daily activities.</p>",
    brand: "Geox",
    category: "Shoes",
    colors: ["Black", "White", "Blue"],
    sizes: ["40", "41", "42", "43", "44", "45"],
    price: 120,
    compareAtPrice: 150,
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
  },
  {
    title: "Nike Air Max Sneakers",
    slug: "nike-air-max-sneakers",
    subtitle: "Iconic comfort and style",
    descriptionHtml: "<p>Classic Nike Air Max with superior cushioning. Timeless design for everyday wear.</p>",
    brand: "Nike",
    category: "Shoes",
    colors: ["Black", "White", "Red"],
    sizes: ["40", "41", "42", "43", "44", "45"],
    price: 130,
    compareAtPrice: 160,
    stock: 60,
    imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop",
  },
  {
    title: "Armani Designer Loafers",
    slug: "armani-designer-loafers",
    subtitle: "Sophisticated Italian design",
    descriptionHtml: "<p>Luxury loafers from Armani. Perfect for business and formal occasions.</p>",
    brand: "Armani",
    category: "Shoes",
    colors: ["Black", "Brown"],
    sizes: ["40", "41", "42", "43"],
    price: 480,
    compareAtPrice: 580,
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop",
  },
  {
    title: "Geox Casual Walking Shoes",
    slug: "geox-casual-walking-shoes",
    subtitle: "Comfort meets style",
    descriptionHtml: "<p>Comfortable walking shoes with Geox patented breathable sole technology.</p>",
    brand: "Geox",
    category: "Shoes",
    colors: ["Black", "Gray", "Navy"],
    sizes: ["40", "41", "42", "43", "44"],
    price: 110,
    compareAtPrice: 140,
    stock: 45,
    imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop",
  },
  // Tshirts (5 products)
  {
    title: "Armani Premium Cotton T-Shirt",
    slug: "armani-premium-cotton-tshirt",
    subtitle: "Luxury comfort in every thread",
    descriptionHtml: "<p>Premium cotton t-shirt from Armani. Soft, breathable, and elegantly designed.</p>",
    brand: "Armani",
    category: "Tshirt",
    colors: ["White", "Black", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    price: 95,
    compareAtPrice: 120,
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
  },
  {
    title: "Geox Comfort Fit T-Shirt",
    slug: "geox-comfort-fit-tshirt",
    subtitle: "Everyday comfort and style",
    descriptionHtml: "<p>Comfortable fit t-shirt from Geox. Perfect for casual wear and active lifestyle.</p>",
    brand: "Geox",
    category: "Tshirt",
    colors: ["White", "Black", "Gray", "Blue"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    price: 35,
    compareAtPrice: 45,
    stock: 70,
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
  },
  {
    title: "Nike Dri-FIT Training T-Shirt",
    slug: "nike-dri-fit-training-tshirt",
    subtitle: "Stay dry, stay comfortable",
    descriptionHtml: "<p>Nike Dri-FIT technology wicks sweat away from your body. Perfect for workouts.</p>",
    brand: "Nike",
    category: "Tshirt",
    colors: ["Black", "White", "Red", "Blue"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    price: 45,
    compareAtPrice: 60,
    stock: 80,
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
  },
  {
    title: "Armani Logo T-Shirt",
    slug: "armani-logo-tshirt",
    subtitle: "Iconic Armani style",
    descriptionHtml: "<p>Classic logo t-shirt from Armani. Premium quality with iconic branding.</p>",
    brand: "Armani",
    category: "Tshirt",
    colors: ["White", "Black"],
    sizes: ["S", "M", "L", "XL"],
    price: 110,
    compareAtPrice: 135,
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
  },
  {
    title: "Geox Classic Crew Neck T-Shirt",
    slug: "geox-classic-crew-neck-tshirt",
    subtitle: "Timeless style and comfort",
    descriptionHtml: "<p>Classic crew neck t-shirt from Geox. Versatile and comfortable for any occasion.</p>",
    brand: "Geox",
    category: "Tshirt",
    colors: ["White", "Black", "Gray"],
    sizes: ["S", "M", "L", "XL"],
    price: 32,
    compareAtPrice: 42,
    stock: 65,
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
  },
  // Coats (5 products)
  {
    title: "Armani Wool Overcoat",
    slug: "armani-wool-overcoat",
    subtitle: "Elegant Italian craftsmanship",
    descriptionHtml: "<p>Luxurious wool overcoat from Armani. Perfect for formal occasions and cold weather.</p>",
    brand: "Armani",
    category: "Coats",
    colors: ["Black", "Navy", "Gray"],
    sizes: ["S", "M", "L", "XL"],
    price: 1200,
    compareAtPrice: 1500,
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=800&fit=crop",
  },
  {
    title: "Geox Waterproof Winter Coat",
    slug: "geox-waterproof-winter-coat",
    subtitle: "Protection from the elements",
    descriptionHtml: "<p>Waterproof and breathable winter coat from Geox. Stay warm and dry in any weather.</p>",
    brand: "Geox",
    category: "Coats",
    colors: ["Black", "Navy", "Gray"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    price: 280,
    compareAtPrice: 350,
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=800&fit=crop",
  },
  {
    title: "Nike Sportswear Tech Fleece Coat",
    slug: "nike-sportswear-tech-fleece-coat",
    subtitle: "Lightweight warmth",
    descriptionHtml: "<p>Nike Tech Fleece technology provides lightweight warmth. Perfect for active lifestyle.</p>",
    brand: "Nike",
    category: "Coats",
    colors: ["Black", "Gray", "Navy"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    price: 180,
    compareAtPrice: 220,
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=800&fit=crop",
  },
  {
    title: "Armani Cashmere Trench Coat",
    slug: "armani-cashmere-trench-coat",
    subtitle: "Ultimate luxury",
    descriptionHtml: "<p>Premium cashmere trench coat from Armani. Timeless elegance and exceptional quality.</p>",
    brand: "Armani",
    category: "Coats",
    colors: ["Black", "Beige", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    price: 1500,
    compareAtPrice: 1800,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=800&fit=crop",
  },
  {
    title: "Geox Lightweight Spring Coat",
    slug: "geox-lightweight-spring-coat",
    subtitle: "Perfect for transitional weather",
    descriptionHtml: "<p>Lightweight and breathable spring coat from Geox. Ideal for mild weather conditions.</p>",
    brand: "Geox",
    category: "Coats",
    colors: ["Beige", "Navy", "Gray"],
    sizes: ["S", "M", "L", "XL"],
    price: 150,
    compareAtPrice: 190,
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=800&fit=crop",
  },
];

async function main() {
  console.log("🚀 Starting to add 15 products with brands and categories...\n");

  try {
    // Create or get brands
    const brandMap = new Map<string, string>();
    for (const brandData of brands) {
      let brand = await db.brand.findUnique({
        where: { slug: brandData.slug },
      });

      if (!brand) {
        console.log(`📝 Creating brand: ${brandData.name}`);
        brand = await db.brand.create({
          data: {
            slug: brandData.slug,
            published: true,
            translations: {
              create: {
                locale: "en",
                name: brandData.name,
              },
            },
          },
        });
        console.log(`✅ Created brand: ${brandData.name}`);
      } else {
        console.log(`✓ Brand already exists: ${brandData.name}`);
      }
      brandMap.set(brandData.name, brand.id);
    }

    console.log("\n");

    // Create or get categories
    const categoryMap = new Map<string, string>();
    for (const categoryData of categories) {
      let category = await db.category.findFirst({
        where: {
          translations: {
            some: {
              slug: categoryData.slug,
              locale: "en",
            },
          },
          deletedAt: null,
        },
      });

      if (!category) {
        console.log(`📝 Creating category: ${categoryData.title}`);
        category = await db.category.create({
          data: {
            published: true,
            translations: {
              create: {
                locale: "en",
                title: categoryData.title,
                slug: categoryData.slug,
                fullPath: categoryData.slug,
              },
            },
          },
        });
        console.log(`✅ Created category: ${categoryData.title}`);
      } else {
        console.log(`✓ Category already exists: ${categoryData.title}`);
      }
      categoryMap.set(categoryData.title, category.id);
    }

    console.log("\n");

    // Create products
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

        const brandId = brandMap.get(productData.brand);
        const categoryId = categoryMap.get(productData.category);

        if (!brandId || !categoryId) {
          console.log(`❌ Missing brand or category for "${productData.title}", skipping...`);
          skippedCount++;
          continue;
        }

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

        // Create product with image
        const product = await db.product.create({
          data: {
            brandId: brandId,
            primaryCategoryId: categoryId,
            categoryIds: [categoryId],
            published: true,
            publishedAt: new Date(),
            media: productData.imageUrl ? [{ url: productData.imageUrl, type: "image" }] : [],
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

        console.log(`✅ Created product: ${productData.title} (${variants.length} variants) - ${productData.brand} / ${productData.category}`);
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

