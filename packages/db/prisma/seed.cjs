// Test: Prisma admin seed script with clear logging

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

/** 
 * Seed script to ensure at least one admin user exists.
 * Uses defensive logging so it's easy to see what happens at each step.
 */
async function main() {
  const prisma = new PrismaClient();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";

  console.log("=== [Admin Seed] Start ===");
  console.log("[Admin Seed] Target email:", adminEmail);

  try {
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existing) {
      console.log("[Admin Seed] User already exists, updating roles/password if needed...");

      const roles = Array.isArray(existing.roles) ? existing.roles : [];
      const hasAdmin = roles.includes("admin");

      const passwordHash = adminPassword
        ? await bcrypt.hash(adminPassword, 10)
        : existing.passwordHash;

      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          roles: hasAdmin ? roles : [...roles, "admin"],
          passwordHash,
        },
      });

      console.log("[Admin Seed] Updated existing admin user:", {
        id: updated.id,
        email: updated.email,
        roles: updated.roles,
      });
    } else {
      console.log("[Admin Seed] No user found, creating new admin user...");

      const passwordHash = await bcrypt.hash(adminPassword, 10);

      const created = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          roles: ["admin"],
          emailVerified: true,
          locale: "en",
        },
      });

      console.log("[Admin Seed] Created new admin user:", {
        id: created.id,
        email: created.email,
        roles: created.roles,
      });
    }

    console.log("=== [Admin Seed] Success ===");
  } catch (error) {
    console.error("=== [Admin Seed] ERROR ===");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();


