'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerSession } from '@/hooks/useSession';
import { formatPrice, formatTime } from '@/lib/constants';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';

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

export default function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { session } = useCustomerSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [callLoading, setCallLoading] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      if (!session) return;
      try {
        const res = await fetch(`/api/orders/session/${session.sessionId}`);
        const data = await res.json();
        if (res.ok) {
          const found = data.orders.find((o: Order) => o.id === id);
          if (found) setOrder(found);
        }
      } catch {}
      setLoading(false);
    }
    fetchOrder();
  }, [id, session]);

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
        setTimeout(() => setCallSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Không thể gọi nhân viên');
      }
    } catch {
      alert('Có lỗi xảy ra');
    } finally {
      setCallLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-[#FF5B26] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <p className="text-slate-500 mb-4 text-sm font-medium">Không tìm thấy đơn hàng</p>
        <button
          onClick={() => router.push('/menu')}
          className="px-6 py-2.5 bg-[#FF5B26] text-white rounded-2xl font-bold text-sm"
        >
          Quay lại Thực đơn
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Success Icon & Heading */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-3xl flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
            <CheckCircleRoundedIcon sx={{ fontSize: 44, color: '#059669' }} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Đặt món thành công!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Đơn của bạn đã được chuyển thẳng tới nhà bếp
          </p>
        </div>

        {/* Receipt Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-5">
          <div className="grid grid-cols-2 gap-3 text-xs pb-4 border-b border-dashed border-slate-200">
            <div>
              <p className="text-slate-400">Mã đơn hàng</p>
              <p className="font-mono font-extrabold text-[#FF5B26] text-sm mt-0.5">
                {order.orderNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Thời gian đặt</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">
                {formatTime(order.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Vị trí bàn</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">
                {order.table.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Khách hàng</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5 truncate">
                {order.customerName}
              </p>
            </div>
          </div>

          {/* Ordered items */}
          <div className="py-3.5 space-y-2 border-b border-dashed border-slate-200">
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

          <div className="pt-3.5 flex justify-between items-center">
            <span className="font-bold text-slate-500 text-xs sm:text-sm">Tổng cộng</span>
            <span className="text-xl font-black text-[#FF5B26] tracking-tight">
              {formatPrice(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => router.push('/menu')}
            className="w-full py-3.5 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] hover:from-[#E04817] hover:to-[#D83B00] text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <RestaurantMenuRoundedIcon sx={{ fontSize: 18 }} />
            <span>GỌI THÊM MÓN KHÁC</span>
          </button>

          <button
            onClick={handleCallStaff}
            disabled={callLoading || callSuccess}
            className={`w-full py-3 rounded-2xl font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 ${
              callSuccess
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {callSuccess ? (
              <>
                <CheckCircleRoundedIcon sx={{ fontSize: 18, color: '#059669' }} />
                <span>Đã gọi nhân viên hỗ trợ</span>
              </>
            ) : (
              <>
                <NotificationsActiveRoundedIcon sx={{ fontSize: 18, color: '#FF5B26' }} />
                <span>GỌI NHÂN VIÊN PHỤC VỤ</span>
              </>
            )}
          </button>

          <button
            onClick={() => router.push('/orders')}
            className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors"
          >
            <ReceiptLongRoundedIcon sx={{ fontSize: 16 }} />
            <span>Xem danh sách đơn hàng đã gọi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
