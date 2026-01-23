/**
 * Payment Result Page
 * 
 * Displays payment result in JSON format
 * 
 * URL: /payment/result?success=true|false
 * URL: /payment/result?PaymentID=xxx&ResponseCode=1&ResponseMessage=OK
 */

// Force dynamic rendering to handle query parameters
export const dynamic = 'force-dynamic';

interface PaymentResult {
  PaymentID?: string;
  ResponseCode?: number;
  ResponseMessage?: string;
}

export default function PaymentResultPage({
  searchParams,
}: {
  searchParams: { 
    success?: string;
    PaymentID?: string;
    ResponseCode?: string;
    ResponseMessage?: string;
  };
}) {
  // Build result object from query parameters
  const result: PaymentResult = {};
  
  // If PaymentID, ResponseCode, ResponseMessage are provided, use them
  if (searchParams.PaymentID !== undefined || searchParams.ResponseCode !== undefined) {
    result.PaymentID = searchParams.PaymentID || '';
    result.ResponseCode = searchParams.ResponseCode ? parseInt(searchParams.ResponseCode) : undefined;
    result.ResponseMessage = searchParams.ResponseMessage || '';
  } else {
    // Otherwise, use success parameter (legacy format)
    const success = searchParams.success === 'true';
    result.PaymentID = success ? 'SUCCESS' : '';
    result.ResponseCode = success ? 1 : 550;
    result.ResponseMessage = success ? 'OK' : 'System Error';
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: 'monospace',
      padding: '20px',
      backgroundColor: '#1a1a1a',
      color: '#00ff00',
    }}>
      <pre style={{
        fontSize: '16px',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxWidth: '90%',
      }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}

