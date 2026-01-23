/**
 * Ameria Bank vPOS API Client
 * 
 * This client handles all HTTP communication with Ameria Bank's vPOS API.
 * It encapsulates authentication, request formatting, and response parsing.
 * 
 * @example
 * ```typescript
 * const client = new AmeriaClient({
 *   clientId: 'your-client-id',
 *   username: 'your-username',
 *   password: 'your-password',
 *   testMode: true,
 *   returnUrl: 'https://yoursite.com/api/payment/callback',
 *   callbackUrl: 'https://yoursite.com/api/payment/callback',
 * });
 * 
 * const result = await client.initPayment({
 *   orderId: '12345',
 *   amount: 1000,
 *   currency: 'AMD',
 *   description: 'Order #12345',
 * });
 * ```
 */

interface AmeriaConfig {
  clientId: string;
  username: string;
  password: string;
  testMode: boolean;
  returnUrl: string;
  callbackUrl: string;
}

interface InitPaymentRequest {
  ClientID: string; // Note: ClientID (not ClientId)
  Username: string;
  Password: string;
  OrderID: number | string; // integer per docs
  Amount: number;
  Currency: string; // ISO code: 051=AMD, 978=EUR, 840=USD, 643=RUB
  BackURL: string; // Note: BackURL (not ReturnURL)
  Description?: string;
  Opaque?: string;
  CardHolderID?: string;
  Timeout?: number; // Maximum: 1200 seconds (20 minutes)
}

interface InitPaymentResponse {
  PaymentID?: string;
  ResponseCode: number; // 1 = success
  ResponseMessage: string; // "OK" = success
}

interface PaymentDetailsResponse {
  ResponseCode: string; // "00" = success
  PaymentState?: string; // "Successful" = success
  OrderStatus?: number; // 0-6, see OrderStatus codes
  Amount?: number;
  ApprovedAmount?: number;
  DepositedAmount?: number;
  Currency?: string;
  OrderID?: number; // Bank's order ID
  PaymentID: string;
  Opaque?: string; // Your order ID
  CardNumber?: string; // Masked: ****1234
  ClientName?: string;
  ClientEmail?: string;
  DateTime?: string;
  ApprovalCode?: string;
  rrn?: string;
  TransactionID?: string;
  MerchantId?: string;
  TerminalId?: string;
  Description?: string;
  TrxnDescription?: string;
  PaymentType?: number; // 5=MainRest/Arca, 6=Binding, 7=PayPal
  PrimaryRC?: string;
  ExpDate?: string;
  ProcessingIP?: string;
  RefundedAmount?: number;
  CardHolderID?: string;
  BindingID?: string;
  ActionCode?: string;
  ExchangeRate?: number;
  MDOrderID?: string;
  // Legacy fields for backward compatibility
  RespCode?: string;
  RespMessage?: string;
}

interface RefundRequest {
  PaymentID: string;
  Username: string;
  Password: string;
  Amount?: number; // If not provided, full refund
}

interface RefundResponse {
  ResponseCode: string; // "00" = success
  ResponseMessage?: string;
  PaymentID?: string;
  // Legacy fields for backward compatibility
  RespCode?: string;
  RespMessage?: string;
}

interface CancelPaymentRequest {
  PaymentID: string;
  Username: string;
  Password: string;
}

interface CancelPaymentResponse {
  ResponseCode: string; // "00" = success
  ResponseMessage?: string;
  PaymentID?: string;
  // Legacy fields for backward compatibility
  RespCode?: string;
  RespMessage?: string;
}

export class AmeriaClient {
  private config: AmeriaConfig;
  private baseUrl: string;

  constructor(config: AmeriaConfig) {
    this.config = config;
    // Ameria Bank vPOS API endpoints
    // Test: https://servicestest.ameriabank.am/VPOS
    // Live: https://services.ameriabank.am/VPOS
    this.baseUrl = config.testMode
      ? 'https://servicestest.ameriabank.am/VPOS'
      : 'https://services.ameriabank.am/VPOS';
  }

  /**
   * Initialize a payment transaction
   * Creates a payment session and returns PaymentID for redirect
   * 
   * @param params Payment initialization parameters
   * @param params.orderId Order ID (must be unique integer or string)
   * @param params.amount Payment amount
   * @param params.currency Currency code (will be converted to ISO code: 051=AMD, 978=EUR, 840=USD, 643=RUB)
   * @param params.description Transaction description
   * @param params.opaque Additional data (recommended: store your order ID here)
   * @param params.lang Interface language: 'am' (Armenian), 'ru' (Russian), 'en' (English)
   * @returns Payment initialization response with PaymentID
   */
  async initPayment(params: {
    orderId: string | number;
    amount: number;
    currency: string;
    description?: string;
    opaque?: string;
    lang?: string; // 'am' | 'ru' | 'en', default: 'en'
  }): Promise<InitPaymentResponse> {
    console.log('🏦 [AMERIA CLIENT] Initializing payment:', {
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency,
      testMode: this.config.testMode,
    });

    // Validate and normalize amount
    // Ameria Bank requires integer amounts (no decimals)
    // In test mode, minimum amount is 10 AMD
    let normalizedAmount = Math.round(params.amount);
    
    if (normalizedAmount <= 0) {
      throw {
        status: 400,
        type: 'invalid_amount',
        title: 'Invalid Amount',
        detail: 'Payment amount must be greater than 0',
      };
    }

    if (this.config.testMode && normalizedAmount < 10) {
      throw {
        status: 400,
        type: 'test_mode_amount_error',
        title: 'Test Mode Amount Error',
        detail: 'In test mode amount must be at least 10 AMD',
      };
    }

    // Convert currency to ISO code format
    const currencyCode = this.getCurrencyCode(params.currency);

    const request: InitPaymentRequest = {
      ClientID: this.config.clientId, // Note: ClientID (not ClientId)
      Username: this.config.username,
      Password: this.config.password,
      OrderID: params.orderId,
      Amount: normalizedAmount, // Use normalized integer amount
      Currency: currencyCode,
      BackURL: this.config.returnUrl, // Note: BackURL (not ReturnURL)
      Description: params.description || '',
      Opaque: params.opaque || String(params.orderId), // Store order ID in Opaque
      Timeout: 1200, // 20 minutes default
    };

    console.log('📤 [AMERIA CLIENT] Sending InitPayment request:', {
      orderId: request.OrderID,
      amount: request.Amount,
      originalAmount: params.amount,
      currency: currencyCode,
      testMode: this.config.testMode,
    });

    try {
      const response = await fetch(`${this.baseUrl}/api/VPOS/InitPayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: InitPaymentResponse = await response.json();
      
      // Success criteria: ResponseCode === 1 && ResponseMessage === "OK"
      if (data.ResponseCode !== 1 || data.ResponseMessage !== "OK") {
        const errorMessage = data.ResponseMessage || `Payment initialization failed (ResponseCode: ${data.ResponseCode})`;
        console.error('❌ [AMERIA CLIENT] InitPayment failed:', {
          responseCode: data.ResponseCode,
          responseMessage: data.ResponseMessage,
          request: {
            orderId: params.orderId,
            amount: normalizedAmount,
            originalAmount: params.amount,
            currency: params.currency,
            testMode: this.config.testMode,
            clientId: this.config.clientId,
            username: this.config.username,
            // Don't log password for security
          },
        });
        
        // Check for common error scenarios and provide clearer messages
        const lowerMessage = errorMessage.toLowerCase();
        
        // Check if error is about test mode amount
        if (this.config.testMode && (lowerMessage.includes('test mode') || lowerMessage.includes('amount'))) {
          throw {
            status: 400,
            type: 'test_mode_amount_error',
            title: 'Test Mode Amount Error',
            detail: errorMessage || 'In test mode amount must be at least 10 AMD',
          };
        }
        
        // Check for authentication/credential errors
        if (lowerMessage.includes('invalid') && (lowerMessage.includes('client') || lowerMessage.includes('username') || lowerMessage.includes('password') || lowerMessage.includes('credential'))) {
          throw {
            status: 401,
            type: 'payment_auth_error',
            title: 'Payment Authentication Failed',
            detail: 'Invalid payment credentials. Please check your Client ID, Username, and Password in the payment settings.',
          };
        }
        
        // Generic payment initialization error
        throw {
          status: 400,
          type: 'payment_init_error',
          title: 'Payment Initialization Failed',
          detail: errorMessage,
        };
      }

      console.log('✅ [AMERIA CLIENT] Payment initialized:', {
        paymentId: data.PaymentID,
        responseCode: data.ResponseCode,
        responseMessage: data.ResponseMessage,
      });

      return data;
    } catch (error: any) {
      console.error('❌ [AMERIA CLIENT] Error initializing payment:', {
        error: error.message,
        stack: error.stack,
        status: error.status,
        type: error.type,
        detail: error.detail,
      });
      
      // Re-throw custom errors (already formatted)
      if (error.status && error.type) {
        throw error;
      }
      
      // Wrap other errors
      throw {
        status: 500,
        type: 'payment_init_error',
        title: 'Payment Initialization Failed',
        detail: error.message || 'Failed to initialize payment with Ameria Bank',
      };
    }
  }

  /**
   * Get payment details by PaymentID
   * Used to verify payment status after callback
   * 
   * IMPORTANT: ClientID is NOT required in GetPaymentDetails request (unlike InitPayment)
   * 
   * @param paymentId Payment ID from InitPayment response or callback
   * @returns Payment details with status information
   */
  async getPaymentDetails(paymentId: string): Promise<PaymentDetailsResponse> {
    console.log('🔍 [AMERIA CLIENT] Getting payment details:', { paymentId });

    // Note: ClientID is NOT required in GetPaymentDetails request
    const request = {
      Username: this.config.username,
      Password: this.config.password,
      PaymentID: paymentId,
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/VPOS/GetPaymentDetails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PaymentDetailsResponse = await response.json();
      
      // Log response details
      if (data.ResponseCode === "00") {
        console.log('✅ [AMERIA CLIENT] Payment details retrieved:', {
          paymentId: data.PaymentID,
          responseCode: data.ResponseCode,
          paymentState: data.PaymentState,
          orderStatus: data.OrderStatus,
          amount: data.Amount,
          currency: data.Currency,
        });
      } else {
        console.warn('⚠️ [AMERIA CLIENT] GetPaymentDetails returned error:', {
          paymentId: data.PaymentID,
          responseCode: data.ResponseCode,
          responseMessage: data.RespMessage,
        });
      }

      return data;
    } catch (error: any) {
      console.error('❌ [AMERIA CLIENT] Error getting payment details:', {
        error: error.message,
        paymentId,
      });
      throw {
        status: 500,
        type: 'payment_details_error',
        title: 'Payment Details Retrieval Failed',
        detail: error.message || 'Failed to retrieve payment details from Ameria Bank',
      };
    }
  }

  /**
   * Refund a payment (full or partial)
   * 
   * @param paymentId Payment ID to refund
   * @param amount Refund amount (if not provided, full refund)
   * @returns Refund response
   */
  async refundPayment(paymentId: string, amount?: number): Promise<RefundResponse> {
    console.log('💰 [AMERIA CLIENT] Processing refund:', {
      paymentId,
      amount: amount || 'full',
    });

    const request: RefundRequest = {
      PaymentID: paymentId,
      Username: this.config.username,
      Password: this.config.password,
      Amount: amount,
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/VPOS/RefundPayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RefundResponse = await response.json();
      
      // Success: ResponseCode === "00"
      if (data.ResponseCode !== "00") {
        throw new Error(data.ResponseMessage || 'Refund failed');
      }
      
      console.log('✅ [AMERIA CLIENT] Refund processed:', {
        paymentId: data.PaymentID,
        responseCode: data.ResponseCode,
        responseMessage: data.ResponseMessage,
      });

      return data;
    } catch (error: any) {
      console.error('❌ [AMERIA CLIENT] Error processing refund:', {
        error: error.message,
        paymentId,
      });
      throw {
        status: 500,
        type: 'refund_error',
        title: 'Refund Failed',
        detail: error.message || 'Failed to process refund with Ameria Bank',
      };
    }
  }

  /**
   * Cancel a pending payment
   * Can only cancel payments within 72 hours after payment completion
   * 
   * @param paymentId Payment ID to cancel
   * @returns Cancel response
   */
  async cancelPayment(paymentId: string): Promise<CancelPaymentResponse> {
    console.log('🚫 [AMERIA CLIENT] Cancelling payment:', { paymentId });

    const request: CancelPaymentRequest = {
      PaymentID: paymentId,
      Username: this.config.username,
      Password: this.config.password,
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/VPOS/CancelPayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CancelPaymentResponse = await response.json();
      
      // Success: ResponseCode === "00"
      if (data.ResponseCode !== "00") {
        throw new Error(data.ResponseMessage || 'Payment cancellation failed');
      }
      
      console.log('✅ [AMERIA CLIENT] Payment cancelled:', {
        paymentId: data.PaymentID,
        responseCode: data.ResponseCode,
        responseMessage: data.ResponseMessage,
      });

      return data;
    } catch (error: any) {
      console.error('❌ [AMERIA CLIENT] Error cancelling payment:', {
        error: error.message,
        paymentId,
      });
      throw {
        status: 500,
        type: 'cancel_error',
        title: 'Payment Cancellation Failed',
        detail: error.message || 'Failed to cancel payment with Ameria Bank',
      };
    }
  }

  /**
   * Test connection to Ameria API
   * Uses InitPayment with minimal amount to verify credentials
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    console.log('🧪 [AMERIA CLIENT] Testing connection to Ameria API...');

    try {
      // Generate unique numeric orderId for test
      const testOrderId = Date.now();
      
      // In test mode, Ameria requires minimum 10 AMD
      const testAmount = this.config.testMode ? 10 : 1;
      
      // Try to initialize a test payment
      const testResponse = await this.initPayment({
        orderId: testOrderId,
        amount: testAmount,
        currency: 'AMD',
        description: 'Connection test',
        opaque: String(testOrderId), // Store orderId in Opaque as required by Ameria
      });

      // Success criteria: ResponseCode === 1 && ResponseMessage === "OK"
      if (testResponse.ResponseCode === 1 && testResponse.ResponseMessage === "OK" && testResponse.PaymentID) {
        return {
          success: true,
          message: 'Connection successful. Credentials are valid.',
        };
      } else {
        return {
          success: false,
          message: testResponse.ResponseMessage || 'Connection test failed',
        };
      }
    } catch (error: any) {
      console.error('❌ [AMERIA CLIENT] Connection test failed:', error);
      return {
        success: false,
        message: error.detail || error.message || 'Failed to connect to Ameria Bank API',
      };
    }
  }

  /**
   * Get payment redirect URL
   * Constructs the URL where user should be redirected to complete payment
   * 
   * Format: {BASE_PAYMENT_URL}/Payments/Pay?id={PaymentID}&lang={lang}
   * 
   * According to documentation:
   * - Test: https://servicestest.ameriabank.am/VPOS/Payments/Pay?id={PaymentID}&lang={lang}
   * - Production: https://services.ameriabank.am/VPOS/Payments/Pay?id={PaymentID}&lang={lang}
   * 
   * @param paymentId Payment ID from InitPayment response
   * @param lang Interface language: 'am' (Armenian), 'ru' (Russian), 'en' (English)
   * @returns Payment page URL
   */
  getPaymentUrl(paymentId: string, lang: string = 'en'): string {
    // Validate paymentId
    if (!paymentId || paymentId.trim().length === 0) {
      throw new Error('PaymentID is required to generate payment URL');
    }

    // Validate and normalize lang parameter
    const normalizedLang = this.normalizeLanguage(lang);
    
    // Base URLs according to documentation
    const paymentBaseUrl = this.config.testMode
      ? 'https://servicestest.ameriabank.am/VPOS/Payments/Pay'
      : 'https://services.ameriabank.am/VPOS/Payments/Pay';
    
    // Construct URL according to documentation format
    // Parameter name is 'id' (not 'PaymentID') and 'lang' is required
    const paymentUrl = `${paymentBaseUrl}?id=${encodeURIComponent(paymentId)}&lang=${normalizedLang}`;
    
    // Validate generated URL - must be from Ameria Bank
    if (!paymentUrl.includes('ameriabank.am')) {
      console.error('❌ [AMERIA CLIENT] Generated URL is not from Ameria Bank:', paymentUrl);
      throw new Error('Invalid payment URL generated. URL must be from Ameria Bank.');
    }
    
    // Ensure URL is not from Arca or other providers
    if (paymentUrl.includes('arca.am') || paymentUrl.includes('processform.do')) {
      console.error('❌ [AMERIA CLIENT] Generated URL is from wrong provider:', paymentUrl);
      throw new Error('Invalid payment URL generated. URL must be from Ameria Bank, not Arca.');
    }
    
    console.log('🔗 [AMERIA CLIENT] Generated payment URL:', {
      testMode: this.config.testMode,
      paymentId,
      lang: normalizedLang,
      url: paymentUrl,
    });
    
    return paymentUrl;
  }

  /**
   * Normalize language code to Ameria Bank format
   * 
   * @param lang Language code
   * @returns Normalized language code ('en', 'am', or 'ru')
   */
  private normalizeLanguage(lang: string): 'en' | 'am' | 'ru' {
    const normalized = AmeriaClient.convertLanguageToAmeria(lang);
    return normalized;
  }

  /**
   * Convert currency code to Ameria Bank ISO format
   * 
   * @param currency Currency code (AMD, EUR, USD, RUB, etc.)
   * @returns ISO currency code (051=AMD, 978=EUR, 840=USD, 643=RUB)
   */
  private getCurrencyCode(currency: string): string {
    const currencyMap: Record<string, string> = {
      'AMD': '051',
      'EUR': '978',
      'USD': '840',
      'RUB': '643',
      'SEK': '752',
      'GBP': '826',
    };

    const upperCurrency = currency.toUpperCase();
    return currencyMap[upperCurrency] || '051'; // Default to AMD
  }

  /**
   * Convert language code to Ameria Bank format
   * 
   * @param lang Language code (en, hy, ru)
   * @returns Ameria Bank language code (en, am, ru)
   */
  static convertLanguageToAmeria(lang: string): 'en' | 'am' | 'ru' {
    const langMap: Record<string, 'en' | 'am' | 'ru'> = {
      'en': 'en',
      'hy': 'am', // Armenian -> am
      'ru': 'ru',
      'am': 'am', // Already in Ameria format
    };

    const lowerLang = lang.toLowerCase();
    return langMap[lowerLang] || 'en'; // Default to English
  }
}

