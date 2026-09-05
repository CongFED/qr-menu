'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionProvider, signOut, useSession } from 'next-auth/react';
import {
  Drawer,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import StarRateRoundedIcon from '@mui/icons-material/StarRateRounded';
import ManageHistoryRoundedIcon from '@mui/icons-material/ManageHistoryRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import LandscapeRoundedIcon from '@mui/icons-material/LandscapeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';

const menuLinks = [
  { href: '/admin', label: 'Dashboard', icon: DashboardRoundedIcon },
  { href: '/admin/orders', label: 'Đơn hàng', icon: ReceiptLongRoundedIcon },
  { href: '/admin/tables', label: 'Bàn ăn & QR', icon: TableRestaurantRoundedIcon },
  { href: '/admin/menu', label: 'Quản lý Menu', icon: RestaurantMenuRoundedIcon },
  { href: '/admin/categories', label: 'Danh mục', icon: CategoryRoundedIcon },
];

const otherLinks = [
  { href: '/admin/feedback', label: 'Đánh giá', icon: StarRateRoundedIcon },
  { href: '/admin/audit-logs', label: 'Nhật ký (Audit)', icon: ManageHistoryRoundedIcon },
  { href: '/admin/users', label: 'Người dùng', icon: PeopleAltRoundedIcon },
];

interface SidebarContentProps {
  onNavigate?: () => void;
  showCloseButton?: boolean;
}

function SidebarContent({ onNavigate, showCloseButton }: SidebarContentProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex flex-col justify-between h-full p-4">
      <div>
        {/* Logo & Brand */}
        <div className="flex items-center justify-between px-2 py-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center text-white shadow-md shadow-orange-500/30">
              <LandscapeRoundedIcon sx={{ fontSize: 24 }} />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                HÒN GIAO
              </span>
              <span className="block text-[10px] font-bold text-[#FF5B26] tracking-wider uppercase">
                QR Order POS
              </span>
            </div>
          </div>

          {showCloseButton && (
            <IconButton
              onClick={onNavigate}
              size="small"
              sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' } }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          )}
        </div>

        {/* Store Selector Pill */}
        <div className="mb-6 px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-orange-100 text-[#FF5B26] flex items-center justify-center shrink-0">
              <StorefrontRoundedIcon sx={{ fontSize: 16 }} />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-800 truncate">
                Suối Đá Hòn Giao
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">Chi nhánh chính</span>
            </div>
          </div>
          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
        </div>

        {/* Menu Section */}
        <div className="mb-6">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Menu
          </p>
          <nav className="space-y-1">
            {menuLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/admin'
                  ? pathname === '/admin'
                  : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white shadow-md shadow-orange-500/25 translate-x-0.5'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon sx={{ fontSize: 20, color: isActive ? '#FFFFFF' : '#64748B' }} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Others Section */}
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Hệ thống & Khác
          </p>
          <nav className="space-y-1">
            {otherLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white shadow-md shadow-orange-500/25 translate-x-0.5'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon sx={{ fontSize: 20, color: isActive ? '#FFFFFF' : '#64748B' }} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Profile Pill at Bottom */}
      <div className="pt-4 border-t border-slate-100">
        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-xs">
                <PersonRoundedIcon sx={{ fontSize: 20 }} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {session?.user?.name || 'Quản trị viên'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"
            title="Đăng xuất"
          >
            <LogoutRoundedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Quick bottom nav links for mobile
  const quickBottomLinks = [
    { href: '/admin', label: 'Dashboard', icon: DashboardRoundedIcon },
    { href: '/admin/orders', label: 'Đơn hàng', icon: ReceiptLongRoundedIcon },
    { href: '/admin/tables', label: 'Bàn & QR', icon: TableRestaurantRoundedIcon },
    { href: '/admin/menu', label: 'Menu', icon: RestaurantMenuRoundedIcon },
  ];

  return (
    <>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
        {/* 1. Mobile Top Navbar (< lg screens) */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                (e.currentTarget as HTMLElement)?.blur();
                setMobileDrawerOpen(true);
              }}
              className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors active:scale-95"
              title="Mở menu quản trị"
            >
              <MenuRoundedIcon sx={{ fontSize: 24 }} />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF4500] text-white flex items-center justify-center shadow-sm">
                <LandscapeRoundedIcon sx={{ fontSize: 18 }} />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-sm tracking-tight block leading-tight">
                  HÒN GIAO
                </span>
                <span className="text-[9px] font-bold text-[#FF5B26] tracking-wider uppercase block">
                  ADMIN POS
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="text-xs font-bold text-slate-500 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1"
            title="Đăng xuất"
          >
            <LogoutRoundedIcon sx={{ fontSize: 18 }} />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        </header>

        {/* 2. Desktop Sticky Sidebar (lg+ screens) */}
        <aside className="w-64 bg-white border-r border-slate-100 h-screen sticky top-0 shrink-0 shadow-[2px_0_12px_rgba(0,0,0,0.02)] overflow-y-auto z-40 hidden lg:block">
          <SidebarContent />
        </aside>

        {/* 3. Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1600px] min-w-0 pb-28 lg:pb-8">
          {children}
        </main>

        {/* 4. Mobile Quick Bottom Navigation Bar (< lg screens) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] px-2 py-2">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {quickBottomLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === '/admin'
                  ? pathname === '/admin'
                  : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                    isActive ? 'text-[#FF5B26] font-extrabold' : 'text-slate-400 hover:text-slate-600 font-semibold'
                  }`}
                >
                  <Icon sx={{ fontSize: 22, color: isActive ? '#FF5B26' : '#94A3B8' }} />
                  <span className="text-[10px] mt-0.5 tracking-tight">{link.label}</span>
                </Link>
              );
            })}

            {/* "Thêm..." button to trigger the full Drawer */}
            <button
              type="button"
              onClick={(e) => {
                (e.currentTarget as HTMLElement)?.blur();
                setMobileDrawerOpen(true);
              }}
              className="flex flex-col items-center py-1 px-3 rounded-xl text-slate-400 hover:text-slate-600 font-semibold transition-all"
            >
              <MoreHorizRoundedIcon sx={{ fontSize: 22, color: '#94A3B8' }} />
              <span className="text-[10px] mt-0.5 tracking-tight">Thêm...</span>
            </button>
          </div>
        </nav>
      </div>

      {/* 5. Mobile Slide-out Drawer (Rendered as Sibling, Prevents Aria-Hidden on Focus) */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        disableRestoreFocus
        slotProps={{
          paper: {
            sx: {
              width: 280,
              bgcolor: '#FFFFFF',
              borderTopRightRadius: '24px',
              borderBottomRightRadius: '24px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            },
          },
        }}
      >
        <SidebarContent onNavigate={() => setMobileDrawerOpen(false)} showCloseButton />
      </Drawer>
    </>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SessionProvider>
  );
}
