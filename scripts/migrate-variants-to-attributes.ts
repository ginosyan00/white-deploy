/**
 * Migration Script: Convert string-based variant options to AttributeValue IDs
 * 
 * This script:
 * 1. Creates Attribute and AttributeValue records for existing color/size values
 * 2. Links ProductAttribute relations
 * 3. Updates ProductVariantOption records to use AttributeValue IDs
 * 
 * Run with: npx tsx scripts/migrate-variants-to-attributes.ts
 */

import { db } from "@white-shop/db";

interface OldVariantOption {
  id: string;
  variantId: string;
  attributeKey: string | null;
  value: string | null;
}

async function main() {
  console.log("🚀 Starting variant migration to Attribute/AttributeValue system...\n");

  try {
    // Step 1: Find or create Color and Size attributes
    console.log("📋 Step 1: Setting up Color and Size attributes...");
    
    let colorAttribute = await db.attribute.findUnique({
      where: { key: "color" },
    });

    if (!colorAttribute) {
      colorAttribute = await db.attribute.create({
        data: {
          key: "color",
          type: "select",
          filterable: true,
          position: 0,
          translations: {
            create: [
              { locale: "en", name: "Color" },
              { locale: "hy", name: "Գույն" },
              { locale: "ru", name: "Цвет" },
              { locale: "ka", name: "ფერი" },
            ],
          },
        },
      });
      console.log("✅ Created Color attribute");
    } else {
      console.log("✅ Color attribute already exists");
    }

    let sizeAttribute = await db.attribute.findUnique({
      where: { key: "size" },
    });

    if (!sizeAttribute) {
      sizeAttribute = await db.attribute.create({
        data: {
          key: "size",
          type: "select",
          filterable: true,
          position: 1,
          translations: {
            create: [
              { locale: "en", name: "Size" },
              { locale: "hy", name: "Չափս" },
              { locale: "ru", name: "Размер" },
              { locale: "ka", name: "ზომა" },
            ],
          },
        },
      });
      console.log("✅ Created Size attribute");
    } else {
      console.log("✅ Size attribute already exists");
    }

    // Step 2: Get all variant options with string values
    console.log("\n📋 Step 2: Finding variant options to migrate...");
    
    const oldOptions = await db.productVariantOption.findMany({
      where: {
        OR: [
          { attributeKey: "color", value: { not: null } },
          { attributeKey: "size", value: { not: null } },
        ],
        valueId: null, // Only migrate options without AttributeValue ID
      },
    });

    console.log(`Found ${oldOptions.length} variant options to migrate\n`);

    if (oldOptions.length === 0) {
      console.log("✅ No options to migrate. Migration complete!");
      return;
    }

    // Step 3: Create AttributeValues for unique color/size values
    console.log("📋 Step 3: Creating AttributeValues for unique values...");
    
    const colorValues = new Set<string>();
    const sizeValues = new Set<string>();

    oldOptions.forEach((opt) => {
      if (opt.attributeKey === "color" && opt.value) {
        colorValues.add(opt.value.trim());
      } else if (opt.attributeKey === "size" && opt.value) {
        sizeValues.add(opt.value.trim());
      }
    });

    const colorValueMap = new Map<string, string>(); // value -> AttributeValue ID
    const sizeValueMap = new Map<string, string>();

    // Create Color AttributeValues
    for (const colorValue of colorValues) {
      const existing = await db.attributeValue.findFirst({
        where: {
          attributeId: colorAttribute.id,
          value: colorValue,
        },
      });

      if (existing) {
        colorValueMap.set(colorValue, existing.id);
        console.log(`  ✓ Color "${colorValue}" already exists`);
      } else {
        const newValue = await db.attributeValue.create({
          data: {
            attributeId: colorAttribute.id,
            value: colorValue,
            position: 0,
            translations: {
              create: [
                { locale: "en", label: colorValue },
                { locale: "hy", label: colorValue },
                { locale: "ru", label: colorValue },
                { locale: "ka", label: colorValue },
              ],
            },
          },
        });
        colorValueMap.set(colorValue, newValue.id);
        console.log(`  ✅ Created Color AttributeValue: "${colorValue}"`);
      }
    }

    // Create Size AttributeValues
    for (const sizeValue of sizeValues) {
      const existing = await db.attributeValue.findFirst({
        where: {
          attributeId: sizeAttribute.id,
          value: sizeValue,
        },
      });

      if (existing) {
        sizeValueMap.set(sizeValue, existing.id);
        console.log(`  ✓ Size "${sizeValue}" already exists`);
      } else {
        const newValue = await db.attributeValue.create({
          data: {
            attributeId: sizeAttribute.id,
            value: sizeValue,
            position: 0,
            translations: {
              create: [
                { locale: "en", label: sizeValue },
                { locale: "hy", label: sizeValue },
                { locale: "ru", label: sizeValue },
                { locale: "ka", label: sizeValue },
              ],
            },
          },
        });
        sizeValueMap.set(sizeValue, newValue.id);
        console.log(`  ✅ Created Size AttributeValue: "${sizeValue}"`);
      }
    }

    // Step 4: Update ProductVariantOption records
    console.log("\n📋 Step 4: Updating ProductVariantOption records...");
    
    let updatedCount = 0;
    for (const option of oldOptions) {
      let valueId: string | null = null;

      if (option.attributeKey === "color" && option.value) {
        valueId = colorValueMap.get(option.value.trim()) || null;
      } else if (option.attributeKey === "size" && option.value) {
        valueId = sizeValueMap.get(option.value.trim()) || null;
      }

      if (valueId) {
        await db.productVariantOption.update({
          where: { id: option.id },
          data: { valueId },
        });
        updatedCount++;
      }
    }

    console.log(`✅ Updated ${updatedCount} variant options\n`);

    // Step 5: Create ProductAttribute relations
    console.log("📋 Step 5: Creating ProductAttribute relations...");
    
    const productsWithColorVariants = await db.product.findMany({
      where: {
        variants: {
          some: {
            options: {
              some: {
                attributeKey: "color",
                valueId: { not: null },
              },
            },
          },
        },
      },
      select: { id: true },
    });

    const productsWithSizeVariants = await db.product.findMany({
      where: {
        variants: {
          some: {
            options: {
              some: {
                attributeKey: "size",
                valueId: { not: null },
              },
            },
          },
        },
      },
      select: { id: true },
    });

    let productAttributeCount = 0;

    // Link Color attribute to products
    for (const product of productsWithColorVariants) {
      const existing = await db.productAttribute.findUnique({
        where: {
          productId_attributeId: {
            productId: product.id,
            attributeId: colorAttribute.id,
          },
        },
      });

      if (!existing) {
        await db.productAttribute.create({
          data: {
            productId: product.id,
            attributeId: colorAttribute.id,
          },
        });
        productAttributeCount++;
      }
    }

    // Link Size attribute to products
    for (const product of productsWithSizeVariants) {
      const existing = await db.productAttribute.findUnique({
        where: {
          productId_attributeId: {
            productId: product.id,
            attributeId: sizeAttribute.id,
          },
        },
      });

      if (!existing) {
        await db.productAttribute.create({
          data: {
            productId: product.id,
            attributeId: sizeAttribute.id,
          },
        });
        productAttributeCount++;
      }
    }

    console.log(`✅ Created ${productAttributeCount} ProductAttribute relations\n`);

    console.log("🎉 Migration completed successfully!");
    console.log(`\nSummary:`);
    console.log(`  - Color values: ${colorValues.size}`);
    console.log(`  - Size values: ${sizeValues.size}`);
    console.log(`  - Updated variant options: ${updatedCount}`);
    console.log(`  - Created ProductAttribute relations: ${productAttributeCount}`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

main();

