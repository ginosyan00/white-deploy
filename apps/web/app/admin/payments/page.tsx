'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Button, Input } from '@shop/ui';
import { apiClient } from '../../../lib/api-client';
import { AdminMenuDrawer } from '../../../components/AdminMenuDrawer';
import { getAdminMenuTABS } from '../admin-menu.config';
import { useTranslation } from '../../../lib/i18n-client';
import { getCallbackUrl } from '../../../lib/utils/get-base-url';

interface AmeriaConfig {
  clientId: string;
  username: string;
  password: string;
  testMode: boolean;
  returnUrl: string;
  callbackUrl: string;
  currency: string;
  isActive: boolean;
  activatedAt?: string;
  lastValidatedAt?: string;
}

export default function PaymentsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<Partial<AmeriaConfig>>({
    clientId: '',
    username: '',
    password: '',
    testMode: true,
    returnUrl: '',
    callbackUrl: '',
    currency: 'AMD',
    isActive: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPath, setCurrentPath] = useState('/admin/payments');

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
      return;
    }
    if (!isLoading && !isAdmin) {
      router.push('/');
      return;
    }
  }, [isLoading, isLoggedIn, isAdmin, router]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<{ config: AmeriaConfig | null }>('/api/v1/admin/payments/config');
      
      // Always ensure callback URL is set (auto-detect from current domain)
      const callbackUrl = getCallbackUrl();
      
      if (response.config) {
        setConfig({
          ...response.config,
          password: '', // Don't show password, require re-entry
          // Auto-update callback URLs if they're empty or incorrect
          returnUrl: response.config.returnUrl || callbackUrl,
          callbackUrl: response.config.callbackUrl || callbackUrl,
        });
      } else {
        // Set default callback URLs based on current domain
        // This will automatically use the correct URL after deploy
        setConfig({
          ...config,
          returnUrl: callbackUrl, // BackURL must point to callback endpoint
          callbackUrl: callbackUrl, // Same as returnUrl
        });
      }
    } catch (err: any) {
      console.error('Error fetching config:', err);
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate required fields
      if (!config.clientId || !config.username || !config.password || 
          !config.returnUrl || !config.callbackUrl) {
        setError('All fields are required');
        return;
      }

      const response = await apiClient.post<{ config: AmeriaConfig }>('/api/v1/admin/payments/config', {
        ...config,
        isActive: false, // Don't auto-activate, require validation first
      });

      setConfig(response.config);
      setSuccess('Configuration saved successfully. Please validate and activate.');
    } catch (err: any) {
      console.error('Error saving config:', err);
      setError(err.detail || err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleValidateAndActivate = async () => {
    try {
      setValidating(true);
      setError(null);
      setSuccess(null);

      // First save if needed
      if (!config.clientId || !config.username || !config.password) {
        setError('Please fill in all required fields first');
        return;
      }

      // Save configuration
      await apiClient.post('/api/v1/admin/payments/config', config);

      // Validate connection
      const validateResponse = await apiClient.post<{
        success: boolean;
        message: string;
        config: AmeriaConfig;
      }>('/api/v1/admin/payments/validate');

      if (validateResponse.success) {
        setConfig(validateResponse.config);
        setSuccess('Connection validated successfully! Payment system is now active.');
      } else {
        setError(validateResponse.message || 'Validation failed');
      }
    } catch (err: any) {
      console.error('Error validating:', err);
      setError(err.detail || err.message || 'Failed to validate connection');
    } finally {
      setValidating(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await apiClient.post('/api/v1/admin/payments/deactivate');
      
      setConfig({ ...config, isActive: false });
      setSuccess('Payment system deactivated successfully');
    } catch (err: any) {
      console.error('Error deactivating:', err);
      setError(err.detail || err.message || 'Failed to deactivate');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  const adminTabs = getAdminMenuTABS(t);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.payments.title')}</h1>
          <p className="text-gray-600 mt-2">{t('admin.payments.description')}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Menu */}
          <div className="lg:hidden mb-6">
            <AdminMenuDrawer tabs={adminTabs} currentPath={currentPath} />
          </div>

          {/* Sidebar Navigation */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <nav className="bg-white border border-gray-200 rounded-lg p-2 space-y-1">
              {adminTabs.map((tab) => {
                const isActive = currentPath === tab.path || 
                  (tab.path === '/admin' && currentPath === '/admin') ||
                  (tab.path !== '/admin' && currentPath.startsWith(tab.path));
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      router.push(tab.path);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                      tab.isSubCategory ? 'pl-12' : ''
                    } ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {tab.icon}
                    </span>
                    <span className="text-left">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Card className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Ameria Bank</h2>
                    <p className="text-sm text-gray-600">vPOS Payment Gateway Configuration</p>
                  </div>
                </div>

                {/* Status Badge */}
                {config.isActive ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Active
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    Inactive
                  </div>
                )}
              </div>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Error/Success Messages */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-600">{success}</p>
                    </div>
                  )}

                  {/* Configuration Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label={t('admin.payments.clientId')}
                        type="text"
                        value={config.clientId || ''}
                        onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                        placeholder="Enter Client ID"
                        disabled={saving || validating}
                      />
                    </div>

                    <div>
                      <Input
                        label={t('admin.payments.username')}
                        type="text"
                        value={config.username || ''}
                        onChange={(e) => setConfig({ ...config, username: e.target.value })}
                        placeholder="Enter Username"
                        disabled={saving || validating}
                      />
                    </div>

                    <div>
                      <div className="relative">
                        <Input
                          label={t('admin.payments.password')}
                          type={showPassword ? 'text' : 'password'}
                          value={config.password || ''}
                          onChange={(e) => setConfig({ ...config, password: e.target.value })}
                          placeholder="Enter Password"
                          disabled={saving || validating}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 12l3.29-3.29m7.532 7.532L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.payments.testMode')}
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.testMode ?? true}
                          onChange={(e) => setConfig({ ...config, testMode: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          disabled={saving || validating}
                        />
                        <span className="text-sm text-gray-700">
                          {config.testMode ? 'Test Mode (Sandbox)' : 'Live Mode (Production)'}
                        </span>
                      </label>
                    </div>

                    <div>
                      <Input
                        label={t('admin.payments.returnUrl')}
                        type="url"
                        value={config.returnUrl || ''}
                        onChange={(e) => setConfig({ ...config, returnUrl: e.target.value })}
                        placeholder="https://yoursite.com/api/v1/payments/ameria/callback"
                        disabled={saving || validating}
                      />
                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-gray-500">
                          <strong>BackURL:</strong> Where Ameria Bank redirects users after payment (callback URL).
                        </p>
                        <p className="text-xs text-blue-600">
                          ✅ Auto-detected: <code className="bg-blue-50 px-1 rounded">{getCallbackUrl()}</code>
                        </p>
                        <p className="text-xs text-gray-500">
                          This URL is automatically set based on your current domain. No need to change it unless you have a custom domain.
                        </p>
                      </div>
                    </div>

                    <div>
                      <Input
                        label={t('admin.payments.callbackUrl')}
                        type="url"
                        value={config.callbackUrl || ''}
                        onChange={(e) => setConfig({ ...config, callbackUrl: e.target.value })}
                        placeholder="https://yoursite.com/api/v1/payments/ameria/callback"
                        disabled={saving || validating}
                      />
                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-gray-500">
                          <strong>Callback URL:</strong> Same as Return URL. Ameria Bank uses redirect callback (GET request), not server-to-server webhook.
                        </p>
                        <p className="text-xs text-blue-600">
                          ✅ Auto-detected: <code className="bg-blue-50 px-1 rounded">{getCallbackUrl()}</code>
                        </p>
                      </div>
                    </div>

                    <div>
                      <Input
                        label={t('admin.payments.currency')}
                        type="text"
                        value={config.currency || 'AMD'}
                        onChange={(e) => setConfig({ ...config, currency: e.target.value.toUpperCase() })}
                        placeholder="AMD"
                        disabled={saving || validating}
                        maxLength={3}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      disabled={saving || validating}
                    >
                      {saving ? t('admin.common.saving') : t('admin.common.save')}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleValidateAndActivate}
                      disabled={saving || validating || !config.clientId || !config.username || !config.password}
                    >
                      {validating ? t('admin.common.validating') : t('admin.payments.validateAndActivate')}
                    </Button>

                    {config.isActive && (
                      <Button
                        variant="outline"
                        onClick={handleDeactivate}
                        disabled={saving || validating}
                        className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                      >
                        {t('admin.payments.deactivate')}
                      </Button>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 Configuration Instructions</h3>
                      <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                        <li><strong>Fill in credentials:</strong> Enter Client ID, Username, and Password from Ameria Bank</li>
                        <li><strong>Check URLs:</strong> Return URL and Callback URL are auto-detected (no need to change)</li>
                        <li><strong>Test Mode:</strong> Keep Test Mode enabled for testing with test credentials</li>
                        <li><strong>Save:</strong> Click "Save" to store the configuration</li>
                        <li><strong>Validate:</strong> Click "Validate & Activate" to test connection and activate payment system</li>
                      </ol>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="text-sm font-semibold text-green-900 mb-2">✅ Quick Start Guide</h3>
                      <div className="text-sm text-green-800 space-y-2">
                        <p><strong>Step 1:</strong> Enter your test credentials from Ameria Bank</p>
                        <p><strong>Step 2:</strong> Verify that Callback URL is correct (auto-detected)</p>
                        <p><strong>Step 3:</strong> Click "Save" button</p>
                        <p><strong>Step 4:</strong> Click "Validate & Activate" button</p>
                        <p><strong>Step 5:</strong> If validation succeeds, payment system will be activated automatically</p>
                        <p className="mt-3 text-xs text-green-700">
                          💡 <strong>Tip:</strong> After activation, go to checkout page and test a payment with Ameria Bank option selected.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h3 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h3>
                      <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        <li>Callback URL is automatically detected from your current domain - no manual configuration needed</li>
                        <li>Test Mode uses test credentials - switch to Live Mode only after thorough testing</li>
                        <li>Validation creates a test payment (1 AMD) to verify credentials - this is normal</li>
                        <li>After activation, payment system will be available in checkout page</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

