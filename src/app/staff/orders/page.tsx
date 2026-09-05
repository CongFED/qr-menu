'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatPrice, formatTime, ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS, type OrderStatus } from '@/lib/constants';
import { speakVietnamese } from '@/lib/sound';
import SoupKitchenRoundedIcon from '@mui/icons-material/SoupKitchenRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';

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
  note: string | null;
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

const filterOptions = ['ALL', 'NEW', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'] as const;
const filterLabels: Record<string, string> = {
  ALL: 'Tất cả',
  ...ORDER_STATUS_LABELS,
};

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'tickets' | 'tables'>('tickets');
  const [filter, setFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [settlingTable, setSettlingTable] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/orders');
      const data = await res.json();
      if (res.ok) setOrders(data.orders);
    } catch {}
    setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // SSE for realtime updates
  useEffect(() => {
    const eventSource = new EventSource('/api/sse/orders?channel=staff-orders');

    eventSource.addEventListener('new_order', (event) => {
      const newOrder = JSON.parse(event.data);
      setOrders((prev) => [newOrder, ...prev]);
    });

    eventSource.addEventListener('order_updated', (event) => {
      const updated = JSON.parse(event.data);
      if (updated.type === 'TABLE_CHECKOUT') {
        fetchOrders();
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
        );
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
      setTimeout(fetchOrders, 3000);
    };

    return () => eventSource.close();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/staff/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: data.order.status } : o))
        );
      }
    } catch {}
    setUpdatingId(null);
  };

  // Group active orders by table for the "Table Bills" view
  const tableGroups = useMemo(() => {
    const map = new Map<number, {
      tableNumber: number;
      tableName: string;
      customerName: string;
      firstOrderTime: string;
      activeOrders: Order[];
      totalActiveAmount: number;
      itemsMap: Map<string, { name: string; price: number; quantity: number }>;
    }>();

    // Group only orders not cancelled
    orders.forEach((o) => {
      if (o.status === 'CANCELLED') return;
      const num = o.table.number;

      if (!map.has(num)) {
        map.set(num, {
          tableNumber: num,
          tableName: o.table.name,
          customerName: o.customerName,
          firstOrderTime: o.createdAt,
          activeOrders: [],
          totalActiveAmount: 0,
          itemsMap: new Map(),
        });
      }

      const grp = map.get(num)!;

      // Only count active (uncompleted) orders towards current bill
      if (o.status !== 'COMPLETED') {
        grp.activeOrders.push(o);
        grp.totalActiveAmount += o.totalAmount;

        // Consolidate items
        o.items.forEach((item) => {
          const key = item.productName;
          if (!grp.itemsMap.has(key)) {
            grp.itemsMap.set(key, {
              name: item.productName,
              price: item.productPrice,
              quantity: item.quantity,
            });
          } else {
            grp.itemsMap.get(key)!.quantity += item.quantity;
          }
        });
      }
    });

    // Return only tables that have active orders
    return Array.from(map.values()).filter((g) => g.activeOrders.length > 0);
  }, [orders]);

  // Checkout and settle an entire table session
  const handleCheckoutTable = async (tableNumber: number, tableName: string, totalAmount: number) => {
    const confirmed = confirm(
      `Xác nhận thanh toán ${tableName} với tổng số tiền: ${formatPrice(totalAmount)} và hoàn tất lượt ăn?`
    );
    if (!confirmed) return;

    setSettlingTable(tableNumber);
    try {
      const res = await fetch(`/api/staff/tables/${tableNumber}/checkout`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        speakVietnamese(`${tableName} đã thanh toán thành công!`);
        fetchOrders();
      } else {
        alert(data.error || 'Thanh toán bàn thất bại');
      }
    } catch {
      alert('Có lỗi xảy ra khi thanh toán bàn');
    } finally {
      setSettlingTable(null);
    }
  };

  // Print temporary receipt for table
  const handlePrintReceipt = (group: (typeof tableGroups)[0]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = Array.from(group.itemsMap.values())
      .map(
        (i) => `
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px dashed #eee;">${i.name}</td>
          <td style="padding: 6px 0; border-bottom: 1px dashed #eee; text-align: center;">x${i.quantity}</td>
          <td style="padding: 6px 0; border-bottom: 1px dashed #eee; text-align: right;">${(i.price * i.quantity).toLocaleString('vi-VN')}đ</td>
        </tr>
      `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Phiếu Tạm Tính - ${group.tableName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 380px; margin: 0 auto; color: #111; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
            h1 { font-size: 18px; margin: 0 0 5px; text-transform: uppercase; }
            p { font-size: 12px; margin: 2px 0; color: #555; }
            .info { font-size: 13px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 15px; }
            .total { border-top: 2px solid #111; padding-top: 10px; text-align: right; font-size: 16px; font-weight: bold; }
            .footer { text-align: center; font-size: 11px; color: #777; margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Suối Đá Hòn Giao</h1>
            <p>PHIẾU TẠM TÍNH TIỀN BÀN</p>
            <p>Thời gian in: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}</p>
          </div>
          <div class="info">
            <p><strong>Vị trí:</strong> ${group.tableName}</p>
            <p><strong>Khách hàng:</strong> ${group.customerName}</p>
            <p><strong>Số đợt gọi món:</strong> ${group.activeOrders.length} lượt</p>
          </div>
          <table>
            <thead>
              <tr style="border-bottom: 1px solid #333; font-weight: bold;">
                <th style="text-align: left; padding-bottom: 6px;">Món</th>
                <th style="text-align: center; padding-bottom: 6px;">SL</th>
                <th style="text-align: right; padding-bottom: 6px;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total">
            Tổng cộng: ${group.totalActiveAmount.toLocaleString('vi-VN')} VNĐ
          </div>
          <div class="footer">
            <p>Cảm ơn quý khách và hẹn gặp lại!</p>
            <p>Ẩm thực núi rừng Suối Đá Hòn Giao</p>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredOrders =
    filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  // Sort: NEW orders always first, then by creation time
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.status === 'NEW' && b.status !== 'NEW') return -1;
    if (a.status !== 'NEW' && b.status === 'NEW') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton h-64 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Màn hình Điều hành & Bếp
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quản lý chế biến từng món hoặc gom hóa đơn thanh toán theo bàn
          </p>
        </div>

        {/* View Mode Segmented Control */}
        <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center shadow-inner self-start sm:self-auto gap-1">
          <button
            type="button"
            onClick={() => setViewMode('tickets')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              viewMode === 'tickets'
                ? 'bg-white text-[#FF5B26] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SoupKitchenRoundedIcon sx={{ fontSize: 18 }} />
            <span>Theo từng Đơn món ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tables')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              viewMode === 'tables'
                ? 'bg-white text-[#FF5B26] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableRestaurantRoundedIcon sx={{ fontSize: 18 }} />
            <span>Gom theo Bàn & Thanh toán</span>
            {tableGroups.length > 0 && (
              <span className="bg-[#FF5B26] text-white text-[11px] font-black px-1.5 py-0.2 rounded-full">
                {tableGroups.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: TICKETS VIEW (For Kitchen / Cooks)
          ========================================================================= */}
      {viewMode === 'tickets' && (
        <>
          {/* Top Filter Bar */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filterOptions.map((f) => {
              const count = f === 'ALL' ? orders.length : orders.filter((o) => o.status === f).length;
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`pill-tab text-xs sm:text-sm font-bold ${
                    isActive ? 'pill-tab-active' : 'pill-tab-inactive'
                  }`}
                >
                  <span>{filterLabels[f]}</span>
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Orders Grid */}
          {sortedOrders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <span className="text-5xl block mb-3">🍳</span>
              <h3 className="text-lg font-bold text-slate-800">Không có đơn hàng nào</h3>
              <p className="text-xs text-slate-400 mt-1">Đơn mới từ khách hàng sẽ tự động hiện tại đây theo thời gian thực</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {sortedOrders.map((order) => {
                const transitions = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] || [];
                const isNew = order.status === 'NEW';
                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-3xl p-5 border transition-all duration-200 shadow-sm flex flex-col justify-between ${
                      isNew
                        ? 'border-orange-300 ring-2 ring-orange-500/20 shadow-lg shadow-orange-500/10'
                        : 'border-slate-100 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Order Top Bar */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {order.orderNumber}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusBadgeStyles[order.status] || 'bg-slate-100 text-slate-600'}`}>
                            {ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-400">
                          {formatTime(order.createdAt)}
                        </span>
                      </div>

                      {/* Table & Guest Header */}
                      <div className="flex items-center gap-3 mb-4 bg-slate-50/80 p-3 rounded-2xl border border-slate-100/80">
                        <div className="w-11 h-11 bg-gradient-to-br from-[#FF6B35] to-[#FF4500] text-white rounded-xl flex items-center justify-center text-base font-black shadow-sm shadow-orange-500/25 shrink-0">
                          {order.table.number}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 text-sm truncate">
                            {order.table.name}
                          </p>
                          <p className="text-xs text-slate-500 font-medium truncate">
                            Khách: <span className="font-semibold text-slate-800">{order.customerName}</span>
                          </p>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2 mb-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-start justify-between text-xs sm:text-sm">
                            <div className="min-w-0 pr-2">
                              <span className="font-semibold text-slate-800">
                                {item.productName}
                              </span>
                              {item.note && (
                                <p className="text-[11px] text-amber-600 font-medium mt-0.5 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                                  📝 {item.note}
                                </p>
                              )}
                            </div>
                            <span className="font-black text-slate-900 bg-orange-50 text-[#FF5B26] px-2 py-0.5 rounded-lg shrink-0">
                              ×{item.quantity}
                            </span>
                          </div>
                        ))}

                        {order.note && (
                          <div className="text-xs text-amber-700 bg-amber-50/80 border border-amber-100 rounded-xl p-2.5 mt-2">
                            <span className="font-bold">Ghi chú chung:</span> {order.note}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Total & Transitions */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400">Tổng tiền</span>
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>

                      {/* Status Action Buttons */}
                      {transitions.length > 0 && (
                        <div className="flex gap-2">
                          {transitions.map((nextStatus) => {
                            const isCancel = nextStatus === 'CANCELLED';
                            return (
                              <button
                                key={nextStatus}
                                type="button"
                                onClick={() => handleStatusChange(order.id, nextStatus)}
                                disabled={updatingId === order.id}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-98 disabled:opacity-50 ${
                                  isCancel
                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                                    : 'bg-gradient-to-r from-[#FF6B35] to-[#FF4500] hover:from-[#E04817] hover:to-[#D83B00] text-white shadow-orange-500/25'
                                }`}
                              >
                                {updatingId === order.id ? '...' : ORDER_STATUS_LABELS[nextStatus]}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          VIEW MODE 2: CONSOLIDATED TABLE BILLS (For Waiters & Cashier)
          ========================================================================= */}
      {viewMode === 'tables' && (
        <div className="space-y-4">
          <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧾</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Gom hóa đơn theo từng Bàn đang ngồi ăn
                </h3>
                <p className="text-xs text-slate-500">
                  Hệ thống tự động gom tất cả các lần gọi món của cùng một lượt khách thành 1 hóa đơn tổng để thu ngân tính tiền và trả bàn.
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-[#FF5B26] bg-white px-3 py-1.5 rounded-xl border border-orange-200 shadow-xs">
              {tableGroups.length} Bàn đang có khách
            </span>
          </div>

          {tableGroups.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <TableRestaurantRoundedIcon sx={{ fontSize: 52, color: '#CBD5E1', mb: 1.5 }} />
              <h3 className="text-lg font-bold text-slate-800">Hiện không có bàn nào đang nợ hóa đơn</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tất cả các bàn đã được thanh toán hoàn tất hoặc chưa có lượt khách mới gọi món.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {tableGroups.map((group) => (
                <div
                  key={group.tableNumber}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Table Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#FF6B35] to-[#FF4500] text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-md shadow-orange-500/25">
                          {group.tableNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-slate-900">
                              {group.tableName}
                            </h3>
                            <span className="bg-orange-50 text-[#FF5B26] text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-orange-100">
                              {group.activeOrders.length} đợt gọi món
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Khách: <strong className="text-slate-800">{group.customerName}</strong> • Vào lúc: {formatTime(group.firstOrderTime)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(group)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        title="In phiếu tạm tính cho khách xem"
                      >
                        <PrintRoundedIcon sx={{ fontSize: 16 }} />
                        <span>In tạm tính</span>
                      </button>
                    </div>

                    {/* Consolidated Items Table */}
                    <div className="space-y-2 mb-4">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Danh sách tất cả món đã dùng:
                      </p>
                      <div className="divide-y divide-slate-50 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/80">
                        {Array.from(group.itemsMap.values()).map((item) => (
                          <div key={item.name} className="py-1.5 flex items-center justify-between text-xs sm:text-sm">
                            <span className="font-semibold text-slate-800">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-xs">
                                ×{item.quantity}
                              </span>
                              <span className="font-bold text-slate-800 min-w-[70px] text-right">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Tickets in this session */}
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Các mã đơn của bàn:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.activeOrders.map((o) => (
                          <span
                            key={o.id}
                            className="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200"
                          >
                            {o.orderNumber} ({ORDER_STATUS_LABELS[o.status as OrderStatus]})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Settle Action Bar */}
                  <div className="pt-4 border-t border-slate-100 mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-xs text-slate-400 font-semibold block">TỔNG TIỀN CẦN THANH TOÁN</span>
                        <span className="text-2xl font-black text-[#FF5B26] tracking-tight">
                          {formatPrice(group.totalActiveAmount)}
                        </span>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                        Sẵn sàng thu tiền
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleCheckoutTable(
                          group.tableNumber,
                          group.tableName,
                          group.totalActiveAmount
                        )
                      }
                      disabled={settlingTable === group.tableNumber}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {settlingTable === group.tableNumber ? (
                        <span>Đang xử lý thanh toán...</span>
                      ) : (
                        <>
                          <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />
                          <span>XÁC NHẬN THANH TOÁN & TRẢ BÀN</span>
                          <span>•</span>
                          <span>{formatPrice(group.totalActiveAmount)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
