'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCustomerSession } from '@/hooks/useSession';
import { useCart } from '@/hooks/useCart';
import ModernProductCard from '@/components/customer/ModernProductCard';
import ProductDetailModal from '@/components/customer/ProductDetailModal';
import LandscapeRoundedIcon from '@mui/icons-material/LandscapeRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  description: string | null;
  isAvailable: boolean;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  products: Product[];
}

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isReady } = useCustomerSession();
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [callLoading, setCallLoading] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);

  // Redirect to welcome if no session
  useEffect(() => {
    if (isReady && !session) {
      const table = searchParams?.get('table');
      router.push(table ? `/?table=${table}` : '/');
    }
  }, [isReady, session, router, searchParams]);

  // Fetch menu
  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch('/api/menu');
        const data = await res.json();
        if (res.ok) {
          setCategories(data.categories);
          if (data.categories.length > 0) {
            setActiveCategory(data.categories[0].id);
          }
        } else {
          setError('Không thể tải menu');
        }
      } catch {
        setError('Không thể kết nối. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  const handleCallStaff = async () => {
    if (!session || callLoading) return;
    setCallLoading(true);
    try {
      const res = await fetch('/api/staff-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: session.tableNumber,
          customerName: session.customerName,
          sessionId: session.sessionId,
        }),
      });
      if (res.ok) {
        setCallSuccess(true);
        setTimeout(() => setCallSuccess(false), 3500);
      } else {
        const data = await res.json();
        alert(data.error || 'Không thể gọi nhân viên');
      }
    } catch {
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setCallLoading(false);
    }
  };

  // Get current quantity of a product in cart
  const getItemQuantity = (productId: string) => {
    const item = items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  if (!isReady || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-[#FF5B26] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-16 rounded-2xl" />
        <div className="flex gap-2 overflow-hidden py-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-9 w-24 flex-shrink-0 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <span className="text-4xl mb-3">🍽️</span>
        <p className="text-slate-600 mb-4 text-sm font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-[#FF5B26] text-white font-semibold rounded-xl text-sm shadow-md"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  const activeProducts = categories.find((c) => c.id === activeCategory)?.products || [];

  return (
    <div className="relative min-h-screen pb-6">
      {/* Modern Top Header (matches D.CC style branding) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Logo Monogram */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF4500] text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <LandscapeRoundedIcon sx={{ fontSize: 22 }} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                Suối Đá Hòn Cong
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-semibold bg-orange-50 text-[#FF5B26] px-2 py-0.5 rounded-md">
                  {session.tableName}
                </span>
                <span className="text-[11px] text-slate-400">•</span>
                <span className="text-[11px] text-slate-500 font-medium truncate max-w-[110px]">
                  {session.customerName}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Staff Call Button */}
          <button
            type="button"
            onClick={handleCallStaff}
            disabled={callLoading || callSuccess}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              callSuccess
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95'
            }`}
          >
            {callSuccess ? (
              <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />
            ) : (
              <NotificationsActiveRoundedIcon sx={{ fontSize: 16, color: '#FF5B26' }} />
            )}
            <span>{callSuccess ? 'Đã gọi NV' : callLoading ? 'Đang gọi...' : 'Gọi NV'}</span>
          </button>
        </div>
      </header>

      {/* Category Pills (Horizontal scrolling) */}
      <div className="sticky top-[65px] z-30 bg-[#F8FAFC]/95 backdrop-blur-sm px-4 py-3.5 border-b border-slate-100">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`pill-tab ${
                  isActive ? 'pill-tab-active' : 'pill-tab-inactive'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {cat.products.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Cards Grid (Matching reference image) */}
      <div className="p-4 pt-4 pb-16">
        {activeProducts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <RestaurantMenuRoundedIcon sx={{ fontSize: 44, color: '#CBD5E1', mb: 1.5 }} />
            <p className="text-sm font-medium">Chưa có món trong danh mục này</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {activeProducts.map((product) => {
              const qty = getItemQuantity(product.id);
              return (
                <ModernProductCard
                  key={product.id}
                  product={product}
                  quantity={qty}
                  onAdd={() => {
                    addItem({
                      productId: product.id,
                      productName: product.name,
                      productPrice: product.price,
                      image: product.image || undefined,
                      quantity: 1,
                    });
                  }}
                  onRemove={() => {
                    if (qty > 1) {
                      updateQuantity(product.id, qty - 1);
                    } else if (qty === 1) {
                      removeItem(product.id);
                    }
                  }}
                  onOpenDetail={() => setSelectedProduct(product)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Staff Call Toast */}
      {callSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-xl font-medium text-xs flex items-center gap-2">
            <CheckCircleRoundedIcon sx={{ fontSize: 18, color: '#34D399' }} />
            <span>Đã gửi yêu cầu gọi nhân viên đến bàn {session.tableNumber}!</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-[#FF5B26] border-t-transparent rounded-full" />
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
