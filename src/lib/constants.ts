// ============================================
// Order Status
// ============================================

export const ORDER_STATUS = {
  NEW: 'NEW',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVED: 'SERVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'Mới',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chế biến',
  READY: 'Đã chuẩn bị',
  SERVED: 'Đã phục vụ',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-yellow-100 text-yellow-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-800',
  SERVED: 'bg-teal-100 text-teal-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

// Valid status transitions
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVED'],
  SERVED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

// ============================================
// Staff Call Status
// ============================================

export const STAFF_CALL_STATUS = {
  PENDING: 'PENDING',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESOLVED: 'RESOLVED',
} as const;

export type StaffCallStatus = (typeof STAFF_CALL_STATUS)[keyof typeof STAFF_CALL_STATUS];

export const STAFF_CALL_STATUS_LABELS: Record<StaffCallStatus, string> = {
  PENDING: 'Đang chờ',
  ACKNOWLEDGED: 'Đã tiếp nhận',
  RESOLVED: 'Đã xử lý',
};

// ============================================
// User Roles
// ============================================

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// ============================================
// App Config
// ============================================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Suối Đá Hòn Giao';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================
// Formatting
// ============================================

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN');
}
