'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getStoredLanguage } from '../lib/language';
import { t } from '../lib/i18n';
import { useState, useEffect } from 'react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumb() {
  const pathname = usePathname();
  const [language, setLanguage] = useState<'en' | 'ru' | 'hy' | 'ka'>('en');

  useEffect(() => {
    const storedLang = getStoredLanguage();
    setLanguage(storedLang);

    const handleLanguageUpdate = () => {
      setLanguage(getStoredLanguage());
    };

    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, []);

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: t(language, 'common.navigation.home'), href: '/' },
    ];

    if (pathname === '/') {
      return items;
    }

    const segments = pathname.split('/').filter(Boolean);

    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      
      // Translate common routes
      let label = segment;
      
      // Map common routes to translations
      const routeMap: Record<string, string> = {
        'products': 'common.navigation.products',
        'categories': 'common.navigation.categories',
        'cart': 'common.navigation.cart',
        'wishlist': 'common.navigation.wishlist',
        'compare': 'common.navigation.compare',
        'checkout': 'common.navigation.checkout',
        'profile': 'common.navigation.profile',
        'orders': 'common.navigation.orders',
        'login': 'common.navigation.login',
        'register': 'common.navigation.register',
        'about': 'common.navigation.about',
        'contact': 'common.navigation.contact',
        'admin': 'common.navigation.admin',
        'faq': 'common.navigation.faq',
        'shipping': 'common.navigation.shipping',
        'returns': 'common.navigation.returns',
        'support': 'common.navigation.support',
        'privacy': 'common.navigation.privacy',
        'terms': 'common.navigation.terms',
        'cookies': 'common.navigation.cookies',
        'delivery': 'common.navigation.delivery',
        'stores': 'common.navigation.stores',
      };

      if (routeMap[segment]) {
        label = t(language, routeMap[segment]);
      } else {
        // Capitalize and format segment (for product slugs, etc.)
        label = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      items.push({ label, href });
    });

    return items;
  };

  const breadcrumbs = getBreadcrumbs();

  // Don't show breadcrumb on home page
  if (pathname === '/') {
    return null;
  }

  return (
    <nav className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center text-sm">
          {breadcrumbs.map((item, index) => (
            <div key={item.href} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-400">/</span>
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-gray-900 font-semibold">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}


