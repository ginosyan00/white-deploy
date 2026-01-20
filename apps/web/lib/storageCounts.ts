'use client';

/**
 * Shared storage keys used to keep wishlist, compare and cart data in localStorage.
 */
export const STORAGE_KEYS = {
  wishlist: 'shop_wishlist',
  compare: 'shop_compare',
  cart: 'shop_cart_guest',
} as const;

export const WISHLIST_KEY = STORAGE_KEYS.wishlist;
export const COMPARE_KEY = STORAGE_KEYS.compare;
export const CART_KEY = STORAGE_KEYS.cart;

/**
 * Returns the stored length for an array kept under the provided key.
 */
function getStoredArrayLength(key: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = window.localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Retrieves wishlist items count from localStorage.
 */
export function getWishlistCount(): number {
  return getStoredArrayLength(WISHLIST_KEY);
}

/**
 * Retrieves compare items count from localStorage.
 */
export function getCompareCount(): number {
  return getStoredArrayLength(COMPARE_KEY);
}

