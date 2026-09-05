'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { useCustomerSession } from '@/hooks/useSession';
import { formatPrice } from '@/lib/constants';
import { useEffect } from 'react';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

export default function CartPage() {
  const router = useRouter();
  const { session, isReady } = useCustomerSession();
  const { items, updateQuantity, updateNote, removeItem, totalAmount, totalItems } = useCart();

  useEffect(() => {
    if (isReady && !session) router.push('/');
  }, [isReady, session, router]);

  if (!session) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-orange-50 text-[#FF5B26] flex items-center justify-center mb-4 shadow-sm">
          <ShoppingCartRoundedIcon sx={{ fontSize: 40 }} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Giỏ hàng của bạn đang trống</h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-xs">
          Hãy khám phá thực đơn thơm ngon và chọn các món yêu thích nhé!
        </p>
        <button
          onClick={() => router.push('/menu')}
          className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] hover:from-[#E04817] hover:to-[#D83B00] text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/25 transition-all flex items-center gap-2"
        >
          <span>Xem Menu gọi món ngay</span>
          <ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />
        </button>
      </div>
    );
  }

  return (
    <div className="pb-36 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <ShoppingCartRoundedIcon sx={{ fontSize: 20, color: '#FF5B26' }} />
            <span>Giỏ hàng ({totalItems} món)</span>
          </h1>
          <p className="text-xs text-slate-400">
            {session.tableName} • {session.customerName}
          </p>
        </div>
        <button
          onClick={() => router.push('/menu')}
          className="text-xs font-bold text-[#FF5B26] hover:underline flex items-center gap-1"
        >
          <AddRoundedIcon sx={{ fontSize: 16 }} />
          <span>Thêm món</span>
        </button>
      </div>

      {/* Cart Items List */}
      <div className="p-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 animate-fade-in"
          >
            <div className="flex gap-3">
              {/* Image */}
              <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <RestaurantMenuRoundedIcon sx={{ fontSize: 26 }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {item.productName}
                  </h3>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-slate-300 hover:text-red-500 p-0.5 rounded-lg transition-colors"
                    title="Xóa món"
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                  </button>
                </div>

                <p className="text-[#FF5B26] font-extrabold text-sm mt-0.5">
                  {formatPrice(item.productPrice)}
                </p>

                {/* Quantity Stepper */}
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all"
                    >
                      −
                    </button>
                    <span className="text-xs font-extrabold text-slate-900 w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-[#FF5B26] text-white font-bold text-xs flex items-center justify-center shadow-xs hover:bg-[#E04817] active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-xs font-black text-slate-900">
                    {formatPrice(item.productPrice * item.quantity)}
                  </span>
                </div>
              </div>
            </div>

            {/* Note input */}
            <div className="mt-3 pt-2.5 border-t border-slate-50">
              <input
                type="text"
                value={item.note}
                onChange={(e) => updateNote(item.productId, e.target.value)}
                placeholder="Ghi chú món (ví dụ: không ớt, ít đường...)"
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#FF5B26] focus:outline-none transition-colors"
                maxLength={500}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Floating Bottom Total & Confirm */}
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-300/40 p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs text-slate-400 font-medium">Tổng thanh toán</span>
                <p className="text-xl font-black text-slate-900 tracking-tight">
                  {formatPrice(totalAmount)}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {totalItems} phần
              </span>
            </div>

            <button
              onClick={() => router.push('/order/confirm')}
              className="w-full py-3.5 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] hover:from-[#E04817] hover:to-[#D83B00] text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <span>XÁC NHẬN ĐẶT MÓN</span>
              <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
