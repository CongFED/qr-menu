'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  Card,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import SoupKitchenRoundedIcon from '@mui/icons-material/SoupKitchenRounded';
import { formatPrice } from '@/lib/constants';

interface OrderItemInfo {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  note: string | null;
  image: string | null;
}

interface ActiveOrderInfo {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  itemCount: number;
  note?: string | null;
  items?: OrderItemInfo[];
}

function getOrderStatusBadge(status: string) {
  switch (status) {
    case 'NEW':
      return { label: 'MỚI ĐẶT', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
    case 'CONFIRMED':
      return { label: 'ĐÃ XÁC NHẬN', bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' };
    case 'PREPARING':
      return { label: 'ĐANG CHẾ BIẾN', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' };
    case 'READY':
      return { label: 'CHỜ LÊN MÓN', bg: '#FAF5FF', color: '#7E22CE', border: '#E9D5FF' };
    case 'SERVED':
      return { label: 'ĐÃ PHỤC VỤ', bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' };
    case 'COMPLETED':
      return { label: 'HOÀN TẤT', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
    default:
      return { label: status, bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' };
  }
}

interface TableWithStatus {
  id: string;
  number: number;
  name: string;
  isActive: boolean;
  qrCode: string | null;
  occupancyStatus: 'OCCUPIED' | 'AVAILABLE' | 'INACTIVE';
  customerName: string | null;
  activeOrderCount: number;
  itemCount: number;
  currentBillAmount: number;
  firstOrderTime: string | null;
  activeOrders: ActiveOrderInfo[];
  hasPendingCall: boolean;
  pendingCallTime: string | null;
}

interface SummaryStats {
  total: number;
  occupied: number;
  available: number;
  inactive: number;
  callingStaff: number;
  inProgressRevenue: number;
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState<TableWithStatus[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    total: 0,
    occupied: 0,
    available: 0,
    inactive: 0,
    callingStaff: 0,
    inProgressRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OCCUPIED' | 'AVAILABLE' | 'INACTIVE'>('ALL');

  // Modal Create / Edit
  const [showForm, setShowForm] = useState(false);
  const [editTable, setEditTable] = useState<TableWithStatus | null>(null);
  const [formData, setFormData] = useState({ number: 0, name: '', isActive: true });
  const [saving, setSaving] = useState(false);

  // Modal QR
  const [qrModalTable, setQrModalTable] = useState<TableWithStatus | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Modal View Table Bill & Orders Detail
  const [billModalTable, setBillModalTable] = useState<TableWithStatus | null>(null);
  const [confirmSettle, setConfirmSettle] = useState(false);
  const [settling, setSettling] = useState(false);

  // Snackbar Toast
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tables');
      const data = await res.json();
      if (res.ok) {
        setTables(data.tables || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 8 seconds for live table occupancy
    const timer = setInterval(fetchData, 8000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // SSE for instant table status updates when orders change
  useEffect(() => {
    const es = new EventSource('/api/sse/orders?channel=staff-orders');
    es.addEventListener('new_order', () => fetchData());
    es.addEventListener('order_updated', () => fetchData());
    return () => es.close();
  }, [fetchData]);

  // Helper for time elapsed
  function formatElapsedTime(isoString: string | null) {
    if (!isoString) return '';
    const diffMin = Math.max(1, Math.floor((Date.now() - new Date(isoString).getTime()) / 60000));
    if (diffMin < 60) return `${diffMin} phút trước`;
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hours}h ${mins}p trước`;
  }

  function openEdit(t: TableWithStatus) {
    setEditTable(t);
    setFormData({ number: t.number, name: t.name, isActive: t.isActive });
    setShowForm(true);
  }

  function openCreate() {
    setEditTable(null);
    const maxNum = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) : 0;
    setFormData({
      number: maxNum + 1,
      name: `Bàn ${String(maxNum + 1).padStart(2, '0')}`,
      isActive: true,
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = editTable ? `/api/admin/tables/${editTable.id}` : '/api/admin/tables';
      const res = await fetch(url, {
        method: editTable ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || 'Lỗi khi lưu bàn');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(t: TableWithStatus) {
    try {
      await fetch(`/api/admin/tables/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function openQrModal(t: TableWithStatus) {
    setQrModalTable(t);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const targetUrl = `${origin}/table/${t.number}`;
      const url = await QRCode.toDataURL(targetUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate QR:', err);
    }
  }

  function handlePrintQr() {
    if (!qrModalTable || !qrDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mã QR - ${qrModalTable.name}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { border: 2px solid #FF5B26; border-radius: 20px; padding: 28px; text-align: center; max-width: 360px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            h1 { color: #FF5B26; margin: 0 0 4px; font-size: 24px; font-weight: 800; }
            p { color: #64748B; margin: 0 0 16px; font-size: 14px; }
            img { width: 250px; height: 250px; border-radius: 12px; }
            h2 { margin: 16px 0 4px; color: #0F172A; font-size: 22px; }
            .footer { font-size: 12px; color: #94A3B8; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Suối Đá Hòn Giao</h1>
            <p>Quét mã QR để xem thực đơn & gọi món</p>
            <img src="${qrDataUrl}" alt="QR Code" />
            <h2>${qrModalTable.name}</h2>
            <div class="footer">Hệ thống QR Order tự động</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Handle table checkout from admin modal
  async function handleSettleTable(tableId: string, tableName: string, amount: number) {
    setSettling(true);
    try {
      const res = await fetch(`/api/admin/tables/${tableId}/checkout`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setBillModalTable(null);
        setConfirmSettle(false);
        setSnackbar({
          open: true,
          message: `Thanh toán thành công ${tableName} (${formatPrice(amount)}) - Bàn đã chuyển sang trạng thái trống!`,
          severity: 'success',
        });
        fetchData();
      } else {
        setSnackbar({
          open: true,
          message: data.error || 'Thanh toán thất bại',
          severity: 'error',
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'Lỗi kết nối khi thanh toán',
        severity: 'error',
      });
    } finally {
      setSettling(false);
    }
  }

  // Filter tables
  const filteredTables = tables.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.occupancyStatus === statusFilter;
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* 1. Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: '16px',
              bgcolor: 'rgba(255, 91, 38, 0.1)',
              color: '#FF5B26',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TableRestaurantRoundedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Quản lý Bàn ăn & Sơ đồ trạng thái
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.25 }}>
              Theo dõi trực tiếp bàn nào đang có khách, bàn nào đang trống • Quản lý & In mã QR
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openCreate}
          sx={{
            px: 3,
            py: 1.25,
            borderRadius: '16px',
            fontWeight: 800,
            fontSize: '0.875rem',
            boxShadow: '0 4px 14px rgba(255, 91, 38, 0.35)',
          }}
        >
          Thêm bàn mới
        </Button>
      </Box>

      {/* 2. Top Summary KPI Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {/* Total Tables */}
        <Card
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '20px',
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Tổng số bàn
            </Typography>
            <TableRestaurantRoundedIcon sx={{ fontSize: 20, color: '#94A3B8' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A' }}>
            {summary.total}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', mt: 0.5, display: 'block' }}>
            Hệ thống nhà hàng
          </Typography>
        </Card>

        {/* Occupied Tables */}
        <Card
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '20px',
            bgcolor: '#FFF7ED',
            border: '1.5px solid #FED7AA',
            boxShadow: '0 2px 8px rgba(255, 91, 38, 0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#EA580C', textTransform: 'uppercase' }}>
              Đang có khách
            </Typography>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: '#FF5B26',
                boxShadow: '0 0 0 4px rgba(255, 91, 38, 0.25)',
                animation: 'pulse 1.8s infinite',
              }}
            />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#C2410C' }}>
            {summary.occupied} <span className="text-sm font-bold text-orange-600">bàn</span>
          </Typography>
          <Typography variant="caption" sx={{ color: '#EA580C', fontWeight: 700, mt: 0.5, display: 'block' }}>
            Tạm tính: {formatPrice(summary.inProgressRevenue)}
          </Typography>
        </Card>

        {/* Available Tables */}
        <Card
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '20px',
            bgcolor: '#F0FDF4',
            border: '1.5px solid #BBF7D0',
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#16A34A', textTransform: 'uppercase' }}>
              Bàn trống sẵn sàng
            </Typography>
            <CheckCircleRoundedIcon sx={{ fontSize: 20, color: '#16A34A' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#15803D' }}>
            {summary.available} <span className="text-sm font-bold text-emerald-600">bàn</span>
          </Typography>
          <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700, mt: 0.5, display: 'block' }}>
            Sẵn sàng nhận khách mới
          </Typography>
        </Card>

        {/* Calling Staff Warning */}
        <Card
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '20px',
            bgcolor: summary.callingStaff > 0 ? '#FEF2F2' : '#F8FAFC',
            border: '1.5px solid',
            borderColor: summary.callingStaff > 0 ? '#FECACA' : '#E2E8F0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: summary.callingStaff > 0 ? '#DC2626' : '#64748B',
                textTransform: 'uppercase',
              }}
            >
              Gọi nhân viên
            </Typography>
            <NotificationsActiveRoundedIcon
              sx={{
                fontSize: 20,
                color: summary.callingStaff > 0 ? '#DC2626' : '#94A3B8',
                animation: summary.callingStaff > 0 ? 'bounce 1s infinite' : 'none',
              }}
            />
          </Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 900, color: summary.callingStaff > 0 ? '#DC2626' : '#475569' }}
          >
            {summary.callingStaff} <span className="text-sm font-bold">yêu cầu</span>
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: summary.callingStaff > 0 ? '#B91C1C' : '#94A3B8',
              fontWeight: 700,
              mt: 0.5,
              display: 'block',
            }}
          >
            {summary.callingStaff > 0 ? 'Cần phục vụ ngay!' : 'Không có yêu cầu'}
          </Typography>
        </Card>
      </Box>

      {/* 3. Filter Segmented Tabs */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant={statusFilter === 'ALL' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setStatusFilter('ALL')}
          sx={{
            borderRadius: '12px',
            fontWeight: 800,
            textTransform: 'none',
            fontSize: '0.8rem',
            px: 2,
          }}
        >
          Tất cả ({summary.total})
        </Button>
        <Button
          variant={statusFilter === 'OCCUPIED' ? 'contained' : 'outlined'}
          color="warning"
          size="small"
          onClick={() => setStatusFilter('OCCUPIED')}
          sx={{
            borderRadius: '12px',
            fontWeight: 800,
            textTransform: 'none',
            fontSize: '0.8rem',
            px: 2,
            bgcolor: statusFilter === 'OCCUPIED' ? '#EA580C' : 'transparent',
            borderColor: '#FDBA74',
            color: statusFilter === 'OCCUPIED' ? '#FFFFFF' : '#C2410C',
          }}
        >
          🔴 Đang có khách ({summary.occupied})
        </Button>
        <Button
          variant={statusFilter === 'AVAILABLE' ? 'contained' : 'outlined'}
          color="success"
          size="small"
          onClick={() => setStatusFilter('AVAILABLE')}
          sx={{
            borderRadius: '12px',
            fontWeight: 800,
            textTransform: 'none',
            fontSize: '0.8rem',
            px: 2,
            bgcolor: statusFilter === 'AVAILABLE' ? '#16A34A' : 'transparent',
            borderColor: '#86EFAC',
            color: statusFilter === 'AVAILABLE' ? '#FFFFFF' : '#15803D',
          }}
        >
          🟢 Bàn trống ({summary.available})
        </Button>
        <Button
          variant={statusFilter === 'INACTIVE' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setStatusFilter('INACTIVE')}
          sx={{
            borderRadius: '12px',
            fontWeight: 800,
            textTransform: 'none',
            fontSize: '0.8rem',
            px: 2,
            borderColor: '#CBD5E1',
            color: statusFilter === 'INACTIVE' ? '#FFFFFF' : '#64748B',
          }}
        >
          ⚪ Tạm ngưng ({summary.inactive})
        </Button>
      </Box>

      {/* 4. Grid of Tables with Live Occupancy Display */}
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 12 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : filteredTables.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, bgcolor: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
          <TableRestaurantRoundedIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#475569' }}>
            Không có bàn nào thuộc trạng thái này
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
              xl: 'repeat(5, 1fr)',
            },
            gap: 2.5,
          }}
        >
          {filteredTables.map((t) => {
            const isOccupied = t.occupancyStatus === 'OCCUPIED';
            const isAvailable = t.occupancyStatus === 'AVAILABLE';
            const isInactive = t.occupancyStatus === 'INACTIVE';

            return (
              <Card
                key={t.id}
                elevation={0}
                sx={{
                  borderRadius: '26px',
                  border: '2px solid',
                  borderColor: isOccupied
                    ? '#FDBA74'
                    : isAvailable
                    ? '#BBF7D0'
                    : '#E2E8F0',
                  bgcolor: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isOccupied
                    ? '0 10px 25px -5px rgba(234, 88, 12, 0.1)'
                    : '0 4px 12px rgba(0,0,0,0.02)',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: isOccupied
                      ? '0 16px 30px -4px rgba(234, 88, 12, 0.18)'
                      : '0 12px 24px -4px rgba(15, 23, 42, 0.08)',
                  },
                }}
              >
                {/* Top Status Banner Strip */}
                <Box
                  sx={{
                    px: 2.5,
                    py: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: isOccupied
                      ? '#FFF7ED'
                      : isAvailable
                      ? '#F0FDF4'
                      : '#F8FAFC',
                    borderBottom: '1px solid',
                    borderColor: isOccupied
                      ? '#FED7AA'
                      : isAvailable
                      ? '#DCFCE7'
                      : '#E2E8F0',
                  }}
                >
                  {/* Status Indicator */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: isOccupied
                          ? '#EA580C'
                          : isAvailable
                          ? '#16A34A'
                          : '#94A3B8',
                        animation: isOccupied ? 'pulse 1.8s infinite' : 'none',
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        letterSpacing: '0.02em',
                        color: isOccupied
                          ? '#C2410C'
                          : isAvailable
                          ? '#15803D'
                          : '#64748B',
                      }}
                    >
                      {isOccupied
                        ? 'ĐANG CÓ KHÁCH'
                        : isAvailable
                        ? 'BÀN TRỐNG'
                        : 'TẠM NGƯNG'}
                    </Typography>
                  </Box>

                  {/* Calling Staff Alert Tag */}
                  {t.hasPendingCall && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        bgcolor: '#EF4444',
                        color: '#FFFFFF',
                        px: 1,
                        py: 0.25,
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 800,
                        animation: 'bounce 1s infinite',
                      }}
                    >
                      <NotificationsActiveRoundedIcon sx={{ fontSize: 12 }} />
                      <span>GỌI PHỤC VỤ</span>
                    </Box>
                  )}
                </Box>

                {/* Card Main Body */}
                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Table Header: Big Number + Name */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '18px',
                        background: isOccupied
                          ? 'linear-gradient(135deg, #FF6B35 0%, #FF4500 100%)'
                          : isAvailable
                          ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                          : '#E2E8F0',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.4rem',
                        boxShadow: isOccupied
                          ? '0 6px 14px rgba(255, 91, 38, 0.35)'
                          : isAvailable
                          ? '0 6px 14px rgba(34, 197, 94, 0.25)'
                          : 'none',
                      }}
                    >
                      {t.number}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                        {t.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                        Khu vực sảnh chính
                      </Typography>
                    </Box>
                  </Box>

                  {/* Occupied State Info Box */}
                  {isOccupied && (
                    <Box
                      sx={{
                        p: 1.75,
                        borderRadius: '16px',
                        bgcolor: '#FFF7ED',
                        border: '1px solid #FFEDD5',
                        mb: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.75,
                      }}
                    >
                      {/* Customer name & Time */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <PersonRoundedIcon sx={{ fontSize: 16, color: '#EA580C' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#9A3412', fontSize: '0.82rem' }}>
                            {t.customerName || 'Khách tại bàn'}
                          </Typography>
                        </Box>
                        {t.firstOrderTime && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#C2410C' }}>
                            <AccessTimeRoundedIcon sx={{ fontSize: 13 }} />
                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>
                              {formatElapsedTime(t.firstOrderTime)}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Orders & Dishes count */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#C2410C', fontWeight: 600 }}>
                          {t.activeOrderCount} đợt đặt món • {t.itemCount} phần ăn
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#EA580C', fontSize: '0.9rem' }}>
                          {formatPrice(t.currentBillAmount)}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Available State Info Box */}
                  {isAvailable && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: '#F0FDF4',
                        border: '1px solid #DCFCE7',
                        mb: 2,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700, display: 'block' }}>
                        Bàn sạch • Sẵn sàng đón khách
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                        Khách có thể quét mã QR để vào gọi món ngay
                      </Typography>
                    </Box>
                  )}

                  {/* Inactive State Info Box */}
                  {isInactive && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        mb: 2,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, display: 'block' }}>
                        Bàn đang tạm khóa
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                        Không hiển thị nhận khách gọi món
                      </Typography>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Primary Button */}
                    {isOccupied ? (
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={<ReceiptLongRoundedIcon sx={{ fontSize: 16 }} />}
                        onClick={() => setBillModalTable(t)}
                        sx={{
                          borderRadius: '14px',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          py: 0.9,
                          bgcolor: '#EA580C',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 10px rgba(234, 88, 12, 0.25)',
                          '&:hover': { bgcolor: '#C2410C' },
                        }}
                      >
                        Xem đơn & Tạm tính
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<QrCode2RoundedIcon sx={{ fontSize: 16 }} />}
                        onClick={() => openQrModal(t)}
                        sx={{
                          borderRadius: '14px',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          py: 0.9,
                          bgcolor: '#F8FAFC',
                          borderColor: '#CBD5E1',
                          color: '#334155',
                          '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' },
                        }}
                      >
                        Mã QR Đặt Món
                      </Button>
                    )}

                    {/* Secondary Actions Row */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: isOccupied ? '1fr 1fr' : '1fr 1fr', gap: 1 }}>
                      {isOccupied ? (
                        <Button
                          size="small"
                          startIcon={<QrCode2RoundedIcon sx={{ fontSize: 14 }} />}
                          onClick={() => openQrModal(t)}
                          sx={{
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            py: 0.6,
                            bgcolor: '#F8FAFC',
                            color: '#475569',
                            border: '1px solid #E2E8F0',
                            '&:hover': { bgcolor: '#F1F5F9' },
                          }}
                        >
                          Mã QR
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          startIcon={t.isActive ? <VisibilityOffRoundedIcon sx={{ fontSize: 14 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 14 }} />}
                          onClick={() => handleToggle(t)}
                          sx={{
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            py: 0.6,
                            bgcolor: t.isActive ? '#FFFBEB' : '#F0FDF4',
                            color: t.isActive ? '#D97706' : '#16A34A',
                            border: '1px solid',
                            borderColor: t.isActive ? '#FDE68A' : '#BBF7D0',
                            '&:hover': { bgcolor: t.isActive ? '#FEF3C7' : '#DCFCE7' },
                          }}
                        >
                          {t.isActive ? 'Ẩn' : 'Hiện'}
                        </Button>
                      )}

                      <Button
                        size="small"
                        startIcon={<EditRoundedIcon sx={{ fontSize: 14 }} />}
                        onClick={() => openEdit(t)}
                        sx={{
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          py: 0.6,
                          bgcolor: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          '&:hover': { bgcolor: '#DBEAFE' },
                        }}
                      >
                        Sửa bàn
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Card>
            );
          })}
        </Box>
      )}

      {/* ============================================================ */}
      {/* 5. Modal View Table Orders & Settle Bill (Chi tiết đơn tại bàn) */}
      {/* ============================================================ */}
      <Dialog
        open={Boolean(billModalTable)}
        onClose={() => {
          setBillModalTable(null);
          setConfirmSettle(false);
        }}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '14px',
                bgcolor: '#FFF7ED',
                color: '#EA580C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ReceiptLongRoundedIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                Đơn Món: {billModalTable?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Khách: <strong>{billModalTable?.customerName}</strong> • {billModalTable?.activeOrderCount} lượt gọi món
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => {
              setBillModalTable(null);
              setConfirmSettle(false);
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Bill summary callout */}
          <Box
            sx={{
              p: 2,
              borderRadius: '16px',
              bgcolor: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
              background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
              border: '1px solid #FED7AA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#9A3412', textTransform: 'uppercase' }}>
                Tổng tiền tạm tính
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#C2410C' }}>
                {formatPrice(billModalTable?.currentBillAmount || 0)}
              </Typography>
            </Box>
            <Chip
              label={`${billModalTable?.itemCount || 0} món`}
              size="small"
              sx={{ bgcolor: '#FFFFFF', color: '#EA580C', fontWeight: 800 }}
            />
          </Box>

          {/* Orders & Dishes list */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', fontSize: '0.9rem' }}>
                Danh sách món ăn khách đã gọi:
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                {billModalTable?.activeOrders.length || 0} lượt đặt • {billModalTable?.itemCount || 0} phần
              </Typography>
            </Box>

            {billModalTable?.activeOrders.map((o, idx) => {
              const badge = getOrderStatusBadge(o.status);
              return (
                <Box
                  key={o.id}
                  sx={{
                    borderRadius: '18px',
                    bgcolor: '#FFFFFF',
                    border: '1.5px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Order round header */}
                  <Box
                    sx={{
                      p: 1.75,
                      bgcolor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '8px',
                          bgcolor: '#FFEDD5',
                          color: '#EA580C',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '0.75rem',
                        }}
                      >
                        #{idx + 1}
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            {o.orderNumber}
                          </Typography>
                          <Chip
                            label={badge.label}
                            size="small"
                            sx={{
                              fontSize: '10px',
                              height: 20,
                              fontWeight: 800,
                              bgcolor: badge.bg,
                              color: badge.color,
                              border: '1px solid',
                              borderColor: badge.border,
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                          Đặt lúc {new Date(o.createdAt).toLocaleTimeString('vi-VN')} • {o.itemCount} món
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#EA580C' }}>
                      {formatPrice(o.totalAmount)}
                    </Typography>
                  </Box>

                  {/* List of individual dishes */}
                  <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {o.items && o.items.length > 0 ? (
                      o.items.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            p: 1.25,
                            borderRadius: '12px',
                            bgcolor: '#F8FAFC',
                            border: '1px solid #F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1.5,
                            transition: 'all 0.15s ease-in-out',
                            '&:hover': { bgcolor: '#F1F5F9' },
                          }}
                        >
                          {/* Dish Image + Name & Note */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                            {item.image ? (
                              <Box
                                component="img"
                                src={item.image}
                                alt={item.productName}
                                sx={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: '10px',
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                  border: '1px solid #E2E8F0',
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: '10px',
                                  bgcolor: '#FFF7ED',
                                  color: '#EA580C',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <SoupKitchenRoundedIcon sx={{ fontSize: 22 }} />
                              </Box>
                            )}

                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 800,
                                  color: '#0F172A',
                                  lineHeight: 1.25,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.productName}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                                  {formatPrice(item.productPrice)}
                                </Typography>
                                {item.note && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      bgcolor: '#FEF3C7',
                                      color: '#B45309',
                                      px: 0.75,
                                      py: 0.1,
                                      borderRadius: '6px',
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    📝 {item.note}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>

                          {/* Quantity badge & Subtotal */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, textAlign: 'right' }}>
                            <Box
                              sx={{
                                px: 1,
                                py: 0.35,
                                borderRadius: '8px',
                                bgcolor: '#FFEDD5',
                                color: '#C2410C',
                                fontWeight: 900,
                                fontSize: '0.8rem',
                              }}
                            >
                              x{item.quantity}
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', minWidth: 75 }}>
                              {formatPrice(item.productPrice * item.quantity)}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" sx={{ color: '#94A3B8', p: 1, textAlign: 'center' }}>
                        {o.itemCount} món ăn
                      </Typography>
                    )}

                    {/* Order batch note */}
                    {o.note && (
                      <Box sx={{ p: 1, bgcolor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FEF3C7' }}>
                        <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 700 }}>
                          📌 Ghi chú lượt gọi này: {o.note}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
            {/* Confirmation warning banner when user clicks checkout */}
            {confirmSettle && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  bgcolor: '#FEF2F2',
                  border: '1.5px solid #FCA5A5',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#991B1B' }}>
                  ⚠️ Xác nhận thanh toán & Trả bàn trống?
                </Typography>
                <Typography variant="body2" sx={{ color: '#7F1D1D', fontSize: '0.85rem' }}>
                  Hệ thống sẽ hoàn tất phục vụ cho <strong>{billModalTable?.name}</strong>, quyết toán tổng số tiền{' '}
                  <strong>{formatPrice(billModalTable?.currentBillAmount || 0)}</strong> và chuyển bàn về trạng thái{' '}
                  <strong>Bàn trống</strong> đón lượt khách tiếp theo.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1.5, display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {!confirmSettle ? (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  if (billModalTable) {
                    window.location.href = `/staff/orders`;
                  }
                }}
                sx={{
                  borderRadius: '14px',
                  fontWeight: 700,
                  textTransform: 'none',
                  color: '#64748B',
                  borderColor: '#CBD5E1',
                }}
              >
                Vào Màn hình Bếp
              </Button>

              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={() => setConfirmSettle(true)}
                sx={{
                  borderRadius: '14px',
                  fontWeight: 800,
                  textTransform: 'none',
                  bgcolor: '#16A34A',
                  color: '#FFFFFF !important',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                  '&:hover': { bgcolor: '#15803D' },
                }}
              >
                Thanh toán & Trả bàn trống
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                disabled={settling}
                onClick={() => setConfirmSettle(false)}
                sx={{
                  borderRadius: '14px',
                  fontWeight: 700,
                  textTransform: 'none',
                  color: '#64748B',
                  borderColor: '#CBD5E1',
                }}
              >
                Hủy / Quay lại
              </Button>

              <Button
                variant="contained"
                color="success"
                disabled={settling}
                startIcon={
                  settling ? <CircularProgress size={18} sx={{ color: '#FFFFFF' }} /> : <CheckCircleRoundedIcon />
                }
                onClick={() => {
                  if (billModalTable) {
                    handleSettleTable(
                      billModalTable.id,
                      billModalTable.name,
                      billModalTable.currentBillAmount
                    );
                  }
                }}
                sx={{
                  borderRadius: '14px',
                  fontWeight: 800,
                  textTransform: 'none',
                  bgcolor: '#16A34A',
                  color: '#FFFFFF !important',
                  boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)',
                  '&:hover': { bgcolor: '#15803D' },
                }}
              >
                {settling ? 'Đang hoàn tất...' : 'Xác nhận thanh toán ngay'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ============================================================ */}
      {/* 6. Modal QR Code Print */}
      {/* ============================================================ */}
      <Dialog
        open={Boolean(qrModalTable)}
        onClose={() => {
          setQrModalTable(null);
          setQrDataUrl('');
        }}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: '#0F172A' }}>
            Mã QR - {qrModalTable?.name}
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              setQrModalTable(null);
              setQrDataUrl('');
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5 }}>
            Khách dùng camera điện thoại quét mã sẽ vào thẳng bàn này để xem thực đơn & gọi món
          </Typography>

          {qrDataUrl ? (
            <Box
              sx={{
                display: 'inline-block',
                p: 2,
                bgcolor: '#FFFFFF',
                borderRadius: '20px',
                border: '2px solid #FED7AA',
                boxShadow: '0 8px 24px rgba(255, 91, 38, 0.15)',
              }}
            >
              <img src={qrDataUrl} alt="QR Code" style={{ width: 220, height: 220, display: 'block' }} />
            </Box>
          ) : (
            <CircularProgress size={40} />
          )}

          <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 2 }}>
            Đường dẫn gọi món trực tiếp: /table/{qrModalTable?.number}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setQrModalTable(null);
              setQrDataUrl('');
            }}
            sx={{ borderRadius: '14px', fontWeight: 700, textTransform: 'none' }}
          >
            Đóng
          </Button>

          <Button
            variant="contained"
            startIcon={<PrintRoundedIcon />}
            onClick={handlePrintQr}
            sx={{
              borderRadius: '14px',
              fontWeight: 800,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(255, 91, 38, 0.3)',
            }}
          >
            In Mã QR Ra Giấy
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================ */}
      {/* 7. Modal Create / Edit Table */}
      {/* ============================================================ */}
      <Dialog
        open={showForm}
        onClose={() => setShowForm(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <DialogTitle component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: '#0F172A' }}>
            {editTable ? 'Chỉnh sửa bàn' : 'Thêm bàn mới'}
          </Typography>
          <IconButton size="small" onClick={() => setShowForm(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 3 }}>
          <TextField
            label="Số bàn *"
            type="number"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 0 })}
            fullWidth
            size="small"
            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
          />

          <TextField
            label="Tên hiển thị *"
            placeholder="Ví dụ: Bàn 01, Bàn VIP..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            size="small"
            slotProps={{ input: { sx: { borderRadius: '12px' } } }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                Kích hoạt hoạt động bàn này
              </Typography>
            }
          />
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setShowForm(false)}
            sx={{ borderRadius: '14px', fontWeight: 700, textTransform: 'none' }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              borderRadius: '14px',
              fontWeight: 800,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(255, 91, 38, 0.3)',
            }}
          >
            {saving ? 'Đang lưu...' : editTable ? 'Cập nhật' : 'Tạo bàn'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            borderRadius: '14px',
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            bgcolor: snackbar.severity === 'success' ? '#16A34A !important' : undefined,
            color: '#FFFFFF !important',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
