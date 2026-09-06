'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionProvider, useCustomerSession } from '@/hooks/useSession';
import { CartProvider, useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/constants';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useRouter } from 'next/navigation';

function SessionTerminatedModal() {
  const { sessionTerminated, resetSessionTerminated } = useCustomerSession();
  const router = useRouter();

  if (!sessionTerminated) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center animate-slide-up border border-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-3xl">
          🎉
        </div>
        <h3 className="text-lg font-black text-slate-900 mb-1">
          Bữa ăn đã hoàn tất!
        </h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Bàn của bạn đã được nhân viên thanh toán. Cảm ơn quý khách đã thưởng thức ẩm thực tại Suối Đá Hòn Giao!
        </p>
        <button
          onClick={() => {
            resetSessionTerminated();
            router.push('/');
          }}
          className="w-full py-3.5 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] hover:from-[#E04817] hover:to-[#D83B00] text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/25 transition-all"
        >
          QUAY LẠI TRANG CHỦ
        </button>
      </div>
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const { totalItems, totalAmount } = useCart();

  // Hide bottom nav on pages with checkout actions, table entry, or landing
  if (!pathname || pathname === '/' || pathname === '/cart' || pathname?.startsWith('/order/') || pathname?.startsWith('/table/')) {
    return null;
  }

  const navItems = [
    { href: '/menu', label: 'Menu', icon: RestaurantMenuRoundedIcon },
    { href: '/cart', label: 'Giỏ hàng', icon: ShoppingCartRoundedIcon, badge: totalItems },
    { href: '/orders', label: 'Đơn của tôi', icon: ReceiptLongRoundedIcon },
  ];

  return (
    <>
      {/* Floating cart bar if in /menu and has items */}
      {pathname === '/menu' && totalItems > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 animate-slide-up pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <Link
              href="/cart"
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500] hover:from-[#E04817] hover:to-[#D83B00] text-white py-3.5 px-5 rounded-2xl shadow-xl shadow-orange-500/30 flex items-center justify-between font-bold text-sm transition-all transform active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">
                  {totalItems}
                </span>
                <span>Xem giỏ hàng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>{formatPrice(totalAmount)}</span>
                <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Modern Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-md mx-auto flex items-center justify-around pt-2.5 pb-4 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/menu' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-4 relative transition-all duration-150 ${
                  isActive ? 'text-[#FF5B26]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon sx={{ fontSize: 24, color: isActive ? '#FF5B26' : '#94A3B8' }} />
                  {item.badge ? (
                    <span className="absolute -top-1.5 -right-2.5 bg-[#FF5B26] text-white text-[10px] font-extrabold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-sm">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className={`text-[11px] mt-1 font-semibold tracking-tight ${isActive ? 'text-[#FF5B26]' : 'text-slate-500'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-1.5 w-6 h-1 bg-[#FF5B26] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function CustomerLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showBottomNav =
    pathname &&
    pathname !== '/' &&
    pathname !== '/cart' &&
    !pathname.startsWith('/order/') &&
    !pathname.startsWith('/table/');

  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-slate-800 ${showBottomNav ? 'pb-28' : ''}`}>
      <main className="max-w-md mx-auto">{children}</main>
      <BottomNav />
      <SessionTerminatedModal />
    </div>
  );
}

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <CustomerLayoutContent>{children}</CustomerLayoutContent>
      </CartProvider>
    </SessionProvider>
  );
}
