'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Typography,
  Box,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { useCart } from '@/hooks/useCart';
import { useCustomerSession } from '@/hooks/useSession';
import { formatPrice } from '@/lib/constants';

export default function OrderConfirmPage() {
  const router = useRouter();
  const { session, isReady } = useCustomerSession();
  const { items, totalAmount, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isReady && !session) router.push('/');
    if (isReady && items.length === 0) router.push('/menu');
  }, [isReady, session, items, router]);

  if (!session || items.length === 0) return null;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: session.customerName,
          tableNumber: session.tableNumber,
          sessionId: session.sessionId,
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productPrice: item.productPrice,
            quantity: item.quantity,
            note: item.note || null,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        clearCart();
        router.push(`/order/success/${data.order.id}`);
      } else {
        setError(data.error || 'Không thể gửi đơn hàng. Vui lòng thử lại.');
        setSubmitting(false);
      }
    } catch {
      setError('Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.');
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ pb: 6, minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <IconButton
          onClick={() => router.back()}
          size="small"
          sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}
        >
          <ArrowBackRoundedIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
          Xác nhận đơn hàng
        </Typography>
      </Box>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Customer & Table Info Card */}
        <Card elevation={0} sx={{ p: 2.5, borderRadius: '24px', border: '1px solid #F1F5F9' }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}
          >
            Bàn phục vụ
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                background: 'linear-gradient(135deg, #FF6B35 0%, #FF4500 100%)',
                color: '#FFFFFF',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.25rem',
                boxShadow: '0 8px 16px -4px rgba(255, 91, 38, 0.35)',
              }}
            >
              {session.tableNumber}
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {session.tableName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Khách gọi: <strong style={{ color: '#0F172A' }}>{session.customerName}</strong>
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* Order Items Card */}
        <Card elevation={0} sx={{ p: 2.5, borderRadius: '24px', border: '1px solid #F1F5F9' }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 2 }}
          >
            Danh sách món ({items.length})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {items.map((item) => (
              <Box key={item.productId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ pr: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    {item.productName}{' '}
                    <span style={{ color: '#FF5B26', fontWeight: 800 }}>×{item.quantity}</span>
                  </Typography>
                  {item.note && (
                    <Typography
                      variant="caption"
                      sx={{ color: '#D97706', bgcolor: '#FFFBEB', px: 1, py: 0.25, borderRadius: '6px', display: 'inline-block', mt: 0.5 }}
                    >
                      📝 {item.note}
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap' }}>
                  {formatPrice(item.productPrice * item.quantity)}
                </Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748B' }}>
              Tổng thanh toán
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#FF5B26' }}>
              {formatPrice(totalAmount)}
            </Typography>
          </Box>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: '16px', fontSize: '0.85rem' }}>
            {error}
          </Alert>
        )}

        {/* Submit Order Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={submitting}
          endIcon={!submitting && <SendRoundedIcon />}
          sx={{
            py: 1.8,
            borderRadius: '18px',
            fontSize: '1rem',
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(255, 91, 38, 0.35)',
          }}
        >
          {submitting ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CircularProgress size={22} color="inherit" />
              <span>Đang gửi đơn đến bếp...</span>
            </Box>
          ) : (
            `GỬI ĐƠN ĐẾN BẾP • ${formatPrice(totalAmount)}`
          )}
        </Button>

        <Typography variant="caption" sx={{ color: '#94A3B8', textAlign: 'center', display: 'block' }}>
          Nhà bếp sẽ nhận đơn tức thì sau khi bạn nhấn nút gửi
        </Typography>
      </Box>
    </Box>
  );
}
