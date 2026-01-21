/**
 * Ameria Payment Service
 * 
 * High-level service for payment operations with Ameria Bank.
 * Handles payment initialization, callback processing, verification, and refunds.
 * 
 * This service provides a business logic layer on top of AmeriaClient,
 * handling database operations, order status updates, and payment lifecycle management.
 * 
 * @example
 * ```typescript
 * // Initialize payment for an order
 * const result = await ameriaPaymentService.initializePayment(
 *   orderId,
 *   1000,
 *   'Order description'
 * );
 * 
 * // Handle callback from bank
 * const callbackResult = await ameriaPaymentService.handleCallback({
 *   PaymentID: 'payment-id',
 *   Opaque: 'order-id',
 * });
 * ```
 */

import { db } from "@white-shop/db";
import { AmeriaClient } from "./ameria-client";
import { paymentConfigService, AmeriaPaymentConfig } from "./payment-config.service";
import { getStoredLanguage } from "../../language";
import { validateTestCard, normalizeTestCardList } from "./test-card-validator";

export interface PaymentInitResult {
  paymentId: string;
  paymentUrl: string;
  orderId: string;
}

export interface PaymentCallbackParams {
  PaymentID?: string;
  paymentID?: string; // From callback URL (lowercase)
  OrderID?: string;
  orderID?: string; // From callback URL (lowercase)
  Opaque?: string; // Your order ID (from callback URL)
  opaque?: string; // From callback URL (lowercase)
  RespCode?: string;
  resposneCode?: string; // From callback URL (note: typo in API!)
  ResponseCode?: string;
  RespMessage?: string;
  currency?: string;
  Approval?: string;
  RRN?: string;
  CardNumber?: string;
  CardHolder?: string;
}

class AmeriaPaymentService {
  /**
   * Generate numeric OrderID for Ameria Bank
   * 
   * If orderIdMin and orderIdMax are configured, generates orderId in that range.
   * Otherwise, converts order.number to a numeric value using hash.
   * 
   * @param orderNumber - Internal order number (e.g., "241225-12345")
   * @param orderIdMin - Minimum order ID (optional)
   * @param orderIdMax - Maximum order ID (optional)
   * @returns Numeric order ID for Ameria Bank
   */
  private generateAmeriaOrderId(orderNumber: string, orderIdMin?: number, orderIdMax?: number): number {
    // If range is configured, generate orderId in that range
    if (orderIdMin !== undefined && orderIdMax !== undefined && orderIdMin < orderIdMax) {
      // Use hash of orderNumber to generate consistent orderId in range
      // This ensures same orderNumber always gets same orderId
      const hash = this.simpleHash(orderNumber);
      const range = orderIdMax - orderIdMin + 1;
      const orderId = orderIdMin + (hash % range);
      console.log(`🔢 [AMERIA PAYMENT] Generated orderId in range [${orderIdMin}, ${orderIdMax}]: ${orderId} (from order ${orderNumber})`);
      return orderId;
    }

    // If no range configured, convert orderNumber to numeric value
    // Remove non-numeric characters and take first 9 digits
    const numericPart = orderNumber.replace(/\D/g, '');
    const orderId = parseInt(numericPart.slice(0, 9)) || Date.now() % 1000000000;
    console.log(`🔢 [AMERIA PAYMENT] Generated orderId from orderNumber: ${orderId} (from order ${orderNumber})`);
    return orderId;
  }

  /**
   * Simple hash function for consistent orderId generation
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get configured Ameria client instance
   */
  private async getClient(): Promise<{ client: AmeriaClient; config: AmeriaPaymentConfig }> {
    const config = await paymentConfigService.getConfig();
    
    if (!config) {
      throw {
        status: 500,
        type: "payment_config_missing",
        title: "Payment Configuration Missing",
        detail: "Ameria Bank payment configuration not found. Please configure it in admin panel.",
      };
    }

    if (!config.isActive) {
      throw {
        status: 503,
        type: "payment_system_inactive",
        title: "Payment System Inactive",
        detail: "Ameria Bank payment system is not active. Please activate it in admin panel.",
      };
    }

    const client = new AmeriaClient({
      clientId: config.clientId,
      username: config.username,
      password: config.password,
      testMode: config.testMode,
      returnUrl: config.returnUrl,
      callbackUrl: config.callbackUrl,
    });

    return { client, config };
  }

  /**
   * Initialize a payment for an order
   * 
   * Creates a payment session with Ameria Bank and returns the payment URL
   * where the customer should be redirected to complete payment.
   * 
   * @param orderId - Internal order ID
   * @param amount - Payment amount
   * @param description - Optional payment description (defaults to "Order {orderNumber}")
   * @returns Payment initialization result with paymentId and paymentUrl
   * @throws Error if order not found, payment initialization fails, or configuration is missing
   * 
   * @example
   * ```typescript
   * const result = await ameriaPaymentService.initializePayment(
   *   'order-123',
   *   5000,
   *   'Order #12345'
   * );
   * // Redirect user to result.paymentUrl
   * ```
   */
  async initializePayment(orderId: string, amount: number, description?: string): Promise<PaymentInitResult> {
    try {
      console.log("💳 [AMERIA PAYMENT] Initializing payment:", {
        orderId,
        amount,
      });

      // Get order details
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw {
          status: 404,
          type: "order_not_found",
          title: "Order Not Found",
          detail: `Order with ID '${orderId}' not found`,
        };
      }

      // Check if payment already exists
      const existingPayment = await db.payment.findFirst({
        where: {
          orderId: order.id,
          provider: "ameria",
          status: { in: ["pending", "processing"] },
        },
      });

      if (existingPayment && existingPayment.providerTransactionId) {
        // Payment already initialized, return existing payment URL
        const { client } = await this.getClient();
        // Get language from order metadata or use default
        const lang = this.getPaymentLanguage(order);
        return {
          paymentId: existingPayment.providerTransactionId,
          paymentUrl: client.getPaymentUrl(existingPayment.providerTransactionId, lang),
          orderId: order.number,
        };
      }

      // Get client and config
      const { client, config } = await this.getClient();

      // Get language for payment page (from order metadata or default)
      const lang = this.getPaymentLanguage(order);

      // Generate numeric orderId for Ameria Bank
      // Ameria requires integer OrderID, so we need to convert order.number to a number
      // If orderIdMin and orderIdMax are configured, use them to generate orderId in range
      const ameriaOrderId = this.generateAmeriaOrderId(order.number, config.orderIdMin, config.orderIdMax);

      // Initialize payment with Ameria
      const initResponse = await client.initPayment({
        orderId: ameriaOrderId,
        amount: amount,
        currency: config.currency,
        description: description || `Order ${order.number}`,
        opaque: order.id, // Store order ID in opaque field for callback matching
        lang: lang,
      });

      // Success criteria: ResponseCode === 1 && ResponseMessage === "OK"
      if (initResponse.ResponseCode !== 1 || initResponse.ResponseMessage !== "OK" || !initResponse.PaymentID) {
        throw {
          status: 400,
          type: "payment_init_failed",
          title: "Payment Initialization Failed",
          detail: initResponse.ResponseMessage || "Failed to initialize payment",
        };
      }

      // Create or update payment record
      const payment = await db.payment.upsert({
        where: {
          id: existingPayment?.id || "new",
        },
        update: {
          providerTransactionId: initResponse.PaymentID,
          status: "processing",
          providerResponse: initResponse as any,
          updatedAt: new Date(),
        },
        create: {
          orderId: order.id,
          provider: "ameria",
          method: "card",
          amount: amount,
          currency: config.currency,
          status: "processing",
          providerTransactionId: initResponse.PaymentID,
          providerResponse: initResponse as any,
        },
      });

      // Update order payment status
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "processing",
        },
      });

      // Create order event
      await db.orderEvent.create({
        data: {
          orderId: order.id,
          type: "payment_initiated",
          data: {
            provider: "ameria",
            paymentId: initResponse.PaymentID,
            amount,
            currency: config.currency,
          },
        },
      });

      console.log("✅ [AMERIA PAYMENT] Payment initialized:", {
        paymentId: initResponse.PaymentID,
        orderNumber: order.number,
      });

      return {
        paymentId: initResponse.PaymentID!,
        paymentUrl: client.getPaymentUrl(initResponse.PaymentID!, lang),
        orderId: order.number,
      };
    } catch (error: any) {
      console.error("❌ [AMERIA PAYMENT] Error initializing payment:", error);
      
      // Re-throw custom errors
      if (error.status && error.type) {
        throw error;
      }

      throw {
        status: 500,
        type: "payment_init_error",
        title: "Payment Initialization Error",
        detail: error.message || "Failed to initialize payment",
      };
    }
  }

  /**
   * Handle callback from Ameria Bank
   * 
   * Processes the callback received when user returns from payment page.
   * **CRITICAL:** Always verifies payment status via GetPaymentDetails API
   * and never trusts URL parameters alone.
   * 
   * @param params - Callback parameters from URL or request body
   * @param params.PaymentID - Payment ID from callback (required)
   * @param params.Opaque - Order ID stored in Opaque field (required for order lookup)
   * @returns Callback processing result with success status and order information
   * @throws Error if payment not found, verification fails, or processing error occurs
   * 
   * @example
   * ```typescript
   * const result = await ameriaPaymentService.handleCallback({
   *   PaymentID: '15C8E0DE-F082-4785-883E-A5FADB093BE2',
   *   Opaque: 'order-123',
   * });
   * 
   * if (result.success) {
   *   // Payment completed successfully
   * }
   * ```
   */
  async handleCallback(params: PaymentCallbackParams): Promise<{
    success: boolean;
    orderId: string;
    paymentId: string;
    message: string;
  }> {
    try {
      console.log("📞 [AMERIA PAYMENT] Handling callback:", params);

      // Extract callback parameters (from URL: paymentID, orderID, resposneCode, Opaque, currency)
      // Note: Parameter names from callback URL may be lowercase or have typos (resposneCode)
      const paymentId = params.PaymentID || params.paymentID;
      const opaque = params.Opaque || params.opaque; // Your order ID

      if (!paymentId) {
        throw {
          status: 400,
          type: "invalid_callback",
          title: "Invalid Callback",
          detail: "PaymentID is required in callback parameters",
        };
      }

      // Get client and config for verification
      // CRITICAL: Always verify via GetPaymentDetails API - never trust URL parameters alone
      const { client, config } = await this.getClient();

      // Get payment details from Ameria to verify status
      const paymentDetails = await client.getPaymentDetails(paymentId);

      // Find payment record
      // First try to find by Opaque (your order ID), then by PaymentID
      let payment = null;
      
      if (opaque) {
        // Try to find order by opaque (order ID stored in Opaque field)
        const order = await db.order.findUnique({
          where: { id: opaque },
          include: {
            payments: {
              where: {
                provider: "ameria",
                providerTransactionId: paymentId,
              },
            },
          },
        });

        if (order && order.payments.length > 0) {
          payment = await db.payment.findUnique({
            where: { id: order.payments[0].id },
            include: {
              order: true,
            },
          });
        }
      }

      // If not found by opaque, try by PaymentID
      if (!payment) {
        payment = await db.payment.findFirst({
          where: {
            providerTransactionId: paymentId,
            provider: "ameria",
          },
          include: {
            order: true,
          },
        });
      }

      if (!payment) {
        throw {
          status: 404,
          type: "payment_not_found",
          title: "Payment Not Found",
          detail: `Payment with ID '${paymentId}' not found`,
        };
      }

      const order = payment.order;

      // Determine payment status based on response code
      // Success criteria according to specification (matching PHP implementation):
      // - ResponseCode === "00" (primary check, as in PHP: $body->ResponseCode == '00')
      // - PaymentState === "Successful" (additional verification)
      // - OrderStatus === 2 (payment_deposited)
      let isSuccess = paymentDetails.ResponseCode === "00" && 
                     paymentDetails.PaymentState === "Successful" &&
                     paymentDetails.OrderStatus === 2;

      // CRITICAL: In test mode, validate test card number BEFORE accepting payment
      // This matches the PHP pattern where validation happens after ResponseCode check
      // Only bank-provided test cards should be accepted
      if (isSuccess && config.testMode) {
        const cardValidation = validateTestCard(
          paymentDetails.CardNumber,
          {
            allowedLast4Digits: config.allowedTestCards || [],
            strictMode: config.testCardStrictMode ?? true,
          },
          config.testMode
        );

        if (!cardValidation.valid) {
          console.error("🚫 [AMERIA PAYMENT] Test card validation failed - rejecting payment:", {
            paymentId,
            orderId: order.number,
            orderIdInternal: order.id,
            cardNumber: paymentDetails.CardNumber,
            cardLast4: cardValidation.cardLast4,
            validationMessage: cardValidation.message,
            allowedCards: config.allowedTestCards || [],
            responseCode: paymentDetails.ResponseCode,
            paymentState: paymentDetails.PaymentState,
            orderStatus: paymentDetails.OrderStatus,
          });

          // Reject payment - mark as failed
          // This prevents accepting payments with unauthorized test cards
          isSuccess = false;
          
          // Update error message with card validation failure
          // Store detailed error message for order notes (similar to PHP: FailedMessageAmeria)
          paymentDetails.RespMessage = cardValidation.message;
          paymentDetails.ResponseMessage = cardValidation.message;
          
          // Log as security event
          console.warn("🔒 [AMERIA PAYMENT] SECURITY: Payment rejected due to unauthorized test card", {
            paymentId,
            orderId: order.number,
            cardLast4: cardValidation.cardLast4,
            timestamp: new Date().toISOString(),
          });
        } else {
          console.log("✅ [AMERIA PAYMENT] Test card validated successfully:", {
            paymentId,
            orderId: order.number,
            cardLast4: cardValidation.cardLast4,
            allowedCards: config.allowedTestCards || [],
          });
        }
      } else if (isSuccess && config.testMode && (!config.allowedTestCards || config.allowedTestCards.length === 0)) {
        // Warning: Test mode enabled but no test cards configured
        console.warn("⚠️ [AMERIA PAYMENT] Test mode enabled but no allowed test cards configured", {
          paymentId,
          orderId: order.number,
          testCardStrictMode: config.testCardStrictMode,
        });
      }

      // Update payment record
      // Store detailed error information (similar to PHP: FailedMessageAmeria meta)
      const errorMessage = !isSuccess 
        ? (paymentDetails.RespMessage || paymentDetails.ResponseMessage || 'Payment failed')
        : null;
      const errorCode = !isSuccess 
        ? (paymentDetails.ResponseCode || paymentDetails.RespCode || 'UNKNOWN')
        : null;

      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccess ? "completed" : "failed",
          providerResponse: paymentDetails as any,
          completedAt: isSuccess ? new Date() : null,
          failedAt: !isSuccess ? new Date() : null,
          errorCode: errorCode,
          errorMessage: errorMessage,
          cardLast4: paymentDetails.CardNumber 
            ? paymentDetails.CardNumber.replace(/\*/g, '').slice(-4) || paymentDetails.CardNumber.slice(-4)
            : null,
          updatedAt: new Date(),
        },
      });

      // Update order status
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: isSuccess ? "paid" : "failed",
          status: isSuccess ? "confirmed" : order.status,
          paidAt: isSuccess ? new Date() : null,
          updatedAt: new Date(),
        },
      });

      // Create order event with detailed information
      // Include test card validation result if applicable
      await db.orderEvent.create({
        data: {
          orderId: order.id,
          type: isSuccess ? "payment_completed" : "payment_failed",
          data: {
            provider: "ameria",
            paymentId,
            responseCode: paymentDetails.ResponseCode,
            respCode: paymentDetails.RespCode, // Legacy
            respMessage: paymentDetails.RespMessage, // Legacy
            paymentState: paymentDetails.PaymentState,
            orderStatus: paymentDetails.OrderStatus,
            amount: payment.amount,
            // Include test mode validation info
            ...(config.testMode && {
              testMode: true,
              cardValidation: paymentDetails.CardNumber ? {
                cardLast4: paymentDetails.CardNumber.replace(/\*/g, '').slice(-4) || paymentDetails.CardNumber.slice(-4),
                allowedCards: config.allowedTestCards || [],
                strictMode: config.testCardStrictMode ?? true,
              } : null,
            }),
            // Include error details for failed payments
            ...(!isSuccess && {
              errorCode: errorCode,
              errorMessage: errorMessage,
            }),
          },
        },
      });

      console.log("✅ [AMERIA PAYMENT] Callback processed:", {
        paymentId,
        orderNumber: order.number,
        success: isSuccess,
      });

      return {
        success: isSuccess,
        orderId: order.number,
        paymentId,
        message: isSuccess 
          ? "Payment completed successfully" 
          : (paymentDetails.RespMessage || paymentDetails.ResponseMessage || "Payment failed"),
      };
    } catch (error: any) {
      console.error("❌ [AMERIA PAYMENT] Error handling callback:", error);
      
      // Re-throw custom errors
      if (error.status && error.type) {
        throw error;
      }

      throw {
        status: 500,
        type: "callback_processing_error",
        title: "Callback Processing Error",
        detail: error.message || "Failed to process payment callback",
      };
    }
  }

  /**
   * Verify payment status
   * 
   * Manually verify payment status by calling GetPaymentDetails API.
   * Useful for polling, manual verification, or background jobs.
   * 
   * @param paymentId - Payment ID to verify
   * @returns Payment verification result with status and order information
   * @throws Error if payment not found or verification fails
   * 
   * @example
   * ```typescript
   * const result = await ameriaPaymentService.verifyPayment('payment-id');
   * console.log('Payment status:', result.status);
   * ```
   */
  async verifyPayment(paymentId: string): Promise<{
    status: string;
    orderId: string;
    amount: number;
    currency: string;
  }> {
    try {
      console.log("🔍 [AMERIA PAYMENT] Verifying payment:", { paymentId });

      const { client } = await this.getClient();
      const paymentDetails = await client.getPaymentDetails(paymentId);

      // Find payment record
      const payment = await db.payment.findFirst({
        where: {
          providerTransactionId: paymentId,
          provider: "ameria",
        },
        include: {
          order: true,
        },
      });

      if (!payment) {
        throw {
          status: 404,
          type: "payment_not_found",
          title: "Payment Not Found",
          detail: `Payment with ID '${paymentId}' not found`,
        };
      }

      // Update payment status based on verification
      // Success criteria: ResponseCode === "00" && PaymentState === "Successful" && OrderStatus === 2
      const isSuccess = paymentDetails.ResponseCode === "00" && 
                       paymentDetails.PaymentState === "Successful" &&
                       paymentDetails.OrderStatus === 2;

      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccess ? "completed" : payment.status,
          providerResponse: paymentDetails as any,
          updatedAt: new Date(),
        },
      });

      return {
        status: isSuccess ? "completed" : payment.status,
        orderId: payment.order.number,
        amount: payment.amount,
        currency: payment.currency,
      };
    } catch (error: any) {
      console.error("❌ [AMERIA PAYMENT] Error verifying payment:", error);
      
      if (error.status && error.type) {
        throw error;
      }

      throw {
        status: 500,
        type: "verification_error",
        title: "Payment Verification Error",
        detail: error.message || "Failed to verify payment",
      };
    }
  }

  /**
   * Refund a payment
   * 
   * Process a full or partial refund for a completed payment.
   * 
   * @param paymentId - Payment ID to refund
   * @param amount - Refund amount (if not provided, full refund)
   * @returns Refund processing result
   * @throws Error if payment not found, payment not completed, or refund fails
   * 
   * @example
   * ```typescript
   * // Full refund
   * await ameriaPaymentService.refundPayment('payment-id');
   * 
   * // Partial refund
   * await ameriaPaymentService.refundPayment('payment-id', 500);
   * ```
   */
  async refundPayment(paymentId: string, amount?: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log("💰 [AMERIA PAYMENT] Processing refund:", { paymentId, amount });

      const { client } = await this.getClient();
      
      // Find payment record
      const payment = await db.payment.findFirst({
        where: {
          providerTransactionId: paymentId,
          provider: "ameria",
        },
        include: {
          order: true,
        },
      });

      if (!payment) {
        throw {
          status: 404,
          type: "payment_not_found",
          title: "Payment Not Found",
          detail: `Payment with ID '${paymentId}' not found`,
        };
      }

      if (payment.status !== "completed") {
        throw {
          status: 400,
          type: "invalid_refund",
          title: "Invalid Refund",
          detail: "Can only refund completed payments",
        };
      }

      // Process refund with Ameria
      const refundResponse = await client.refundPayment(paymentId, amount);

      // Success criteria: ResponseCode === "00"
      if (refundResponse.ResponseCode !== "00") {
        throw {
          status: 400,
          type: "refund_failed",
          title: "Refund Failed",
          detail: refundResponse.ResponseMessage || refundResponse.RespMessage || "Failed to process refund",
        };
      }

      // Update payment record
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: amount && amount < payment.amount ? "partially_refunded" : "refunded",
          providerResponse: {
            ...(payment.providerResponse as any),
            refund: refundResponse,
          } as any,
          updatedAt: new Date(),
        },
      });

      // Create order event
      await db.orderEvent.create({
        data: {
          orderId: payment.order.id,
          type: "payment_refunded",
          data: {
            provider: "ameria",
            paymentId,
            refundAmount: amount || payment.amount,
          },
        },
      });

      console.log("✅ [AMERIA PAYMENT] Refund processed:", { paymentId });

      return {
        success: true,
        message: refundResponse.ResponseMessage || refundResponse.RespMessage || "Refund processed successfully",
      };
    } catch (error: any) {
      console.error("❌ [AMERIA PAYMENT] Error processing refund:", error);
      
      if (error.status && error.type) {
        throw error;
      }

      throw {
        status: 500,
        type: "refund_error",
        title: "Refund Error",
        detail: error.message || "Failed to process refund",
      };
    }
  }

  /**
   * Get payment language from order metadata or use default
   * 
   * @param order Order object (may have metadata with language)
   * @returns Ameria Bank language code ('en' | 'am' | 'ru')
   */
  private getPaymentLanguage(order: any): 'en' | 'am' | 'ru' {
    // Try to get language from order metadata
    if (order.metadata && typeof order.metadata === 'object') {
      const orderLang = order.metadata.language || order.metadata.lang;
      if (orderLang) {
        return AmeriaClient.convertLanguageToAmeria(orderLang);
      }
    }

    // Try to get from stored language (client-side)
    try {
      const storedLang = getStoredLanguage();
      return AmeriaClient.convertLanguageToAmeria(storedLang);
    } catch {
      // If getStoredLanguage fails (server-side), use default
    }

    // Default to English
    return 'en';
  }
}

export const ameriaPaymentService = new AmeriaPaymentService();

