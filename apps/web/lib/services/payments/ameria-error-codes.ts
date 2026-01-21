/**
 * Ameria Bank Error Codes Service
 * 
 * Provides error code translations for Ameria Bank payment gateway.
 * Based on official error codes from Ameria Bank vPOS API documentation.
 */

export type AmeriaLanguage = 'am' | 'ru' | 'en';

interface ErrorCodeMap {
  [code: string]: string;
}

const errorCodes: Record<AmeriaLanguage, ErrorCodeMap> = {
  am: {
    '00': 'Վճարումը հաջողությամբ իրականացվել է:',
    '01': 'Նշված համարով պատվերն արդեն գրանցված է համակարգում:',
    '02': 'Պատվերը մերժվել է վճարման վավերապայմաններում առկա սխալի պատճառով:',
    '03': 'Անհայտ (արգելված) արժույթ',
    '04': 'Բացակայում է հարցման պարտադիր պարամետրը:',
    '05': 'Հարցման պարամետրի նշանակության սխալ:',
    '06': 'Չգրանցված OrderId',
    '07': 'Համակարգի սխալ',
    '20': 'Օգտագործողի անունը կամ ծածկագիրը սխալ է:',
    '30': 'Պատվերի նույնականացման համարը սխալ է:',
    '50': 'Վճարման գումարի սխալ',
    '500': 'Անհայտ սխալ',
    '510': 'Սխալ պարամետրեր',
    '513': 'Refund գործողության թույլտվություն չկա',
    '514': 'Reverse գործողության թույլտվություն չկա',
    '520': 'Ժամանակի սխալ',
    '550': 'Համակարգի սխալ',
    '560': 'Գործողությունը ձախողվել է',
  },
  ru: {
    '00': 'Платеж успешно завершен',
    '01': 'Заказ с указанным номером уже зарегистрирован в системе',
    '02': 'Заказ отклонен из-за ошибки в платежных реквизитах',
    '03': 'Неизвестная (запрещенная) валюта',
    '04': 'Отсутствует обязательный параметр запроса',
    '05': 'Ошибка в значении параметра запроса',
    '06': 'Незарегистрированный OrderId',
    '07': 'Системная ошибка',
    '20': 'Неверное имя пользователя или пароль',
    '30': 'Неверный идентификатор заказа',
    '50': 'Ошибка суммы платежа',
    '500': 'Неизвестная ошибка',
    '510': 'Неверные параметры',
    '513': 'Нет разрешения на операцию Refund',
    '514': 'Нет разрешения на операцию Reverse',
    '520': 'Ошибка времени',
    '550': 'Системная ошибка',
    '560': 'Операция не удалась',
  },
  en: {
    '00': 'Payment successfully completed',
    '01': 'Order with the given number is already registered',
    '02': 'Order declined due to errors in payment details',
    '03': 'Unknown (forbidden) currency',
    '04': 'Required parameter of the request is missing',
    '05': 'Error in request parameters',
    '06': 'Unregistered OrderId',
    '07': 'System Error',
    '20': 'Incorrect Username and Password',
    '30': 'Incorrect Order ID',
    '50': 'Payment sum error',
    '500': 'Unknown error',
    '510': 'Incorrect parameters',
    '513': 'Do not have Refund operation permission',
    '514': 'Do not have Reverse operation permission',
    '520': 'Overtime error',
    '550': 'System Error',
    '560': 'Operation failed',
  },
};

/**
 * Get error message for a given error code
 * 
 * @param code Error code from Ameria Bank API
 * @param language Language for error message ('am' | 'ru' | 'en')
 * @returns Localized error message or default message
 * 
 * @example
 * ```typescript
 * const message = getErrorMessage('01', 'en');
 * // Returns: "Order with the given number is already registered"
 * ```
 */
export function getErrorMessage(
  code: string | number,
  language: AmeriaLanguage = 'en'
): string {
  const codeStr = String(code);
  
  // Try to get message for the specified language
  const message = errorCodes[language]?.[codeStr];
  if (message) {
    return message;
  }

  // Fallback to English if not found
  const englishMessage = errorCodes.en[codeStr];
  if (englishMessage) {
    return englishMessage;
  }

  // Default message if code not found
  return `Unknown error code: ${codeStr}`;
}

/**
 * Check if error code indicates success
 * 
 * @param code Error code from Ameria Bank API
 * @returns true if code indicates success
 */
export function isSuccessCode(code: string | number): boolean {
  return String(code) === '00' || String(code) === '1';
}

/**
 * Check if error code indicates a retryable error
 * 
 * @param code Error code from Ameria Bank API
 * @returns true if error might be retryable
 */
export function isRetryableError(code: string | number): boolean {
  const codeStr = String(code);
  const retryableCodes = ['07', '550', '560', '520']; // System errors, timeouts
  return retryableCodes.includes(codeStr);
}

/**
 * Get all error codes for a language
 * 
 * @param language Language code
 * @returns Map of error codes to messages
 */
export function getAllErrorCodes(language: AmeriaLanguage = 'en'): ErrorCodeMap {
  return { ...errorCodes[language] };
}





