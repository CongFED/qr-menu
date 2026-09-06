'use client';

import { useState, useEffect, Suspense } from 'react';
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

  // If table parameter exists in URL, redirect directly to /table/[number]
  useEffect(() => {
    const table = searchParams?.get('table');
    if (table) {
      router.replace(`/table/${table}`);
    }
  }, [searchParams, router]);

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
      // Create or join active server table session
      const res = await fetch(`/api/tables/${tableNum}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: customerName.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.session) {
        setError(data.error || 'Số bàn không tồn tại hoặc tạm ngưng. Vui lòng kiểm tra lại.');
        setLoading(false);
        return;
      }

      setSession({
        sessionId: data.session.sessionId,
        customerName: data.session.customerName,
        tableNumber: data.session.tableNumber,
        tableId: data.session.tableId,
        tableName: data.session.tableName,
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
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: { xs: 2, sm: 3 },
        bgcolor: '#F8FAFC',
        overflow: 'hidden',
      }}
    >
      {/* Brand Header */}
      <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 2.5 } }}>
        <Box
          sx={{
            width: { xs: 58, sm: 66 },
            height: { xs: 58, sm: 66 },
            mx: 'auto',
            mb: 1.5,
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF4500 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 24px -4px rgba(255, 91, 38, 0.35)',
            color: '#FFFFFF',
          }}
        >
          <RestaurantRoundedIcon sx={{ fontSize: { xs: 30, sm: 34 } }} />
        </Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', fontSize: { xs: '1.35rem', sm: '1.5rem' } }}
        >
          Suối Đá Hòn Giao
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.25 }}>
          Hệ thống gọi món QR • Ẩm thực núi rừng
        </Typography>
      </Box>

      {/* Welcome Card */}
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 380,
          borderRadius: '24px',
          border: '1px solid #F1F5F9',
          boxShadow: '0 16px 36px -12px rgba(15, 23, 42, 0.08)',
          p: { xs: 2.25, sm: 3 },
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
            Bắt đầu gọi món
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            Nhập tên & số bàn để nhà bếp phục vụ tận nơi
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            <TextField
              label="Tên của bạn *"
              placeholder="Ví dụ: Anh Nam, Chị Linh..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              fullWidth
              autoFocus
              variant="outlined"
              size="small"
              slotProps={{
                input: { sx: { borderRadius: '14px', bgcolor: '#F8FAFC' } },
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
              size="small"
              slotProps={{
                input: { sx: { borderRadius: '14px', bgcolor: '#F8FAFC' } },
              }}
            />

            {error && (
              <Alert severity="error" sx={{ borderRadius: '12px', fontSize: '0.75rem', py: 0.5 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              endIcon={!loading && <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                py: 1.3,
                borderRadius: '14px',
                fontSize: '0.9rem',
                fontWeight: 800,
                boxShadow: '0 6px 20px rgba(255, 91, 38, 0.35)',
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CircularProgress size={18} color="inherit" />
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
      <Typography variant="caption" sx={{ color: '#94A3B8', mt: 2, fontSize: '0.75rem' }}>
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
