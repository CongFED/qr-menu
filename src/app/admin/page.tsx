'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import { formatPrice } from '@/lib/constants';

interface TableStatusItem {
  id: string;
  number: number;
  name: string;
  isActive: boolean;
  occupancyStatus: 'OCCUPIED' | 'AVAILABLE' | 'INACTIVE';
  customerName: string | null;
  activeOrderCount: number;
  itemCount: number;
  currentBillAmount: number;
  firstOrderTime: string | null;
  hasPendingCall: boolean;
}

interface TableSummary {
  total: number;
  occupied: number;
  available: number;
  inactive: number;
  callingStaff: number;
  inProgressRevenue: number;
}

interface DashboardStats {
  totalOrders: number;
  newOrders: number;
  processingOrders: number;
  completedOrders: number;
  todayRevenue: number;
  topProducts: { name: string; quantity: number }[];
  tableSummary?: TableSummary;
  tables?: TableStatusItem[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/dashboard');
        const data = await res.json();
        if (res.ok) setStats(data.stats);
      } catch {}
      setLoading(false);
    }
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-slate-500">Không thể tải dữ liệu</p>;

  const cards = [
    {
      label: 'Tổng đơn hôm nay',
      value: stats.totalOrders,
      icon: ReceiptLongRoundedIcon,
      bgColor: 'bg-orange-50/60',
      iconBg: 'bg-orange-100 text-[#FF5B26]',
      textColor: 'text-[#FF5B26]',
      borderColor: 'border-orange-100',
    },
    {
      label: 'Đơn mới đến',
      value: stats.newOrders,
      icon: NotificationsActiveRoundedIcon,
      bgColor: 'bg-blue-50/60',
      iconBg: 'bg-blue-100 text-blue-600',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-100',
    },
    {
      label: 'Đang chế biến',
      value: stats.processingOrders,
      icon: LocalFireDepartmentRoundedIcon,
      bgColor: 'bg-amber-50/60',
      iconBg: 'bg-amber-100 text-amber-600',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-100',
    },
    {
      label: 'Đã hoàn tất',
      value: stats.completedOrders,
      icon: CheckCircleRoundedIcon,
      bgColor: 'bg-emerald-50/60',
      iconBg: 'bg-emerald-100 text-emerald-600',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-100',
    },
  ];

  const summary = stats.tableSummary || {
    total: 0,
    occupied: 0,
    available: 0,
    inactive: 0,
    callingStaff: 0,
    inProgressRevenue: 0,
  };

  const tables = stats.tables || [];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Tổng quan hôm nay
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Theo dõi số lượng đơn hàng, doanh số và sơ đồ bàn ăn trực tiếp
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`${card.bgColor} ${card.borderColor} border rounded-3xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-xs`}>
                  <Icon sx={{ fontSize: 24 }} />
                </div>
                <span className={`text-xs font-bold ${card.textColor} bg-white px-2.5 py-1 rounded-full shadow-xs border border-slate-100`}>
                  Hôm nay
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</p>
              <p className="text-xs text-slate-500 font-bold mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue & Quick Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Card in vivid orange gradient */}
        <div className="lg:col-span-1 bg-gradient-to-br from-[#FF6B35] to-[#FF4500] text-white rounded-3xl p-6 shadow-xl shadow-orange-500/25 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                Doanh thu ước tính
              </span>
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                <AccountBalanceWalletRoundedIcon sx={{ fontSize: 22 }} />
              </div>
            </div>
            <p className="text-xs text-white/80 font-medium">Tổng tiền các đơn đặt trong ngày:</p>
            <p className="text-3xl font-black mt-2 tracking-tight">
              {formatPrice(stats.todayRevenue)}
            </p>
          </div>
          <p className="text-[11px] text-white/70 mt-6 pt-4 border-t border-white/20 font-medium">
            * Thống kê tự động từ các đơn hàng tại bàn
          </p>
        </div>

        {/* Top Selling Products */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <EmojiEventsRoundedIcon sx={{ fontSize: 20 }} />
            </div>
            <span>Món bán chạy nhất</span>
          </h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-slate-400 text-xs py-8 text-center">Chưa có đơn hàng trong ngày</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((p, idx) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-white'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-700'
                          : idx === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-slate-100">
                    <TrendingUpRoundedIcon sx={{ fontSize: 16, color: '#FF5B26' }} />
                    <span className="text-xs font-black text-[#FF5B26]">
                      {p.quantity} phần
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. Live Table Occupancy Map (Sơ đồ bàn ăn trực tiếp) */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#FF5B26] flex items-center justify-center">
              <TableRestaurantRoundedIcon sx={{ fontSize: 24 }} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Sơ đồ trạng thái bàn ăn trực tiếp
              </h2>
              <p className="text-xs text-slate-500">
                Nhìn nhanh bàn nào đang có khách và bàn nào đang trống trong nhà hàng
              </p>
            </div>
          </div>

          {/* Table summary badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-orange-50 text-orange-700 border border-orange-200">
              <span className="w-2 h-2 rounded-full bg-[#FF5B26] animate-pulse" />
              Có khách: {summary.occupied} bàn
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Bàn trống: {summary.available} bàn
            </span>
            <Link
              href="/admin/tables"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <span>Quản lý Bàn</span>
              <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
            </Link>
          </div>
        </div>

        {/* Tables mini grid */}
        {tables.length === 0 ? (
          <p className="text-slate-400 text-xs py-8 text-center">Chưa có bàn ăn nào được cấu hình</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {tables.map((t) => {
              const isOccupied = t.occupancyStatus === 'OCCUPIED';
              const isAvailable = t.occupancyStatus === 'AVAILABLE';

              return (
                <Link
                  key={t.id}
                  href="/admin/tables"
                  className={`p-3.5 rounded-2xl border transition-all hover:scale-102 flex flex-col justify-between ${
                    isOccupied
                      ? 'bg-orange-50/70 border-orange-200 shadow-xs hover:border-orange-300'
                      : isAvailable
                      ? 'bg-emerald-50/50 border-emerald-200/80 shadow-xs hover:border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">{t.name}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOccupied
                            ? 'bg-[#FF5B26] animate-pulse'
                            : isAvailable
                            ? 'bg-emerald-500'
                            : 'bg-slate-400'
                        }`}
                      />
                    </div>

                    {/* Big Table Number */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg mb-2 ${
                        isOccupied
                          ? 'bg-white text-[#FF5B26] shadow-xs'
                          : isAvailable
                          ? 'bg-white text-emerald-600 shadow-xs'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {t.number}
                    </div>

                    {/* Occupancy Info */}
                    {isOccupied && (
                      <div className="text-[11px] leading-tight space-y-0.5">
                        <p className="font-extrabold text-orange-900 truncate">
                          👤 {t.customerName || 'Khách tại bàn'}
                        </p>
                        <p className="font-bold text-orange-700">
                          {formatPrice(t.currentBillAmount)}
                        </p>
                        <p className="text-[10px] text-orange-600">
                          {t.activeOrderCount} đợt • {t.itemCount} món
                        </p>
                      </div>
                    )}

                    {isAvailable && (
                      <div className="text-[11px] text-emerald-700 font-bold">
                        <p>Bàn trống</p>
                        <p className="text-[10px] text-emerald-600 font-medium">Sẵn sàng đón</p>
                      </div>
                    )}

                    {!isOccupied && !isAvailable && (
                      <div className="text-[11px] text-slate-400 font-medium">
                        <p>Tạm ngưng</p>
                      </div>
                    )}
                  </div>

                  {/* Status Indicator at bottom */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold">
                    <span
                      className={
                        isOccupied
                          ? 'text-orange-700 font-extrabold'
                          : isAvailable
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }
                    >
                      {isOccupied ? 'ĐANG ĂN' : isAvailable ? 'TRỐNG' : 'KHÓA'}
                    </span>
                    <span className="text-slate-400">Chi tiết ➜</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
