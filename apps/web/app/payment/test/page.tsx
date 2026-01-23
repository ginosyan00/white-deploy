'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@shop/ui';

interface PaymentResponse {
  PaymentID: string;
  ResponseCode: number;
  ResponseMessage: string;
}

export default function PaymentTestPage() {
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [response, setResponse] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useConfig, setUseConfig] = useState(false);
  
  const [formData, setFormData] = useState({
    ClientID: '',
    Username: '',
    Password: '',
    OrderID: Date.now(),
    Amount: 10,
    Currency: '051',
    BackURL: typeof window !== 'undefined' 
      ? `${window.location.origin}/api/v1/payments/ameria/callback`
      : 'https://yoursite.com/api/v1/payments/ameria/callback',
    Description: 'Test payment',
    Opaque: `test-order-${Date.now()}`,
  });

  // Load configuration from database
  const loadConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/v1/admin/payments/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config && data.config.isActive) {
          setFormData(prev => ({
            ...prev,
            ClientID: data.config.clientId || prev.ClientID,
            Username: data.config.username || prev.Username,
            // Don't show password for security
            Currency: data.config.currency || prev.Currency,
            BackURL: data.config.callbackUrl || prev.BackURL,
          }));
          setUseConfig(true);
          console.log('✅ [PAYMENT TEST] Configuration loaded from database');
        } else {
          setError('Payment configuration not found or not active in database');
        }
      } else {
        setError('Failed to load configuration from database');
      }
    } catch (err: any) {
      console.error('❌ [PAYMENT TEST] Error loading config:', err);
      setError('Failed to load configuration: ' + err.message);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    // Try to load config on mount
    loadConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const requestData = {
        ...formData,
        useConfig: useConfig, // Use config from DB if enabled
      };

      // Don't send password if using config (it's stored securely in DB)
      if (useConfig) {
        delete requestData.Password;
      }

      console.log('📤 [PAYMENT TEST] Sending request:', {
        ...requestData,
        Password: useConfig ? '[FROM CONFIG]' : '[PROVIDED]',
      });

      const res = await fetch('/api/v1/payments/ameria/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: PaymentResponse = await res.json();

      console.log('📥 [PAYMENT TEST] Received response:', data);

      if (!res.ok) {
        setError(`HTTP ${res.status}: ${data.ResponseMessage || 'Unknown error'}`);
      }

      setResponse(data);
    } catch (err: any) {
      console.error('❌ [PAYMENT TEST] Error:', err);
      setError(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Ameria Bank Payment Test</h1>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Payment Request</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useConfig}
                  onChange={(e) => {
                    setUseConfig(e.target.checked);
                    if (e.target.checked) {
                      loadConfig();
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Use config from database</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadConfig}
                disabled={loadingConfig}
              >
                {loadingConfig ? 'Loading...' : 'Load Config'}
              </Button>
            </div>
          </div>
          
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> You can use credentials from:
              <br />• Form fields below (manual input)
              <br />• Database configuration (check "Use config from database" and click "Load Config")
              <br />• Environment variables (.env): AMERIA_CLIENT_ID, AMERIA_USERNAME, AMERIA_PASSWORD
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="ClientID"
                type="text"
                value={formData.ClientID}
                onChange={(e) => handleChange('ClientID', e.target.value)}
                required
              />
              <Input
                label="Username"
                type="text"
                value={formData.Username}
                onChange={(e) => handleChange('Username', e.target.value)}
                required
              />
            </div>

            <Input
              label="Password"
              type="password"
              value={formData.Password}
              onChange={(e) => handleChange('Password', e.target.value)}
              required={!useConfig}
              disabled={useConfig}
              placeholder={useConfig ? "Using password from config" : "Enter password"}
            />
            {useConfig && (
              <p className="text-xs text-gray-500 -mt-2">
                Password is loaded from database configuration
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="OrderID"
                type="number"
                value={formData.OrderID}
                onChange={(e) => handleChange('OrderID', parseInt(e.target.value) || 0)}
                required
              />
              <Input
                label="Amount"
                type="number"
                value={formData.Amount}
                onChange={(e) => handleChange('Amount', parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Currency (051=AMD, 978=EUR, 840=USD, 643=RUB)"
                type="text"
                value={formData.Currency}
                onChange={(e) => handleChange('Currency', e.target.value)}
                required
              />
              <Input
                label="BackURL"
                type="url"
                value={formData.BackURL}
                onChange={(e) => handleChange('BackURL', e.target.value)}
                required
              />
            </div>

            <Input
              label="Description"
              type="text"
              value={formData.Description}
              onChange={(e) => handleChange('Description', e.target.value)}
            />

            <Input
              label="Opaque"
              type="text"
              value={formData.Opaque}
              onChange={(e) => handleChange('Opaque', e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-6"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Request'}
          </Button>
        </Card>
      </form>

      {error && (
        <Card className="p-6 mb-6 border-red-200 bg-red-50">
          <h2 className="text-xl font-semibold text-red-900 mb-4">Error</h2>
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {response && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Response</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
          
          {response.ResponseCode === 1 && response.PaymentID && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">✅ Payment initialized successfully!</p>
              <p className="text-green-700 text-sm mt-2">PaymentID: {response.PaymentID}</p>
            </div>
          )}
          
          {response.ResponseCode !== 1 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">❌ Payment initialization failed</p>
              <p className="text-red-700 text-sm mt-2">
                ResponseCode: {response.ResponseCode}
              </p>
              <p className="text-red-700 text-sm">
                ResponseMessage: {response.ResponseMessage}
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

