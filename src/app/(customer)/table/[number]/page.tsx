'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import TableRestaurantRoundedIcon from '@mui/icons-material/TableRestaurantRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import { useCustomerSession } from '@/hooks/useSession';

export default function TableQrPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const resolvedParams = use(params);
  const tableNumStr = resolvedParams.number;
  const tableNumber = parseInt(tableNumStr);

  const router = useRouter();
  const { setSession } = useCustomerSession();

  const [checking, setChecking] = useState(true);
  const [tableInfo, setTableInfo] = useState<{ id: string; number: number; name: string; isActive: boolean } | null>(null);
  const [hasActive, setHasActive] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<string>('');

  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Check if this table has an active session on mount
  useEffect(() => {
    async function checkTableSession() {
      if (isNaN(tableNumber) || tableNumber <= 0) {
        setError('Số bàn không hợp lệ');
        setChecking(false);
        return;
      }

      try {
        const res = await fetch(`/api/tables/${tableNumber}/session`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Không thể kiểm tra thông tin bàn');
          setChecking(false);
          return;
        }

        if (data.hasActiveSession && data.session) {
          // Table ALREADY has an active session!
          // Join the active session directly and navigate to menu
          setHasActive(true);
          setExistingCustomer(data.session.customerName);
          setSession({
            sessionId: data.session.sessionId,
            customerName: data.session.customerName,
            tableNumber: data.session.tableNumber,
            tableId: data.session.tableId,
            tableName: data.session.tableName,
          });

          // Redirect straight to menu
          router.replace('/menu');
          return;
        }

        // Table is vacant / available
        setTableInfo(data.table);
      } catch {
        setError('Không thể kết nối máy chủ');
      } finally {
        setChecking(false);
      }
    }

    checkTableSession();
  }, [tableNumber, setSession, router]);

  // 2. Handle creating a new session for a vacant table
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/tables/${tableNumber}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: customerName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Không thể tạo phiên bàn');
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

      router.replace('/menu');
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  if (checking || hasActive) {
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
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 68,
            height: 68,
            borderRadius: '22px',
            bgcolor: '#FFF7ED',
            color: '#FF5B26',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            boxShadow: '0 8px 20px -4px rgba(255, 91, 38, 0.25)',
          }}
        >
          <CircularProgress size={32} sx={{ color: '#FF5B26' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          {hasActive ? `Đang vào Bàn ${tableNumber}...` : 'Đang nhận diện bàn...'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          {hasActive
            ? `Bàn đang có khách (${existingCustomer}). Đang kết nối vào menu nhóm...`
            : 'Vui lòng chờ trong giây lát'}
        </Typography>
      </Box>
    );
  }

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
      <Box sx={{ textAlign: 'center', mb: { xs: 1.5, sm: 2 } }}>
        <Box
          sx={{
            width: { xs: 56, sm: 64 },
            height: { xs: 56, sm: 64 },
            mx: 'auto',
            mb: 1.25,
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

      {/* Card */}
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
        {/* Table Badge Pill */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            bgcolor: '#FFF7ED',
            border: '1px solid #FFEDD5',
            borderRadius: '14px',
            py: 1,
            px: 2,
            mb: 2,
          }}
        >
          <TableRestaurantRoundedIcon sx={{ fontSize: 22, color: '#FF5B26' }} />
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#9A3412', lineHeight: 1.2 }}>
              {tableInfo?.name || `Bàn số ${tableNumber}`}
            </Typography>
            <Typography variant="caption" sx={{ color: '#C2410C', fontWeight: 600 }}>
              Bàn trống • Sẵn sàng phục vụ
            </Typography>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
            Bắt đầu gọi món
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            Nhập tên của bạn để mở phiên gọi món cho bàn này
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
                input: {
                  sx: { borderRadius: '14px', bgcolor: '#F8FAFC' },
                  startAdornment: (
                    <PeopleAltRoundedIcon sx={{ color: '#94A3B8', mr: 1, fontSize: 18 }} />
                  ),
                },
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
                'VÀO MENU GỌI MÓN'
              )}
            </Button>
          </Box>
        </form>
      </Card>

      {/* Footer */}
      <Typography variant="caption" sx={{ color: '#94A3B8', mt: 2, fontSize: '0.75rem' }}>
        Mọi người cùng bàn quét mã sẽ tự động vào chung bàn này
      </Typography>
    </Box>
  );
}
