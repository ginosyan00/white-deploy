'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from '../lib/i18n-client';

interface MobileFiltersDrawerProps {
  title?: string;
  triggerLabel?: string;
  children: ReactNode;
  openEventName?: string;
}

/**
 * Mobile filters drawer that կարող է բացվել թե՛ կոճակից, թե՛ արտաքին իրադարձությունից։
 */
export function MobileFiltersDrawer({
  title,
  triggerLabel,
  children,
  openEventName,
}: MobileFiltersDrawerProps) {
  const { t } = useTranslation();
  const defaultTitle = title || t('products.mobileFilters.title');
  const defaultTriggerLabel = triggerLabel || t('products.mobileFilters.title');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!openEventName) return;

    const handleExternalToggle = () => {
      console.debug('[MobileFiltersDrawer] external toggle received');
      setOpen((prev) => !prev);
    };

    window.addEventListener(openEventName, handleExternalToggle);
    return () => {
      window.removeEventListener(openEventName, handleExternalToggle);
    };
  }, [openEventName]);

  return (
    <div className="lg:hidden">
      {open && (
        <div
          className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="h-full min-h-screen w-1/2 min-w-[16rem] max-w-full bg-white flex flex-col shadow-2xl"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <p className="text-lg font-semibold text-gray-900">{defaultTitle}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 w-10 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
                aria-label={t('products.mobileFilters.close')}
              >
                <svg className="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}

