'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import { useCustomerSession } from '@/hooks/useSession';

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useCustomerSession();
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState(searchParams?.get('table') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }

    const tableNum = parseInt(tableNumber);
    if (!tableNum || tableNum <= 0) {
      setError('Vui lòng nhập số bàn hợp lệ');
      return;
    }

    setLoading(true);

    try {
      // Verify table exists
      const res = await fetch(`/api/tables/verify?number=${tableNum}`);
      const data = await res.json();

      if (!res.ok || !data.table) {
        setError('Số bàn không tồn tại hoặc tạm ngưng. Vui lòng kiểm tra lại.');
        setLoading(false);
        return;
      }

      setSession({
        customerName: customerName.trim(),
        tableNumber: tableNum,
        tableId: data.table.id,
        tableName: data.table.name,
      });

      router.push('/menu');
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: '#F8FAFC',
      }}
    >
      {/* Brand Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box
          sx={{
            width: 76,
            height: 76,
            mx: 'auto',
            mb: 2,
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF4500 100%)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 28px -4px rgba(255, 91, 38, 0.35)',
            color: '#FFFFFF',
          }}
        >
          <RestaurantRoundedIcon sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
          Suối Đá Hòn Giao
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
          Hệ thống gọi món QR • Ẩm thực núi rừng
        </Typography>
      </Box>

      {/* Welcome Card */}
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 400,
          borderRadius: '28px',
          border: '1px solid #F1F5F9',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
          p: { xs: 2.5, sm: 3.5 },
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
            Bắt đầu gọi món
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            Nhập tên & số bàn để nhà bếp phục vụ tận nơi
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Tên của bạn *"
              placeholder="Ví dụ: Anh Nam, Chị Linh..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              fullWidth
              autoFocus
              variant="outlined"
              size="medium"
              slotProps={{
                input: { sx: { borderRadius: '16px', bgcolor: '#F8FAFC' } },
              }}
            />

            <TextField
              label="Số bàn *"
              placeholder="Ví dụ: 1, 2, 10..."
              type="number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              fullWidth
              variant="outlined"
              size="medium"
              slotProps={{
                input: { sx: { borderRadius: '16px', bgcolor: '#F8FAFC' } },
              }}
            />

            {error && (
              <Alert severity="error" sx={{ borderRadius: '14px', fontSize: '0.8rem' }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              endIcon={!loading && <ArrowForwardRoundedIcon />}
              sx={{
                py: 1.6,
                borderRadius: '16px',
                fontSize: '0.95rem',
                fontWeight: 800,
                boxShadow: '0 8px 24px rgba(255, 91, 38, 0.35)',
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Đang mở menu...</span>
                </Box>
              ) : (
                'XEM MENU GỌI MÓN'
              )}
            </Button>
          </Box>
        </form>
      </Card>

      {/* Footer */}
      <Typography variant="caption" sx={{ color: '#94A3B8', mt: 3 }}>
        Không cần cài đặt app • Không cần tạo tài khoản
      </Typography>
    </Box>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress color="primary" />
        </Box>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
