'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerSession } from '@/hooks/useSession';
import { formatPrice, formatTime, ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/constants';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

interface OrderItem {
  id: string;
  productName: string;
  productPrice: number;
  quantity: number;
  note: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  table: { number: number; name: string };
  items: OrderItem[];
}

const statusBadgeStyles: Record<string, string> = {
  NEW: 'bg-blue-50 text-blue-600 border border-blue-200',
  CONFIRMED: 'bg-amber-50 text-amber-600 border border-amber-200',
  PREPARING: 'bg-orange-50 text-orange-600 border border-orange-200',
  READY: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  SERVED: 'bg-teal-50 text-teal-600 border border-teal-200',
  COMPLETED: 'bg-slate-50 text-slate-500 border border-slate-200',
  CANCELLED: 'bg-rose-50 text-rose-600 border border-rose-200',
};

export default function OrdersPage() {
  const router = useRouter();
  const { session, isReady } = useCustomerSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Feedback states
  const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState(false);

  useEffect(() => {
    if (isReady && !session) router.push('/');
  }, [isReady, session, router]);

  useEffect(() => {
    async function fetchOrders() {
      if (!session) return;
      try {
        const res = await fetch(`/api/orders/session/${session.sessionId}`);
        const data = await res.json();
        if (res.ok) setOrders(data.orders);
      } catch {}
      setLoading(false);
    }
    fetchOrders();

    // Fast polling for instant status updates (every 4s)
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [session]);

  const totalAllOrders = orders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.totalAmount : 0), 0);
  const isAllCompleted = orders.length > 0 && orders.every((o) => o.status === 'COMPLETED' || o.status === 'CANCELLED');

  if (!session) return null;

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <div className="skeleton h-14 rounded-2xl" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-44 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-8 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-100 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <ReceiptLongRoundedIcon sx={{ fontSize: 20, color: '#FF5B26' }} />
            <span>Đơn hàng của bạn</span>
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
          <span>Gọi thêm món</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
            <ReceiptLongRoundedIcon sx={{ fontSize: 44, color: '#94A3B8' }} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Chưa có đơn hàng nào</h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-xs">
            Bạn chưa đặt món cho bàn này. Hãy chọn món ngay nhé!
          </p>
          <button
            onClick={() => router.push('/menu')}
            className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/25"
          >
            Xem Menu gọi món ngay
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Grand Total Summary Card */}
          <div className={`p-4 rounded-3xl border transition-all ${
            isAllCompleted
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 border-emerald-400'
              : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-semibold ${isAllCompleted ? 'text-white/80' : 'text-slate-400'}`}>
                  {isAllCompleted ? 'BỮA ĂN ĐÃ THANH TOÁN HOÀN TẤT' : 'TỔNG CỘNG CẢ BỮA ĂN'}
                </p>
                <p className={`text-xl font-black mt-0.5 ${isAllCompleted ? 'text-white' : 'text-[#FF5B26]'}`}>
                  {formatPrice(totalAllOrders)}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isAllCompleted ? 'bg-white/20 text-white' : 'bg-orange-50 text-[#FF5B26]'
                }`}>
                  {orders.length} đợt gọi món
                </span>
              </div>
            </div>

            {isAllCompleted && (
              <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                <span className="text-xs text-white/90">Cảm ơn quý khách đã dùng bữa!</span>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('qrmenu-session');
                    localStorage.removeItem('qrmenu-cart');
                    router.push(`/?table=${session.tableNumber}`);
                  }}
                  className="px-3 py-1 bg-white text-emerald-700 text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-50 transition-colors flex items-center gap-1"
                >
                  <RestartAltRoundedIcon sx={{ fontSize: 16 }} />
                  <span>Bắt đầu lượt mới</span>
                </button>
              </div>
            )}
          </div>
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl shadow-xs border border-slate-100 overflow-hidden animate-fade-in"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-900">
                    {order.orderNumber}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {formatTime(order.createdAt)}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    statusBadgeStyles[order.status] || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}
                </span>
              </div>

              {/* Items List */}
              <div className="p-4 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-800 font-medium">
                      {item.productName}{' '}
                      <span className="text-[#FF5B26] font-bold">×{item.quantity}</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatPrice(item.productPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">Tổng cộng</span>
                <span className="font-extrabold text-[#FF5B26] text-base">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>

              {/* Completed Feedback Banner */}
              {order.status === 'COMPLETED' && (
                <div className="px-4 py-3 bg-orange-50/50 border-t border-orange-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">
                    Bữa ăn đã hoàn tất!
                  </span>
                  <button
                    onClick={() => {
                      setFeedbackOrder(order);
                      setRating(5);
                      setComment('');
                      setSubmittedFeedback(false);
                    }}
                    className="text-xs font-bold text-[#FF5B26] hover:underline flex items-center gap-1"
                  >
                    <StarRoundedIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                    <span>Đánh giá trải nghiệm</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center animate-slide-up">
            {submittedFeedback ? (
              <div className="py-6">
                <FavoriteRoundedIcon sx={{ fontSize: 50, color: '#10B981', mb: 1.5 }} />
                <h3 className="text-lg font-bold text-slate-900">Cảm ơn quý khách!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đánh giá của bạn giúp chúng tôi cải thiện chất lượng phục vụ ngày càng tốt hơn.
                </p>
                <button
                  onClick={() => setFeedbackOrder(null)}
                  className="mt-6 px-6 py-2.5 bg-[#FF5B26] text-white rounded-2xl font-bold text-xs shadow-md shadow-orange-500/25"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">
                  Đánh giá trải nghiệm
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  {feedbackOrder.orderNumber} • {session.tableName}
                </p>

                <p className="text-xs sm:text-sm text-slate-700 font-semibold mb-3">
                  Bạn có hài lòng với bữa ăn và phục vụ hôm nay?
                </p>

                {/* Star rating buttons */}
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="hover:scale-125 transition-transform flex items-center justify-center p-1"
                    >
                      <StarRoundedIcon sx={{ fontSize: 34, color: star <= rating ? '#F59E0B' : '#CBD5E1' }} />
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Nhận xét của bạn về món ăn, tốc độ ra món, phục vụ..."
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 placeholder:text-slate-400 resize-none mb-4 focus:bg-white focus:border-[#FF5B26] focus:outline-none"
                  rows={3}
                  maxLength={500}
                />

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setFeedbackOrder(null)}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    Bỏ qua
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/feedback', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            orderId: feedbackOrder.id,
                            customerName: session.customerName,
                            tableNumber: session.tableNumber,
                            rating,
                            comment: comment.trim() || null,
                          }),
                        });
                        if (res.ok) {
                          setSubmittedFeedback(true);
                        }
                      } catch {
                        alert('Không thể gửi đánh giá');
                      }
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white text-xs font-bold rounded-2xl shadow-md shadow-orange-500/25 hover:from-[#E04817] hover:to-[#D83B00]"
                  >
                    Gửi nhận xét
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
