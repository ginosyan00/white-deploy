import Link from 'next/link';
import { t } from '../lib/i18n';
import { type LanguageCode } from '../lib/language';
import { cookies } from 'next/headers';

/**
 * Custom 404 Not Found Page
 * 
 * This page is displayed when a route is not found.
 * Server Component with dynamic rendering to prevent prerendering.
 */
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default async function NotFound() {
  // Get language from cookies or default to 'en'
  const cookieStore = await cookies();
  const langCookie = cookieStore.get('shop_language');
  const lang: LanguageCode = (langCookie?.value && ['en', 'hy', 'ru'].includes(langCookie.value)) 
    ? (langCookie.value as LanguageCode) 
    : 'en';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">{t(lang, 'common.notFound.title')}</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {t(lang, 'common.notFound.description')}
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            {t(lang, 'common.notFound.goHome')}
          </Link>
          <Link
            href="/products"
            className="px-6 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {t(lang, 'common.buttons.browseProducts')}
          </Link>
        </div>
      </div>
    </div>
  );
}
