import { NextRequest, NextResponse } from "next/server";
import { AmeriaClient } from "@/lib/services/payments/ameria-client";
import { paymentConfigService } from "@/lib/services/payments/payment-config.service";

/**
 * POST /api/v1/payments/ameria/init
 * Initialize payment directly with Ameria Bank
 * 
 * Accepts direct payment initialization request from frontend.
 * If credentials are not provided, uses configuration from database or .env
 * Returns the response from Ameria Bank API
 */
export async function POST(req: NextRequest) {
  try {
    console.log("💳 [AMERIA INIT] Received payment initialization request");

    const body = await req.json();
    
    // Extract request parameters
    let {
      ClientID,
      Username,
      Password,
      OrderID,
      Amount,
      Currency,
      BackURL,
      Description,
      Opaque,
      useConfig = false, // If true, use config from DB instead of provided credentials
    } = body;

    // If useConfig is true, load from database configuration
    if (useConfig) {
      try {
        const config = await paymentConfigService.getConfig();
        if (config && config.isActive) {
          ClientID = config.clientId;
          Username = config.username;
          Password = config.password;
          if (!BackURL) {
            BackURL = config.callbackUrl;
          }
          if (!Currency) {
            Currency = config.currency;
          }
          console.log("✅ [AMERIA INIT] Using configuration from database");
        } else {
          return NextResponse.json(
            {
              PaymentID: "",
              ResponseCode: 400,
              ResponseMessage: "Payment configuration not found or not active",
            },
            { status: 400 }
          );
        }
      } catch (error: any) {
        console.error("❌ [AMERIA INIT] Error loading config from DB:", error);
        // Fall through to try .env or provided credentials
      }
    }

    // If still no credentials, try .env variables (for testing)
    if ((!ClientID || !Username || !Password) && !useConfig) {
      ClientID = ClientID || process.env.AMERIA_CLIENT_ID || '';
      Username = Username || process.env.AMERIA_USERNAME || '';
      Password = Password || process.env.AMERIA_PASSWORD || '';
      
      if (ClientID && Username && Password) {
        console.log("✅ [AMERIA INIT] Using credentials from .env");
      }
    }

    // Validate required fields
    const validationErrors: string[] = [];
    
    if (!ClientID || ClientID.trim().length === 0) {
      validationErrors.push('ClientID is required (provide in request, or set in DB config, or set AMERIA_CLIENT_ID in .env)');
    }
    
    if (!Username || Username.trim().length === 0) {
      validationErrors.push('Username is required (provide in request, or set in DB config, or set AMERIA_USERNAME in .env)');
    }
    
    if (!Password || Password.trim().length === 0) {
      validationErrors.push('Password is required (provide in request, or set in DB config, or set AMERIA_PASSWORD in .env)');
    }
    
    if (!OrderID) {
      validationErrors.push('OrderID is required');
    }
    
    if (!Amount || Amount <= 0) {
      validationErrors.push('Amount must be greater than 0');
    }
    
    if (!Currency || Currency.trim().length === 0) {
      validationErrors.push('Currency is required');
    }
    
    if (!BackURL || BackURL.trim().length === 0) {
      validationErrors.push('BackURL is required');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          PaymentID: "",
          ResponseCode: 400,
          ResponseMessage: `Validation error: ${validationErrors.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Determine test mode
    // Check from config if available, otherwise from URL or credentials
    let isTestMode = false;
    if (useConfig) {
      try {
        const config = await paymentConfigService.getConfig();
        if (config) {
          isTestMode = config.testMode;
        }
      } catch (error) {
        // Fall through
      }
    }
    
    if (!isTestMode) {
      // Determine from environment or URL
      isTestMode = process.env.AMERIA_TEST_MODE === 'true' ||
                   BackURL.includes('localhost') || 
                   BackURL.includes('127.0.0.1') || 
                   Username.includes('test') || 
                   ClientID.includes('test');
    }

    // Create Ameria client
    const client = new AmeriaClient({
      clientId: ClientID,
      username: Username,
      password: Password,
      testMode: isTestMode,
      returnUrl: BackURL,
      callbackUrl: BackURL,
    });

    // Initialize payment
    console.log("💳 [AMERIA INIT] Initializing payment with Ameria Bank:", {
      OrderID,
      Amount,
      Currency,
      isTestMode,
    });

    // Initialize payment
    // Note: AmeriaClient.initPayment() will convert currency codes automatically
    // It accepts both ISO codes (051, 978, etc.) and currency names (AMD, EUR, etc.)
    const result = await client.initPayment({
      orderId: OrderID,
      amount: Amount,
      currency: Currency, // Can be "051" or "AMD" - client will handle conversion
      description: Description || 'Payment',
      opaque: Opaque || String(OrderID),
    });

    // Return response in the same format as Ameria Bank API
    return NextResponse.json({
      PaymentID: result.PaymentID || "",
      ResponseCode: result.ResponseCode,
      ResponseMessage: result.ResponseMessage,
    });

  } catch (error: any) {
    console.error("❌ [AMERIA INIT] Error initializing payment:", error);
    
    // Return error in Ameria Bank format
    return NextResponse.json(
      {
        PaymentID: "",
        ResponseCode: error.status || 500,
        ResponseMessage: error.detail || error.message || "System Error",
      },
      { status: error.status || 500 }
    );
  }
}

