/**
 * Script to directly update OrderID range in database
 * Sets orderIdMin to 3584001 and orderIdMax to 3585000
 * This script directly updates the database without decryption issues
 * Usage: npx tsx scripts/update-order-id-range-direct.ts
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

console.log(`✅ DATABASE_URL loaded (starts with: ${dbUrl.substring(0, 30)}...)\n`);

// Now import db after environment is loaded
import { db } from "../packages/db";

const CONFIG_KEY = "payment.ameria.config";
const ORDER_ID_MIN = 3584001;
const ORDER_ID_MAX = 3585000;

async function main() {
  console.log("🚀 Setting OrderID range for Ameria Bank payments...\n");
  console.log(`📊 Target range: ${ORDER_ID_MIN} - ${ORDER_ID_MAX}\n`);

  try {
    // Get existing config from database
    const setting = await db.settings.findUnique({
      where: { key: CONFIG_KEY },
    });

    if (!setting) {
      console.error("❌ Error: Payment configuration not found!");
      console.error("   Please configure payment settings first in the admin panel.");
      process.exit(1);
    }

    const config = setting.value as any;
    
    console.log("📋 Current configuration:");
    console.log(`   Client ID: ${config.clientId || "not set"}`);
    console.log(`   Username: ${config.username || "not set"}`);
    console.log(`   Test Mode: ${config.testMode ?? "not set"}`);
    console.log(`   Current orderIdMin: ${config.orderIdMin || "not set"}`);
    console.log(`   Current orderIdMax: ${config.orderIdMax || "not set"}\n`);

    // Update only the OrderID range, preserve all other fields
    const updatedConfig = {
      ...config,
      orderIdMin: ORDER_ID_MIN,
      orderIdMax: ORDER_ID_MAX,
    };

    // Save to database
    await db.settings.update({
      where: { key: CONFIG_KEY },
      data: {
        value: updatedConfig,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Successfully updated OrderID range!");
    console.log(`\n📊 New configuration:`);
    console.log(`   orderIdMin: ${updatedConfig.orderIdMin}`);
    console.log(`   orderIdMax: ${updatedConfig.orderIdMax}`);
    console.log(`\n💡 From now on, all new orders will get OrderID in the range ${ORDER_ID_MIN} - ${ORDER_ID_MAX}`);
    console.log(`   The OrderID is generated based on the order number hash to ensure consistency.\n`);
  } catch (error: any) {
    console.error("❌ Fatal error:", error);
    if (error.message) {
      console.error(`   Message: ${error.message}`);
    }
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();

