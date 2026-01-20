'use client';

import Image from 'next/image';

interface CartIconProps {
  /**
   * Optional custom size in pixels; defaults to 20.
   */
  size?: number;
  /**
   * Optional className for utility classes (color, spacing, etc.).
   * Note: for bitmap icon this mostly affects layout, not the icon color.
   */
  className?: string;
}

/**
 * Unified Cart icon that uses the provided PNG from Flaticon.
 * Source: https://cdn-icons-png.flaticon.com/512/3081/3081986.png
 */
export function CartIcon({ size = 20, className = '' }: CartIconProps) {
  return (
    <Image
      src="https://cdn-icons-png.flaticon.com/512/3081/3081986.png"
      alt="Cart"
      width={size}
      height={size}
      className={className}
    />
  );
}


