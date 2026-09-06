'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionProvider, signOut } from 'next-auth/react';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import ManageHistoryRoundedIcon from '@mui/icons-material/ManageHistoryRounded';
import LandscapeRoundedIcon from '@mui/icons-material/LandscapeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import StaffNotificationController from '@/components/staff/StaffNotificationController';

function StaffNav() {
  const pathname = usePathname();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const links = [
    { href: '/staff/orders', label: 'Bếp & Đơn hàng', icon: ReceiptLongRoundedIcon, active: pathname === '/staff/orders' },
    { href: '/staff/calls', label: 'Khách gọi bàn', icon: NotificationsActiveRoundedIcon, active: pathname === '/staff/calls' },
    { href: '/staff/history', label: 'Lịch sử phục vụ', icon: ManageHistoryRoundedIcon, active: pathname === '/staff/history' },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF4500] text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <LandscapeRoundedIcon sx={{ fontSize: 22 }} />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                Suối Đá Hòn Giao
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] bg-orange-50 text-[#FF5B26] font-bold px-2 py-0.5 rounded-md">
                KITCHEN & STAFF POS
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                    link.active
                      ? 'bg-white text-[#FF5B26] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon sx={{ fontSize: 18 }} />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Clock, Sound Controller & Logout */}
          <div className="flex items-center gap-2.5">
            <StaffNotificationController />

            {time && (
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{time}</span>
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/staff/login' })}
              className="text-xs font-bold text-slate-500 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1"
              title="Đăng xuất"
            >
              <LogoutRoundedIcon sx={{ fontSize: 18 }} />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function StaffLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/staff/login') {
    return <SessionProvider>{children}</SessionProvider>;
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-[#F8FAFC]">
        <StaffNav />
        <main className="max-w-7xl mx-auto p-4 sm:p-6">{children}</main>
      </div>
    </SessionProvider>
  );
}
