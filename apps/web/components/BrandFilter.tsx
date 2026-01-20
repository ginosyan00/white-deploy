'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Input } from '@shop/ui';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage } from '../lib/language';
import { useTranslation } from '../lib/i18n-client';

interface BrandFilterProps {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  selectedBrands?: string[];
}

interface BrandOption {
  id: string;
  name: string;
  count: number;
}

interface Product {
  id: string;
  brand?: {
    id: string;
    name: string;
  } | null;
}

interface ProductsResponse {
  data?: Product[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function BrandFilter({ category, search, minPrice, maxPrice, selectedBrands = [] }: BrandFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<BrandOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, [category, search, minPrice, maxPrice]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBrands(brands);
    } else {
      const query = searchQuery.toLowerCase().trim();
      setFilteredBrands(
        brands.filter((brand) => brand.name.toLowerCase().includes(query))
      );
    }
  }, [searchQuery, brands]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const language = getStoredLanguage();
      const params: Record<string, string> = {
        lang: language,
      };
      
      if (category) params.category = category;
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      // Fetch products to extract brands
      const response = await apiClient.get<ProductsResponse>('/api/v1/products', { params: { ...params, limit: '1000' } });
      
      // Extract unique brands from products
      const brandCountMap = new Map<string, { id: string; name: string; count: number }>();
      
      response.data?.forEach((product) => {
        if (product.brand?.id && product.brand?.name) {
          const brandId = product.brand.id;
          const brandName = product.brand.name;
          const existing = brandCountMap.get(brandId);
          brandCountMap.set(brandId, {
            id: brandId,
            name: brandName,
            count: (existing?.count || 0) + 1,
          });
        }
      });

      const brandOptions: BrandOption[] = Array.from(brandCountMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      setBrands(brandOptions);
      setFilteredBrands(brandOptions);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
      setFilteredBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandSelect = (brandId: string) => {
    console.log('🎯 [BRAND FILTER] Brand clicked:', { brandId, currentSelectedBrands: selectedBrands });
    
    // Ստեղծում ենք նոր URLSearchParams URL-ի հիման վրա, որպեսզի պահպանենք բոլոր params-ները
    const params = new URLSearchParams(searchParams.toString());
    
    // Ստեղծում ենք ընտրված brand-երի array
    const currentBrands = selectedBrands || [];
    let newBrands: string[];
    
    if (currentBrands.includes(brandId)) {
      // Եթե brand-ը արդեն ընտրված է, հեռացնում ենք
      newBrands = currentBrands.filter(id => id !== brandId);
      console.log('➖ [BRAND FILTER] Brand deselected:', { brandId, newBrands });
    } else {
      // Եթե brand-ը ընտրված չէ, ավելացնում ենք
      newBrands = [...currentBrands, brandId];
      console.log('➕ [BRAND FILTER] Brand selected:', { brandId, newBrands });
    }
    
    // URL-ում պահում ենք comma-separated string
    if (newBrands.length > 0) {
      params.set('brand', newBrands.join(','));
      console.log('✅ [BRAND FILTER] Setting brand param:', newBrands.join(','));
    } else {
      params.delete('brand');
      console.log('🗑️ [BRAND FILTER] Removing brand param');
    }
    
    // Reset page to 1 when filters change
    params.delete('page');

    const newUrl = `/products?${params.toString()}`;
    console.log('🔗 [BRAND FILTER] Navigating to:', newUrl);
    router.push(newUrl);
  };

  if (loading) {
    return (
      <Card className="p-4 mb-6">
        <h3 className="text-base font-bold text-gray-800 mb-4 uppercase tracking-wide">{t('products.filters.brand.title')}</h3>
        <div className="text-sm text-gray-500">{t('products.filters.brand.loading')}</div>
      </Card>
    );
  }

  if (brands.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 mb-6">
      <h3 className="text-base font-bold text-gray-800 mb-4 uppercase tracking-wide">{t('products.filters.brand.title')}</h3>
      
      {/* Search Input */}
      <div className="mb-4 relative">
        <Input
          type="text"
          placeholder={t('products.filters.brand.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-10"
        />
        <svg
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Brand List */}
      {filteredBrands.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredBrands.map((brand) => {
            const isSelected = selectedBrands.includes(brand.id);

            return (
              <button
                key={brand.id}
                onClick={() => handleBrandSelect(brand.id)}
                className={`w-full flex items-center justify-between py-2 px-3 rounded transition-all duration-200 group ${
                  isSelected
                    ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <span
                  className={`text-sm transition-colors ${
                    isSelected
                      ? 'text-blue-900 font-medium'
                      : 'text-gray-900 group-hover:text-gray-700'
                  }`}
                >
                  {brand.name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                    isSelected
                      ? 'text-blue-700 bg-blue-100'
                      : 'text-gray-500 bg-gray-100'
                  }`}
                >
                  {brand.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-500 py-4 text-center">
          {t('products.filters.brand.noBrands')}
        </div>
      )}
    </Card>
  );
}

