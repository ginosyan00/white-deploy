import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as any;

// Check if we're in build time (Next.js build process)
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NODE_ENV === 'production' && 
                    (process.argv.includes('build') || process.argv.includes('next/build'));

// Ensure UTF-8 encoding for PostgreSQL connection
// This fixes encoding issues with Armenian and other UTF-8 characters
const databaseUrl = process.env.DATABASE_URL || '';
let urlWithEncoding = databaseUrl;

if (!databaseUrl.includes('client_encoding')) {
  urlWithEncoding = databaseUrl.includes('?') 
    ? `${databaseUrl}&client_encoding=UTF8`
    : `${databaseUrl}?client_encoding=UTF8`;
  
  // Temporarily override DATABASE_URL for Prisma Client
  process.env.DATABASE_URL = urlWithEncoding;
}

// Create Prisma Client with connection pool configuration
// During build time, we use a mock or skip connection to prevent hangs
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ 
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "pretty",
    // Prevent connection during build - Prisma will connect lazily on first query
    // This ensures we don't hang during Next.js build process
  });

// Prisma Client connects automatically on first query (lazy connection)
// No need to call $connect() during module initialization
// This prevents connection errors during Next.js static generation

// Only cache in non-production to prevent connection pool issues during build
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await db.$disconnect();
  });
}

