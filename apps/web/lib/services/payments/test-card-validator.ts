/**
 * Test Card Validator
 * 
 * Validates test card numbers in test mode to ensure only bank-provided
 * test cards are accepted. This prevents accepting random card numbers
 * during testing phase.
 */

export interface TestCardConfig {
  /**
   * List of allowed test card last 4 digits
   * Format: ["1234", "5678", "9012"]
   * 
   * These are the last 4 digits of cards provided by the bank for testing.
   * The bank returns CardNumber as "****1234" format, so we validate
   * against the last 4 digits.
   */
  allowedLast4Digits: string[];
  
  /**
   * Whether to enforce strict validation
   * If true, only cards in allowedLast4Digits are accepted
   * If false, validation is skipped (not recommended for test mode)
   */
  strictMode: boolean;
}

/**
 * Default test cards (common test card patterns)
 * These should be replaced with actual test cards provided by Ameria Bank
 */
const DEFAULT_TEST_CARDS: string[] = [
  // Add actual test card last 4 digits provided by bank here
  // Example: "1234", "5678", "9012"
];

/**
 * Validate test card number
 * 
 * @param cardNumber - Card number from payment details (format: "****1234")
 * @param config - Test card validation configuration
 * @param testMode - Whether system is in test mode
 * @returns Validation result with success status and message
 */
export function validateTestCard(
  cardNumber: string | undefined,
  config: TestCardConfig,
  testMode: boolean
): { valid: boolean; message: string; cardLast4?: string } {
  // Skip validation in production mode
  if (!testMode) {
    return {
      valid: true,
      message: "Production mode - card validation skipped",
    };
  }

  // If strict mode is disabled, allow all cards (not recommended)
  if (!config.strictMode) {
    console.warn("⚠️ [TEST CARD VALIDATOR] Strict mode disabled - accepting all cards in test mode");
    return {
      valid: true,
      message: "Strict mode disabled - card accepted",
    };
  }

  // If no card number provided, reject
  if (!cardNumber || cardNumber.trim().length === 0) {
    return {
      valid: false,
      message: "Card number not provided in payment details",
    };
  }

  // Extract last 4 digits from card number
  // Format can be: "****1234" or "1234" or "******1234"
  const cardLast4 = extractLast4Digits(cardNumber);
  
  if (!cardLast4 || cardLast4.length !== 4) {
    return {
      valid: false,
      message: `Invalid card number format: ${cardNumber}`,
      cardLast4,
    };
  }

  // Check if card is in allowed list
  const allowedCards = config.allowedLast4Digits || [];
  
  if (allowedCards.length === 0) {
    console.warn("⚠️ [TEST CARD VALIDATOR] No allowed test cards configured - rejecting all cards");
    return {
      valid: false,
      message: "No allowed test cards configured. Please configure test cards in admin panel.",
      cardLast4,
    };
  }

  const isAllowed = allowedCards.some(
    allowed => allowed.trim() === cardLast4
  );

  if (!isAllowed) {
    console.error("❌ [TEST CARD VALIDATOR] Test card rejected:", {
      cardLast4,
      allowedCards,
      cardNumber,
    });
    
    return {
      valid: false,
      message: `Test card ${cardLast4} is not in the allowed list. Only bank-provided test cards are accepted in test mode.`,
      cardLast4,
    };
  }

  console.log("✅ [TEST CARD VALIDATOR] Test card validated:", {
    cardLast4,
    allowedCards,
  });

  return {
    valid: true,
    message: `Test card ${cardLast4} is valid`,
    cardLast4,
  };
}

/**
 * Extract last 4 digits from card number
 * Handles various formats: "****1234", "1234", "******1234", etc.
 */
function extractLast4Digits(cardNumber: string): string | null {
  // Remove all non-digit characters except asterisks
  const cleaned = cardNumber.replace(/[^\d*]/g, '');
  
  // Extract last 4 digits (after asterisks)
  // Pattern: any number of asterisks followed by 4 digits
  const match = cleaned.match(/\*+(\d{4})$/);
  if (match) {
    return match[1];
  }
  
  // If no asterisks, try to get last 4 digits directly
  const digitsOnly = cleaned.replace(/\*/g, '');
  if (digitsOnly.length >= 4) {
    return digitsOnly.slice(-4);
  }
  
  // If card number is exactly 4 digits, return as is
  if (digitsOnly.length === 4) {
    return digitsOnly;
  }
  
  return null;
}

/**
 * Get default test card configuration
 */
export function getDefaultTestCardConfig(): TestCardConfig {
  return {
    allowedLast4Digits: DEFAULT_TEST_CARDS,
    strictMode: true,
  };
}

/**
 * Normalize test card list (remove duplicates, trim, validate format)
 */
export function normalizeTestCardList(cards: string[]): string[] {
  return cards
    .map(card => card.trim())
    .filter(card => {
      // Only allow 4-digit strings
      return /^\d{4}$/.test(card);
    })
    .filter((card, index, array) => {
      // Remove duplicates
      return array.indexOf(card) === index;
    });
}



