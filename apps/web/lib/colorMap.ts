// Shared color map for common color names used in filters and admin UI
// This helps render consistent color circles/palette based on color labels.

const COLOR_MAP: Record<string, string> = {
  beige: '#F5F5DC',
  black: '#000000',
  blue: '#0000FF',
  brown: '#A52A2A',
  gray: '#808080',
  grey: '#808080',
  green: '#008000',
  red: '#FF0000',
  white: '#FFFFFF',
  yellow: '#FFFF00',
  orange: '#FFA500',
  pink: '#FFC0CB',
  purple: '#800080',
  navy: '#000080',
  maroon: '#800000',
  teal: '#008080',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  lime: '#00FF00',
  olive: '#808000',
  silver: '#C0C0C0',
  gold: '#FFD700',
  tan: '#D2B48C',
  khaki: '#F0E68C',
  coral: '#FF7F50',
  salmon: '#FA8072',
  turquoise: '#40E0D0',
  violet: '#EE82EE',
  indigo: '#4B0082',
  crimson: '#DC143C',
  lavender: '#E6E6FA',
  peach: '#FFE5B4',
  mint: '#98FB98',
  ivory: '#FFFFF0',
  cream: '#FFFDD0',
};

export function getColorHex(colorName: string): string {
  const normalized = colorName.toLowerCase().trim();
  return COLOR_MAP[normalized] || '#CCCCCC';
}

export { COLOR_MAP };


