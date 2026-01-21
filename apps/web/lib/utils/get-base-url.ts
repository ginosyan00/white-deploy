/**
 * Get Base URL Utility
 * 
 * Returns the base URL for the application, considering:
 * - Environment variables (NEXT_PUBLIC_APP_URL)
 * - Vercel deployment (VERCEL_URL)
 * - Current window location (for client-side)
 * - Default localhost (for development)
 */

/**
 * Get base URL for the application
 * 
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (if set)
 * 2. VERCEL_URL (if deployed on Vercel)
 * 3. window.location.origin (if client-side)
 * 4. localhost:3000 (fallback for development)
 * 
 * @returns Base URL (e.g., "https://yoursite.com" or "http://localhost:3000")
 */
export function getBaseUrl(): string {
  // Server-side: Check environment variables
  if (typeof window === 'undefined') {
    // Priority 1: NEXT_PUBLIC_APP_URL
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    // Priority 2: VERCEL_URL (for Vercel deployments)
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // Fallback: localhost for development
    return 'http://localhost:3000';
  }
  
  // Client-side: Use window.location.origin
  // This automatically works for any domain after deploy
  return window.location.origin;
}

/**
 * Get callback URL for Ameria Bank payments
 * 
 * @returns Full callback URL (e.g., "https://yoursite.com/api/v1/payments/ameria/callback")
 */
export function getCallbackUrl(): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/v1/payments/ameria/callback`;
}





