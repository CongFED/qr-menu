'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import { formatPrice, formatDateTime } from '@/lib/constants';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  table: { number: number; name: string };
  items: { productName: string; quantity: number; productPrice: number }[];
}

const statusProps: Record<string, { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'; label: string }> = {
  NEW: { color: 'info', label: 'Mới' },
  CONFIRMED: { color: 'warning', label: 'Đã xác nhận' },
  PREPARING: { color: 'warning', label: 'Đang nấu' },
  READY: { color: 'primary', label: 'Chờ giao' },
  SERVED: { color: 'primary', label: 'Đã phục vụ' },
  COMPLETED: { color: 'success', label: 'Hoàn thành' },
  CANCELLED: { color: 'error', label: 'Đã hủy' },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/staff/orders');
        const data = await res.json();
        if (res.ok) setOrders(data.orders);
      } catch {}
      setLoading(false);
    }
    fetchOrders();
  }, []);

  const filtered = orders
    .filter((o) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(s) ||
        o.customerName.toLowerCase().includes(s) ||
        o.table.name.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              bgcolor: 'rgba(255, 91, 38, 0.1)',
              color: '#FF5B26',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ReceiptLongRoundedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Quản lý Đơn hàng
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Tổng cộng {orders.length} đơn hàng trong hệ thống
            </Typography>
          </Box>
        </Box>

        <TextField
          size="small"
          placeholder="Tìm mã đơn, tên khách, bàn..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 280 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: { borderRadius: '14px', bgcolor: '#FFFFFF' },
            },
          }}
        />
      </Box>

      {/* Orders Table Card with Generous Padding */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: '1px solid #F1F5F9',
          bgcolor: '#FFFFFF',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, px: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
              Chưa có đơn hàng
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>
              Khi khách đặt món, đơn hàng sẽ hiển thị tại đây
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    MÃ ĐƠN
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    BÀN
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    KHÁCH
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    MÓN ĂN
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    TỔNG TIỀN
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    TRẠNG THÁI
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2, px: 3, fontWeight: 800, color: '#475569', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0' }}>
                    THỜI GIAN
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((order) => {
                  const chip = statusProps[order.status] || { color: 'default', label: order.status };
                  return (
                    <TableRow
                      key={order.id}
                      hover
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <TableCell sx={{ py: 2.25, px: 3, fontWeight: 800, fontFamily: 'monospace', color: '#FF5B26', fontSize: '0.85rem' }}>
                        {order.orderNumber}
                      </TableCell>
                      <TableCell sx={{ py: 2.25, px: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          {order.table.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2.25, px: 3 }}>
                        <Typography variant="body2" sx={{ color: '#334155' }}>
                          {order.customerName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2.25, px: 3, maxWidth: 300 }}>
                        <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.5 }}>
                          {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2.25, px: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#0F172A' }}>
                          {formatPrice(order.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2.25, px: 3 }}>
                        <Chip
                          label={chip.label}
                          color={chip.color}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            px: 1,
                            py: 0.25,
                            borderRadius: '10px',
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2.25, px: 3 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                          {formatDateTime(order.createdAt)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
