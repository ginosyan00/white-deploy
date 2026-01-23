/**
 * Payment Result Page
 * 
 * Displays payment result (true/false) after Ameria Bank payment callback
 * 
 * URL: /payment/result?success=true|false
 */

// Force dynamic rendering to handle query parameters
export const dynamic = 'force-dynamic';

export default function PaymentResultPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  // Get success status from query parameter
  const success = searchParams.success === 'true';

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: 'monospace',
      fontSize: '48px',
      fontWeight: 'bold',
    }}>
      {success ? 'true' : 'false'}
    </div>
  );
}

