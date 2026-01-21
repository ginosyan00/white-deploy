/**
 * Payment Configuration Service
 * 
 * Manages storage and retrieval of payment provider configurations.
 * Uses Settings table to store encrypted credentials.
 */

import { db } from "@white-shop/db";
import crypto from "crypto";

const CONFIG_KEY = "payment.ameria.config";
const ENCRYPTION_ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || "default-key-change-in-production-32-chars!!";

export interface AmeriaPaymentConfig {
  clientId: string;
  username: string;
  password: string; // Will be encrypted
  testMode: boolean;
  returnUrl: string;
  callbackUrl: string;
  currency: string;
  isActive: boolean;
  activatedAt?: Date;
  lastValidatedAt?: Date;
}

/**
 * Encrypt sensitive data
 */
function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.substring(0, 32)),
      iv
    );
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("❌ [PAYMENT CONFIG] Encryption error:", error);
    throw new Error("Failed to encrypt payment credentials");
  }
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.substring(0, 32)),
      iv
    );
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("❌ [PAYMENT CONFIG] Decryption error:", error);
    throw new Error("Failed to decrypt payment credentials");
  }
}

class PaymentConfigService {
  /**
   * Get Ameria Bank payment configuration
   */
  async getConfig(): Promise<AmeriaPaymentConfig | null> {
    try {
      const setting = await db.settings.findUnique({
        where: { key: CONFIG_KEY },
      });

      if (!setting) {
        return null;
      }

      const config = setting.value as any;
      
      // Decrypt password if it exists
      if (config.password && typeof config.password === "string") {
        try {
          config.password = decrypt(config.password);
        } catch (error) {
          console.error("❌ [PAYMENT CONFIG] Failed to decrypt password:", error);
          // If decryption fails, password might be in plain text (migration case)
          // Keep it as is for now
        }
      }

      return {
        clientId: config.clientId || "",
        username: config.username || "",
        password: config.password || "",
        testMode: config.testMode ?? true,
        returnUrl: config.returnUrl || "",
        callbackUrl: config.callbackUrl || "",
        currency: config.currency || "AMD",
        isActive: config.isActive ?? false,
        activatedAt: config.activatedAt ? new Date(config.activatedAt) : undefined,
        lastValidatedAt: config.lastValidatedAt ? new Date(config.lastValidatedAt) : undefined,
      };
    } catch (error: any) {
      console.error("❌ [PAYMENT CONFIG] Error getting config:", error);
      throw {
        status: 500,
        type: "config_retrieval_error",
        title: "Configuration Retrieval Failed",
        detail: error.message || "Failed to retrieve payment configuration",
      };
    }
  }

  /**
   * Save Ameria Bank payment configuration
   */
  async saveConfig(config: Partial<AmeriaPaymentConfig>): Promise<AmeriaPaymentConfig> {
    try {
      console.log("💾 [PAYMENT CONFIG] Saving configuration...");

      // Get existing config to preserve fields not being updated
      const existing = await this.getConfig();
      
      const updatedConfig: any = {
        ...existing,
        ...config,
      };

      // Encrypt password if provided
      if (config.password && config.password !== existing?.password) {
        updatedConfig.password = encrypt(config.password);
      } else if (existing?.password && !config.password) {
        // Keep existing encrypted password if not updating
        updatedConfig.password = existing.password;
      }

      // Ensure required fields
      if (!updatedConfig.clientId || !updatedConfig.username || !updatedConfig.password) {
        throw {
          status: 400,
          type: "validation_error",
          title: "Validation Error",
          detail: "Client ID, Username, and Password are required",
        };
      }

      // Update timestamps
      if (config.isActive && !existing?.isActive) {
        updatedConfig.activatedAt = new Date().toISOString();
      }
      if (config.testMode !== undefined) {
        updatedConfig.lastValidatedAt = new Date().toISOString();
      }

      // Save to database
      await db.settings.upsert({
        where: { key: CONFIG_KEY },
        update: {
          value: updatedConfig,
          updatedAt: new Date(),
        },
        create: {
          key: CONFIG_KEY,
          value: updatedConfig,
          description: "Ameria Bank payment gateway configuration",
        },
      });

      console.log("✅ [PAYMENT CONFIG] Configuration saved successfully");

      // Return decrypted config for response
      const savedConfig = await this.getConfig();
      if (!savedConfig) {
        throw new Error("Failed to retrieve saved configuration");
      }

      return savedConfig;
    } catch (error: any) {
      console.error("❌ [PAYMENT CONFIG] Error saving config:", error);
      
      // Re-throw custom errors
      if (error.status && error.type) {
        throw error;
      }

      throw {
        status: 500,
        type: "config_save_error",
        title: "Configuration Save Failed",
        detail: error.message || "Failed to save payment configuration",
      };
    }
  }

  /**
   * Validate configuration fields
   */
  validateConfig(config: Partial<AmeriaPaymentConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.clientId || config.clientId.trim().length === 0) {
      errors.push("Client ID is required");
    }

    if (!config.username || config.username.trim().length === 0) {
      errors.push("Username is required");
    }

    if (!config.password || config.password.trim().length === 0) {
      errors.push("Password is required");
    }

    if (!config.returnUrl || config.returnUrl.trim().length === 0) {
      errors.push("Return URL is required");
    } else {
      try {
        new URL(config.returnUrl);
      } catch {
        errors.push("Return URL must be a valid URL");
      }
    }

    if (!config.callbackUrl || config.callbackUrl.trim().length === 0) {
      errors.push("Callback URL is required");
    } else {
      try {
        new URL(config.callbackUrl);
      } catch {
        errors.push("Callback URL must be a valid URL");
      }
    }

    if (!config.currency || config.currency.trim().length === 0) {
      errors.push("Currency is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Deactivate payment configuration
   */
  async deactivate(): Promise<void> {
    try {
      const config = await this.getConfig();
      if (!config) {
        return;
      }

      await this.saveConfig({
        ...config,
        isActive: false,
      });

      console.log("✅ [PAYMENT CONFIG] Payment system deactivated");
    } catch (error: any) {
      console.error("❌ [PAYMENT CONFIG] Error deactivating:", error);
      throw {
        status: 500,
        type: "deactivation_error",
        title: "Deactivation Failed",
        detail: error.message || "Failed to deactivate payment system",
      };
    }
  }
}

export const paymentConfigService = new PaymentConfigService();





