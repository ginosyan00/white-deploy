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
let prismaClient: PrismaClient =
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
  globalForPrisma.prisma = prismaClient;
}

/**
 * Reconnect Prisma client if connection is lost
 */
async function reconnectPrisma() {
  try {
    console.log('🔄 [DB] Attempting to reconnect Prisma client...');
    await prismaClient.$disconnect().catch(() => {
      // Ignore disconnect errors
    });
    
    // Create new client instance
    prismaClient = new PrismaClient({ 
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      errorFormat: "pretty",
    });
    
    // Test connection with a simple query
    await prismaClient.$queryRaw`SELECT 1`;
    console.log('✅ [DB] Prisma client reconnected successfully');
    
    // Update global cache
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaClient;
    }
    
    return prismaClient;
  } catch (error: any) {
    console.error('❌ [DB] Failed to reconnect Prisma client:', error.message);
    throw error;
  }
}

/**
 * Check if error is a connection error that requires reconnection
 */
function isConnectionError(error: any): boolean {
  return (
    error?.code === 'P1017' || // Server has closed the connection
    error?.code === 'P1001' || // Can't reach database server
    error?.code === 'P1008' || // Operations timed out
    error?.code === 'P1000' || // Authentication failed
    error?.message?.includes('Server has closed the connection') ||
    error?.message?.includes('Connection closed') ||
    error?.message?.includes('Connection terminated') ||
    error?.message?.includes('Connection error')
  );
}

/**
 * Execute Prisma operation with automatic retry on connection errors
 */
export async function executeWithRetry<T>(
  operation: (client: PrismaClient) => Promise<T>,
  retries = 2
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation(prismaClient);
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection error
      if (isConnectionError(error) && attempt < retries) {
        console.warn(`⚠️ [DB] Connection error detected (attempt ${attempt + 1}/${retries + 1}):`, {
          code: error?.code,
          message: error?.message?.substring(0, 100),
        });
        
        try {
          await reconnectPrisma();
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        } catch (reconnectError: any) {
          console.error('❌ [DB] Reconnection failed:', reconnectError.message);
          // If reconnection fails, wait longer before next attempt
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      } else {
        // Not a connection error or no more retries
        throw error;
      }
    }
  }
  
  throw lastError;
}

// Export the client directly - retry logic will be handled in services
export const db = prismaClient;

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prismaClient.$disconnect();
  });
}

