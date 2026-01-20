'use client';

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage } from '../lib/language';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../lib/i18n-client';

interface Category {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  children: Category[];
}

interface CategoriesResponse {
  data: Category[];
}

interface Product {
  id: string;
  slug: string;
  title: string;
  image: string | null;
}

interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
  };
}

/**
 * Flatten categories tree to get all categories
 */
function flattenCategories(cats: Category[]): Category[] {
  const result: Category[] = [];
  cats.forEach((cat) => {
    result.push(cat);
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children));
    }
  });
  return result;
}

/**
 * Get category icon based on title/slug
 */
function getCategoryIcon(
  categoryTitle: string,
  categorySlug: string,
  isActive: boolean,
  t: (path: string) => string
): ReactNode {
  const title = categoryTitle.toLowerCase();
  const slug = categorySlug.toLowerCase();

  // ALL category - grey circle
  if (title === 'all' || slug === 'all') {
    return (
      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all ${
        isActive ? 'bg-gray-300' : 'bg-gray-200'
      }`}>
        <span className="text-xs sm:text-sm font-bold text-gray-900">{t('products.categoryNavigation.labels.all')}</span>
      </div>
    );
  }

  // NEW category - green circle
  if (title.includes('new') || slug.includes('new')) {
    return (
      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all ${
        isActive ? 'bg-green-200' : 'bg-green-100'
      }`}>
        <span className="text-xs sm:text-sm font-bold text-green-700">{t('products.categoryNavigation.labels.new')}</span>
      </div>
    );
  }

  // SALE category - red circle
  if (title.includes('sale') || slug.includes('sale')) {
    return (
      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all ${
        isActive ? 'bg-red-200' : 'bg-red-100'
      }`}>
        <span className="text-xs sm:text-sm font-bold text-red-700">{t('products.categoryNavigation.labels.sale')}</span>
      </div>
    );
  }

  // Default - white circle (will be filled with product image if available)
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden">
      {/* Product image will be inserted here if available */}
    </div>
  );
}

function CategoryNavigationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const currentCategory = searchParams?.get('category');

  useEffect(() => {
    fetchCategories();
  }, []);

  /**
   * Fetch categories and first product for each category
   */
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const language = getStoredLanguage();
      const response = await apiClient.get<CategoriesResponse>('/api/v1/categories/tree', {
        params: { lang: language },
      });

      const categoriesList = response.data || [];
      const allCategories = flattenCategories(categoriesList);
      setCategories(allCategories);

      // Fetch first product with image for each category
      const products: Record<string, Product | null> = {};
      
      // Add "All" category
      const allCategoriesWithAll = [
        { id: 'all', slug: 'all', title: t('products.categoryNavigation.all'), fullPath: 'all', children: [] } as Category,
        ...allCategories
      ];

      // Fetch products for each category
      const categoryPromises = allCategoriesWithAll.map(async (category) => {
        try {
          const params: Record<string, string> = {
            limit: '5',
            lang: language,
          };
          if (category.slug !== 'all') {
            params.category = category.slug;
          }

          console.log(`🔍 [CategoryNavigation] Fetching products for category: "${category.title}" (slug: "${category.slug}")`, params);
          const productsResponse = await apiClient.get<ProductsResponse>('/api/v1/products', {
            params,
          });
          
          console.log(`📦 [CategoryNavigation] Response for "${category.title}":`, {
            total: productsResponse.meta?.total || 0,
            productsCount: productsResponse.data?.length || 0,
            firstProductId: productsResponse.data?.[0]?.id,
            firstProductImage: productsResponse.data?.[0]?.image,
          });
          
          // If category has 0 products, it might mean category was not found
          if (productsResponse.meta?.total === 0 && category.slug !== 'all') {
            console.warn(`⚠️ [CategoryNavigation] Category "${category.title}" (${category.slug}) has 0 products - category might not exist in database`);
          }
          
          // Get first product with image
          // Only assign product if we have products for this category
          const productWithImage = productsResponse.data && productsResponse.data.length > 0
            ? (productsResponse.data.find(p => p.image) || productsResponse.data[0] || null)
            : null;
          products[category.slug] = productWithImage;
          
          console.log(`✅ [CategoryNavigation] Category "${category.title}" (${category.slug}): selected product: ${productWithImage?.id} (image: ${productWithImage?.image ? 'yes' : 'no'})`);
        } catch (err) {
          console.error(`❌ [CategoryNavigation] Error fetching product for category ${category.slug}:`, err);
          products[category.slug] = null;
        }
      });

      await Promise.all(categoryPromises);
      setCategoryProducts(products);
      
      // Log final state to verify each category has unique product
      console.log('✅ [CategoryNavigation] All categories processed');
      console.log('📊 [CategoryNavigation] Final category products mapping:', 
        Object.entries(products).map(([slug, product]) => ({
          slug,
          productId: product?.id || 'null',
          productImage: product?.image || 'null',
        }))
      );
      
      // Check for duplicate products
      const productIds = Object.values(products).map(p => p?.id).filter(Boolean);
      const uniqueProductIds = new Set(productIds);
      if (productIds.length !== uniqueProductIds.size) {
        console.warn('⚠️ [CategoryNavigation] WARNING: Some categories have the same product!', {
          totalProducts: productIds.length,
          uniqueProducts: uniqueProductIds.size,
          duplicates: productIds.filter((id, index) => productIds.indexOf(id) !== index)
        });
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categorySlug: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    
    if (categorySlug && categorySlug !== 'all') {
      params.set('category', categorySlug);
    } else {
      params.delete('category');
    }
    
    // Reset to page 1 when changing category
    params.delete('page');
    
    router.push(`/products?${params.toString()}`);
  };

  const updateScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      console.warn('[CategoryNavigation] Container not found for updateScrollButtons');
      return;
    }

    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    const canLeft = scrollLeft > 8;
    const canRight = scrollLeft + clientWidth < scrollWidth - 8;

    console.info('[CategoryNavigation] Update scroll buttons:', {
      scrollLeft,
      scrollWidth,
      clientWidth,
      canLeft,
      canRight
    });

    setCanScrollLeft(canLeft);
    setCanScrollRight(canRight);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleResize = () => {
      // Небольшая задержка для корректного расчета размеров после ресайза
      setTimeout(() => updateScrollButtons(), 100);
    };
    
    const handleScroll = () => {
      updateScrollButtons();
    };
    
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Инициализация с небольшой задержкой для корректного расчета размеров
    setTimeout(() => {
      updateScrollButtons();
    }, 100);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateScrollButtons]);

  useEffect(() => {
    // Обновляем состояние кнопок после загрузки категорий и продуктов
    if (!loading && categories.length > 0) {
      setTimeout(() => {
        updateScrollButtons();
      }, 200);
    }
  }, [categories.length, Object.keys(categoryProducts).length, loading, updateScrollButtons]);

  if (loading) {
    return (
      <div className="bg-white border-b border-gray-200 py-3 sm:py-4 md:py-6 w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1 sm:gap-2 min-w-[80px] sm:min-w-[100px]">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="w-16 sm:w-20 h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Add "All" category at the beginning
  const allCategoriesWithAll = [
    { id: 'all', slug: 'all', title: t('products.categoryNavigation.all'), fullPath: 'all', children: [] } as Category,
    ...categories
  ];

  // Limit to first 10 categories for horizontal navigation
  const displayCategories = allCategoriesWithAll.slice(0, 10);

  const scrollByAmount = (amount: number) => {
    const container = scrollContainerRef.current;
    if (!container) {
      console.warn('[CategoryNavigation] Container not found for scrolling');
      return;
    }
    
    const scrollLeftBefore = container.scrollLeft;
    console.info('[CategoryNavigation] Scrolling:', { 
      direction: amount > 0 ? 'right' : 'left', 
      amount, 
      scrollLeftBefore,
      scrollWidth: container.scrollWidth,
      clientWidth: container.clientWidth
    });
    
    container.scrollBy({ left: amount, behavior: 'smooth' });
    
    // Обновляем состояние после небольшой задержки для плавной прокрутки
    setTimeout(() => {
      updateScrollButtons();
    }, 100);
  };

  return (
    <div className="bg-white border-b border-gray-200 py-3 sm:py-4 md:py-6 w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="relative">
          {/* Левая стрелка - всегда видна, но неактивна когда нельзя прокрутить */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.info('[CategoryNavigation] Left arrow clicked, canScrollLeft:', canScrollLeft);
              if (canScrollLeft) {
                scrollByAmount(-220);
              }
            }}
            disabled={!canScrollLeft}
            className={`flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 md:-translate-x-12 z-10 w-12 h-12 items-center justify-center bg-transparent hover:bg-transparent transition-all ${
              canScrollLeft 
                ? 'text-gray-900 hover:scale-110 cursor-pointer' 
                : 'text-gray-300 cursor-not-allowed opacity-50'
            }`}
            aria-label={t('products.categoryNavigation.scrollLeft')}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-4 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide pb-1 sm:pb-2 pl-2 sm:pl-4 md:pl-6"
            style={{ scrollBehavior: 'smooth' }}
          >
          {displayCategories.map((category) => {
            const isActive = category.slug === 'all' 
              ? !currentCategory 
              : currentCategory === category.slug;
            const product = categoryProducts[category.slug];
            const title = category.title;
            const slug = category.slug;
            
            // Determine label text
            let labelText = title;
            if (slug === 'all') {
              labelText = t('products.categoryNavigation.shopAll');
            } else if (title.toLowerCase().includes('new')) {
              labelText = t('products.categoryNavigation.newArrivals');
            } else if (title.toLowerCase().includes('sale')) {
              labelText = t('products.categoryNavigation.sale');
            }

            return (
              <Link
                key={category.id}
                href={category.slug === 'all' ? '/products' : `/products?category=${category.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleCategoryClick(category.slug === 'all' ? null : category.slug);
                }}
                className="flex flex-col items-center gap-1 sm:gap-2 min-w-[80px] sm:min-w-[100px] group cursor-pointer transition-all duration-200 hover:opacity-80"
              >
                {/* Category Icon/Image */}
                <div className="relative">
                  {(slug === 'all' || title.toLowerCase().includes('new') || title.toLowerCase().includes('sale')) ? (
                    getCategoryIcon(title, slug, isActive, t)
                  ) : (
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-2 flex items-center justify-center overflow-hidden transition-all ${
                      isActive ? 'border-gray-400 shadow-md' : 'border-gray-200'
                    }`}>
                      {product?.image ? (
                        <Image
                          src={product.image}
                          alt={category.title}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Category Label */}
                <span className={`text-[10px] sm:text-xs text-center font-medium leading-tight transition-colors ${
                  isActive 
                    ? 'text-gray-900 underline' 
                    : 'text-gray-700'
                }`}>
                  {labelText}
                </span>
              </Link>
            );
          })}
          </div>
          {/* Правая стрелка - всегда видна, но неактивна когда нельзя прокрутить */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.info('[CategoryNavigation] Right arrow clicked, canScrollRight:', canScrollRight);
              if (canScrollRight) {
                scrollByAmount(220);
              }
            }}
            disabled={!canScrollRight}
            className={`flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 md:translate-x-12 z-10 w-12 h-12 items-center justify-center bg-transparent hover:bg-transparent transition-all ${
              canScrollRight 
                ? 'text-gray-900 hover:scale-110 cursor-pointer' 
                : 'text-gray-300 cursor-not-allowed opacity-50'
            }`}
            aria-label={t('products.categoryNavigation.scrollRight')}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CategoryNavigation() {
  return (
    <Suspense fallback={
      <div className="bg-white border-b border-gray-200 py-3 sm:py-4 md:py-6 w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1 sm:gap-2 min-w-[80px] sm:min-w-[100px]">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="w-16 sm:w-20 h-3 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <CategoryNavigationContent />
    </Suspense>
  );
}


